import { useState, useEffect, useCallback } from 'react'

// ── NORMALIZE: adsb.lol/adsb.fi format → object seragam ─
function fromReadsb(ac) {
  if (!ac.lat || !ac.lon) return null
  if (ac.alt_baro === 'ground') return null

  const altFt = typeof ac.alt_baro === 'number' ? ac.alt_baro : null

  return {
    icao:     (ac.hex || '').toLowerCase(),
    callsign: (ac.flight || '').trim() || (ac.hex || '?'),
    lat:      ac.lat,
    lon:      ac.lon,
    altM:     altFt != null ? Math.round(altFt * 0.3048) : null,  // ft → m
    velKmh:   ac.gs   ? Math.round(ac.gs   * 1.852)       : null, // knot → km/j
    hdg:      ac.track || 0,
    vrMs:     ac.baro_rate ? ac.baro_rate * 0.00508 : 0,          // ft/min → m/s
    type:     ac.t  || '',
    reg:      ac.r  || '',
    country:  '',
    source:   'adsb.lol',
  }
}

// ── SOURCE A: Vercel serverless /api/flights ──────────────
// Panggil fungsi serverless kita sendiri — tidak ada CORS karena
// request dari browser ke origin yang sama (mata-elang.vercel.app)
async function tryOwnAPI() {
  const res = await fetch('/api/flights', {
    signal: AbortSignal.timeout(12000),
  })
  // Kalau 404 = lagi di localhost tanpa serverless → lempar error, coba sumber lain
  if (res.status === 404) throw new Error('serverless not available (localhost)')
  if (!res.ok) throw new Error(`/api/flights HTTP ${res.status}`)

  const json = await res.json()
  if (json.error) throw new Error(json.error)

  const flights = (json.ac || []).map(fromReadsb).filter(Boolean)
  if (flights.length === 0) throw new Error('/api/flights: 0 pesawat')
  return { flights, source: `adsb.lol (${flights.length})` }
}

// ── SOURCE B: adsb.lol langsung (untuk localhost dev) ─────
// Di production Vercel sudah ditangani SOURCE A.
// Ini fallback kalau developer jalanin lokal.
const LOL_QUERIES = [
  { lat:  1.0, lon: 106.0, dist: 250 },
  { lat: -2.0, lon: 118.0, dist: 250 },
  { lat: -3.0, lon: 133.0, dist: 250 },
]

async function tryADSBLolDirect() {
  const results = await Promise.all(
    LOL_QUERIES.map(q =>
      fetch(
        `https://api.adsb.lol/v2/lat/${q.lat}/lon/${q.lon}/dist/${q.dist}`,
        { signal: AbortSignal.timeout(8000) }
      )
        .then(r => r.ok ? r.json() : { ac: [] })
        .catch(() => ({ ac: [] }))
    )
  )

  const seen = new Set()
  const flights = []
  results.forEach(r => {
    ;(r.ac || []).forEach(ac => {
      if (!seen.has(ac.hex)) {
        const f = fromReadsb(ac)
        if (f) { flights.push(f); seen.add(ac.hex) }
      }
    })
  })

  if (flights.length === 0) throw new Error('adsb.lol direct: 0 pesawat (CORS?)')
  return { flights, source: `adsb.lol direct (${flights.length})` }
}

// ── SOURCE C: OpenSky (last resort) ──────────────────────
async function tryOpenSky(user = '', pass = '') {
  const headers = {}
  if (user && pass) {
    headers['Authorization'] = 'Basic ' + btoa(`${user}:${pass}`)
  }
  const res = await fetch(
    'https://opensky-network.org/api/states/all?lamin=-11&lamax=6&lomin=95&lomax=141',
    { headers, signal: AbortSignal.timeout(12000) }
  )
  if (res.status === 429) throw new Error('OpenSky: rate limited (coba lagi 1 menit)')
  if (res.status === 401) throw new Error('OpenSky: username/password salah')
  if (!res.ok) throw new Error(`OpenSky: HTTP ${res.status}`)

  const json = await res.json()
  const flights = (json.states || [])
    .filter(s => s[5] && s[6] && !s[8])
    .map(s => ({
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
      source:   'OpenSky',
    }))

  if (flights.length === 0) throw new Error('OpenSky: 0 pesawat')
  return { flights, source: `OpenSky (${flights.length})` }
}

// ── MAIN HOOK ─────────────────────────────────────────────
export function useFlights(enabled, oskUser = '', oskPass = '') {
  const [data,   setData]   = useState([])
  const [status, setStatus] = useState('idle')
  const [source, setSource] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const fetchAll = useCallback(async () => {
    if (!enabled) return

    // Pakai cache kalau masih fresh (< 18 detik)
    try {
      const raw = sessionStorage.getItem('me_flights_v3')
      if (raw) {
        const { pts, ts } = JSON.parse(raw)
        if (Date.now() - ts < 18_000) {
          setData(pts); setStatus('ok'); return
        }
      }
    } catch (_) {}

    setStatus('loading')

    const tryList = [
      { name: 'vercel-api',   fn: tryOwnAPI },
      { name: 'adsb-direct',  fn: () => tryADSBLolDirect() },
      { name: 'opensky',      fn: () => tryOpenSky(oskUser, oskPass) },
    ]

    const errors = []

    for (const { name, fn } of tryList) {
      try {
        const { flights, source } = await fn()
        setData(flights)
        setStatus('ok')
        setSource(source)
        setErrMsg('')
        sessionStorage.setItem('me_flights_v3', JSON.stringify({ pts: flights, ts: Date.now() }))
        return
      } catch (e) {
        errors.push(`[${name}] ${e.message}`)
      }
    }

    // Semua gagal — coba tampilkan data lama
    try {
      const raw = sessionStorage.getItem('me_flights_v3')
      if (raw) {
        const { pts } = JSON.parse(raw)
        setData(pts)
        setStatus('stale')
        setErrMsg('Pakai data lama. ' + errors.at(-1))
        return
      }
    } catch (_) {}

    setStatus('error')
    setErrMsg(errors.join(' → '))
  }, [enabled, oskUser, oskPass])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 20_000) // refresh tiap 20 detik
    return () => clearInterval(id)
  }, [fetchAll])

  useEffect(() => {
    if (!enabled) { setData([]); setStatus('idle'); setSource(''); setErrMsg('') }
  }, [enabled])

  return { data, status, source, errMsg, count: data.length }
}
