import { useState, useEffect, useCallback } from 'react'

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
      const active = (json.states || []).filter(s => s[5] && s[6] && !s[8])
      setData(active)
      setStatus('ok')
    } catch (e) {
      setStatus('error')
      console.warn('OpenSky:', e.message)
    }
  }, [enabled])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 30_000)
    return () => clearInterval(interval)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData([]) }, [enabled])

  return { data, status, count: data.length }
}

// ── EARTHQUAKES ──────────────────────────────────────────
export function useQuakes(enabled) {
  const [data, setData] = useState([])

  const fetch_ = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
      )
      const json = await res.json()
      const indo = json.features.filter(f => {
        const [lon, lat] = f.geometry.coordinates
        return lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141
      })
      setData(indo)
    } catch (e) {
      console.warn('USGS:', e.message)
    }
  }, [enabled])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 300_000)
    return () => clearInterval(interval)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData([]) }, [enabled])

  return { data, count: data.length }
}

// ── ISS ──────────────────────────────────────────────────
export function useISS(enabled) {
  const [data, setData] = useState(null)

  const fetch_ = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.warn('ISS:', e.message)
    }
  }, [enabled])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 5_000)
    return () => clearInterval(interval)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData(null) }, [enabled])

  return { data }
}

// ── FIRES ────────────────────────────────────────────────
export function useFires(enabled, firmsKey) {
  const [data, setData] = useState([])
  const [status, setStatus] = useState('idle')

  const fetch_ = useCallback(async () => {
    if (!enabled || !firmsKey) return
    setStatus('loading')
    try {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey}/VIIRS_NOAA20_NRT/95,-11,141,6/1`
      const res = await fetch(url)
      const txt = await res.text()
      const lines = txt.trim().split('\n')
      const h = lines[0].split(',')
      const iLat = h.indexOf('latitude')
      const iLon = h.indexOf('longitude')
      const iBr  = h.indexOf('bright_ti4')
      const iCf  = h.indexOf('confidence')
      const points = lines.slice(1, 1001).map(l => {
        const c = l.split(',')
        return {
          lat: parseFloat(c[iLat]),
          lon: parseFloat(c[iLon]),
          bright: c[iBr],
          conf: c[iCf],
        }
      }).filter(p => !isNaN(p.lat) && !isNaN(p.lon))
      setData(points)
      setStatus('ok')
    } catch (e) {
      setStatus('error')
      console.warn('FIRMS:', e.message)
    }
  }, [enabled, firmsKey])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 600_000)
    return () => clearInterval(interval)
  }, [fetch_])

  useEffect(() => { if (!enabled) setData([]) }, [enabled])

  return { data, status, count: data.length }
}
