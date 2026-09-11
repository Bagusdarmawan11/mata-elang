import { useState, useEffect, useCallback } from 'react'

// ── NORMALIZE ke format seragam ───────────────────────────
function fromReadsb(ac) {
  // Format adsb.fi / adsb.lol (readsb JSON)
  if (!ac.lat || !ac.lon) return null
  if (ac.alt_baro === 'ground') return null
  const altFt = typeof ac.alt_baro === 'number' ? ac.alt_baro : null
  return {
    icao:     (ac.hex || '').toLowerCase(),
    callsign: (ac.flight || '').trim() || ac.hex || '?',
    lat:      ac.lat,
    lon:      ac.lon,
    altM:     altFt ? Math.round(altFt * 0.3048) : null,   // ft → m
    velKmh:   ac.gs  ? Math.round(ac.gs  * 1.852) : null,  // knot → km/j
    hdg:      ac.track || 0,
    vrMs:     ac.baro_rate ? ac.baro_rate * 0.00508 : 0,   // ft/min → m/s
    type:     ac.t  || '',
    reg:      ac.r  || '',
    country:  '',
    source:   'adsb',
  }
}

function fromOpenSky(s) {
  // Format OpenSky array
  return {
    icao:     s[0] || '?',
    callsign: (s[1] || '').trim() || s[0] || '?',
    lat:      s[6],
    lon:      s[5],
    altM:     s[7] ? Math.round(s[7]) : null,
    velKmh:   s[9] ? Math.round(s[9] * 3.6) : null,
    hdg:      s[10] || 0,
    vrMs:     s[11] || 0,
    type:     '',
    reg:      '',
    country:  s[2] || '',
    source:   'opensky',
  }
}

// ── SOURCE 1: adsb.fi (gratis, tanpa key, paling stabil) ─
async function tryADSBFi() {
  // Query 2 titik untuk cover seluruh Indonesia
  const queries = [
    'https://api.adsb.fi/v1/flights?lat=1&lon=108&radius=800',  // Barat
    'https://api.adsb.fi/v1/flights?lat=-3&lon=129&radius=800', // Timur
  ]
  const results = await Promise.all(
    queries.map(url =>
      fetch(url, { signal: AbortSignal.timeout(10000) })
        .then(r => r.ok ? r.json() : { ac: [] })
        .catch(() => ({ ac: [] }))
    )
  )
  const seen = new Set()
  const flights = []
  results.forEach(json => {
    ;(json.ac || []).forEach(ac => {
      if (!seen.has(ac.hex)) {
        const f = fromReadsb(ac)
        if (f) { flights.push(f); seen.add(ac.hex) }
      }
    })
  })
  if (flights.length === 0) throw new Error('adsb.fi: no data')
  return { flights, source: 'adsb.fi' }
}

// ── SOURCE 2: adsb.lol (fallback) ────────────────────────
async function tryADSBLol() {
  const queries = [
    'https://api.adsb.lol/v2/lat/0/lon/108/dist/900',
    'https://api.adsb.lol/v2/lat/-3/lon/129/dist/900',
  ]
  const results = await Promise.all(
    queries.map(url =>
      fetch(url, { signal: AbortSignal.timeout(10000) })
        .then(r => r.ok ? r.json() : { ac: [] })
        .catch(() => ({ ac: [] }))
    )
  )
  const seen = new Set()
  const flights = []
  results.forEach(json => {
    ;(json.ac || []).forEach(ac => {
      if (!seen.has(ac.hex)) {
        const f = fromReadsb(ac)
        if (f) { flights.push(f); seen.add(ac.hex) }
      }
    })
  })
  if (flights.length === 0) throw new Error('adsb.lol: no data')
  return { flights, source: 'adsb.lol' }
}

// ── SOURCE 3: OpenSky (fallback terakhir) ─────────────────
async function tryOpenSky(username = '', password = '') {
  const headers = {}
  if (username && password) {
    headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`)
  }
  const url = 'https://opensky-network.org/api/states/all?lamin=-11&lamax=6&lomin=95&lomax=141'
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(12000),
  })
  if (res.status === 429) throw new Error('OpenSky: rate limited')
  if (res.status === 401) throw new Error('OpenSky: username/password salah')
  if (!res.ok) throw new Error(`OpenSky: HTTP ${res.status}`)
  const json = await res.json()
  const flights = (json.states || [])
    .filter(s => s[5] && s[6] && !s[8])
    .map(fromOpenSky)
  return { flights, source: 'OpenSky' }
}

// ── MAIN HOOK ─────────────────────────────────────────────
export function useFlights(enabled, oskUser = '', oskPass = '') {
  const [data,    setData]    = useState([])
  const [status,  setStatus]  = useState('idle')   // idle|loading|ok|error
  const [source,  setSource]  = useState('')        // which source succeeded
  const [errMsg,  setErrMsg]  = useState('')

  const fetchFlights = useCallback(async () => {
    if (!enabled) return

    // Check cache (avoid hammering APIs on every render)
    try {
      const cached = sessionStorage.getItem('me_flights_v2')
      if (cached) {
        const { pts, ts } = JSON.parse(cached)
        if (Date.now() - ts < 20_000) {        // use if < 20s old
          setData(pts)
          setStatus('ok')
          return
        }
      }
    } catch (_) {}

    setStatus('loading')
    const errors = []

    // Try each source in order
    const sources = [
      () => tryADSBFi(),
      () => tryADSBLol(),
      () => tryOpenSky(oskUser, oskPass),
    ]

    for (const trySource of sources) {
      try {
        const { flights, source } = await trySource()
        setData(flights)
        setStatus('ok')
        setSource(source)
        setErrMsg('')
        sessionStorage.setItem('me_flights_v2', JSON.stringify({ pts: flights, ts: Date.now() }))
        return
      } catch (e) {
        errors.push(e.message)
      }
    }

    // All sources failed — try stale cache
    try {
      const stale = sessionStorage.getItem('me_flights_v2')
      if (stale) {
        const { pts } = JSON.parse(stale)
        setData(pts)
        setStatus('stale')
        setErrMsg('Data lama. ' + errors.slice(-1)[0])
        return
      }
    } catch (_) {}

    setStatus('error')
    setErrMsg(errors.join(' | '))
  }, [enabled, oskUser, oskPass])

  useEffect(() => {
    fetchFlights()
    const id = setInterval(fetchFlights, 20_000) // refresh tiap 20 detik
    return () => clearInterval(id)
  }, [fetchFlights])

  useEffect(() => {
    if (!enabled) { setData([]); setStatus('idle'); setSource(''); setErrMsg('') }
  }, [enabled])

  return { data, status, source, errMsg, count: data.length }
}
