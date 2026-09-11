import { useState, useEffect, useCallback, useRef } from 'react'

const INDO = { lamin: -11, lamax: 6, lomin: 95, lomax: 141 }

// ── FLIGHTS ──────────────────────────────────────────────
export function useFlights(enabled) {
  const [data, setData] = useState([])
  const [status, setStatus] = useState('idle')

  const fetch_ = useCallback(async () => {
    if (!enabled) return
    setStatus('loading')
    try {
      const { lamin, lamax, lomin, lomax } = INDO
      const res = await fetch(
        `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData((json.states || []).filter(s => s[5] && s[6] && !s[8]))
      setStatus('ok')
    } catch (e) {
      setStatus('error')
    }
  }, [enabled])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 30_000)
    return () => clearInterval(id)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, status, count: data.length }
}

// ── SHIPS (AISStream WebSocket) ───────────────────────────
export function useShips(enabled, aisKey) {
  const [ships, setShips] = useState(new Map())
  const wsRef = useRef(null)

  useEffect(() => {
    if (!enabled || !aisKey) return
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        APIKey: aisKey,
        BoundingBoxes: [[[-11, 95], [6, 141]]],
        FilterMessageTypes: ['PositionReport'],
      }))
    }

    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data)
        if (d.MessageType !== 'PositionReport') return
        const { MMSI, ShipName, latitude, longitude } = d.MetaData
        const pr = d.Message?.PositionReport || {}
        setShips(prev => {
          const next = new Map(prev)
          next.set(MMSI, {
            mmsi: MMSI,
            name: (ShipName || '').trim() || `MMSI ${MMSI}`,
            lat: latitude, lon: longitude,
            speed: pr.Sog || 0,
            heading: pr.TrueHeading || pr.Cog || 0,
            navStatus: pr.NavigationalStatus ?? -1,
            ts: Date.now(),
          })
          return next
        })
      } catch (_) {}
    }

    ws.onerror = () => {}
    return () => { ws.close(); wsRef.current = null }
  }, [enabled, aisKey])

  // Prune stale ships every minute
  useEffect(() => {
    const id = setInterval(() => {
      setShips(prev => {
        const next = new Map()
        const cutoff = Date.now() - 600_000
        prev.forEach((s, k) => { if (s.ts > cutoff) next.set(k, s) })
        return next
      })
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { if (!enabled) setShips(new Map()) }, [enabled])
  return { ships: Array.from(ships.values()), count: ships.size }
}

// ── EARTHQUAKES (USGS) ────────────────────────────────────
export function useQuakes(enabled) {
  const [data, setData] = useState([])

  const fetch_ = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
      )
      const json = await res.json()
      setData(json.features.filter(f => {
        const [lon, lat] = f.geometry.coordinates
        return lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141
      }))
    } catch (e) { console.warn('USGS:', e.message) }
  }, [enabled])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 300_000)
    return () => clearInterval(id)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, count: data.length }
}

// ── BMKG EARTHQUAKE ───────────────────────────────────────
export function useBMKGQuakes(enabled) {
  const [data, setData] = useState([])

  const fetch_ = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json')
      const json = await res.json()
      const list = json?.Infogempa?.gempa || []
      setData(list.map(q => {
        const [lat, lon] = (q.Coordinates || '0,0').split(',').map(Number)
        return {
          lat, lon,
          mag: parseFloat(q.Magnitude),
          depth: q.Kedalaman,
          wilayah: q.Wilayah,
          potensi: q.Potensi,
          waktu: q.Jam,
          tanggal: q.Tanggal,
          dirasakan: q.Dirasakan || '—',
        }
      }))
    } catch (e) { console.warn('BMKG quake:', e.message) }
  }, [enabled])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 120_000)
    return () => clearInterval(id)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, count: data.length }
}

// ── ISS ───────────────────────────────────────────────────
export function useISS(enabled) {
  const [data, setData] = useState(null)

  const fetch_ = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544')
      setData(await res.json())
    } catch (e) { console.warn('ISS:', e.message) }
  }, [enabled])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 5_000)
    return () => clearInterval(id)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData(null) }, [enabled])
  return { data }
}

// ── FIRES (NASA FIRMS) ────────────────────────────────────
export function useFires(enabled, firmsKey) {
  const [data, setData] = useState([])
  const [status, setStatus] = useState('idle')

  const fetch_ = useCallback(async () => {
    if (!enabled || !firmsKey) return
    setStatus('loading')
    try {
      // Split into 2 queries to get full Indonesia coverage
      const urls = [
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey}/VIIRS_NOAA20_NRT/95,-11,120,6/1`,
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey}/VIIRS_NOAA20_NRT/118,-11,141,6/1`,
      ]
      const results = await Promise.all(urls.map(u => fetch(u).then(r => r.text())))
      const points = []
      results.forEach(txt => {
        const lines = txt.trim().split('\n')
        const h = lines[0].split(',')
        const iLat = h.indexOf('latitude'), iLon = h.indexOf('longitude')
        const iBr  = h.indexOf('bright_ti4'), iCf = h.indexOf('confidence')
        const iDt  = h.indexOf('acq_date'),   iT  = h.indexOf('acq_time')
        lines.slice(1).forEach(l => {
          const c = l.split(',')
          const lat = parseFloat(c[iLat]), lon = parseFloat(c[iLon])
          if (isNaN(lat) || isNaN(lon)) return
          points.push({
            lat, lon,
            bright: c[iBr] ? parseFloat(c[iBr]).toFixed(1) : '—',
            conf: c[iCf] || '—',
            date: c[iDt] || '—',
            time: c[iT] || '—',
          })
        })
      })
      setData(points)
      setStatus('ok')
    } catch (e) {
      setStatus('error')
      console.warn('FIRMS:', e.message)
    }
  }, [enabled, firmsKey])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 600_000)
    return () => clearInterval(id)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, status, count: data.length }
}

// ── WEATHER (Open-Meteo, gratis, no key) ──────────────────
export function useWeather(enabled, cities) {
  const [data, setData] = useState([])

  const fetch_ = useCallback(async () => {
    if (!enabled || !cities?.length) return
    try {
      const lats = cities.map(c => c.lat).join(',')
      const lons = cities.map(c => c.lon).join(',')
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia%2FJakarta&forecast_days=3`
      const res = await fetch(url)
      const json = await res.json()
      // Open-Meteo returns array if multiple locations
      const arr = Array.isArray(json) ? json : [json]
      setData(arr.map((w, i) => ({
        city: cities[i],
        temp: w.current?.temperature_2m,
        humidity: w.current?.relative_humidity_2m,
        windSpeed: w.current?.wind_speed_10m,
        weatherCode: w.current?.weather_code,
        daily: {
          maxTemp: w.daily?.temperature_2m_max?.[0],
          minTemp: w.daily?.temperature_2m_min?.[0],
          rainProb: w.daily?.precipitation_probability_max?.[0],
          tomorrow: {
            code: w.daily?.weather_code?.[1],
            max: w.daily?.temperature_2m_max?.[1],
            min: w.daily?.temperature_2m_min?.[1],
            rainProb: w.daily?.precipitation_probability_max?.[1],
          },
        },
      })))
    } catch (e) { console.warn('Weather:', e.message) }
  }, [enabled, cities])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 1_800_000) // 30 min
    return () => clearInterval(id)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, count: data.length }
}

// ── WEATHER HELPERS ───────────────────────────────────────
export function weatherEmoji(code) {
  if (code === 0)          return '☀️'
  if (code <= 3)           return '⛅'
  if (code <= 48)          return '🌫️'
  if (code <= 57)          return '🌦️'
  if (code <= 67)          return '🌧️'
  if (code <= 77)          return '❄️'
  if (code <= 82)          return '🌦️'
  if (code <= 99)          return '⛈️'
  return '🌤️'
}

export function weatherDesc(code) {
  if (code === 0)            return 'Cerah'
  if (code <= 2)             return 'Cerah berawan'
  if (code === 3)            return 'Mendung'
  if (code <= 48)            return 'Berkabut'
  if (code <= 57)            return 'Gerimis'
  if (code <= 67)            return 'Hujan'
  if (code <= 77)            return 'Salju'
  if (code <= 82)            return 'Hujan lokal'
  if (code <= 99)            return 'Hujan petir'
  return 'Tidak diketahui'
}
