import { useState, useEffect, useCallback, useRef } from 'react'

const INDO = { lamin:-11, lamax:6, lomin:95, lomax:141 }

// ── FLIGHTS (with session cache to avoid rate limiting) ───
export function useFlights(enabled) {
  const [data,   setData]   = useState([])
  const [status, setStatus] = useState('idle')

  const fetch_ = useCallback(async () => {
    if (!enabled) return

    // Check sessionStorage cache (avoid hitting rate limit on every load)
    try {
      const cached = sessionStorage.getItem('me_flights')
      if (cached) {
        const { pts, ts } = JSON.parse(cached)
        const age = Date.now() - ts
        if (age < 55_000) { // use cache if < 55 seconds old
          setData(pts); setStatus('ok'); return
        }
      }
    } catch(_) {}

    setStatus('loading')
    try {
      const { lamin, lamax, lomin, lomax } = INDO
      const res = await fetch(
        `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`
      )
      if (res.status === 429) {
        // Try stale cache
        const stale = sessionStorage.getItem('me_flights')
        if (stale) { const { pts } = JSON.parse(stale); setData(pts) }
        setStatus('ratelimit'); return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const pts = (json.states||[]).filter(s => s[5]&&s[6]&&!s[8])
      setData(pts); setStatus('ok')
      sessionStorage.setItem('me_flights', JSON.stringify({ pts, ts: Date.now() }))
    } catch(e) {
      const stale = sessionStorage.getItem('me_flights')
      if (stale) { const { pts } = JSON.parse(stale); setData(pts); setStatus('stale') }
      else setStatus('error')
    }
  }, [enabled])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 60_000)
    return () => clearInterval(id)
  }, [fetch_])

  useEffect(() => { if (!enabled) { setData([]); setStatus('idle') } }, [enabled])
  return { data, status, count: data.length }
}

// ── SHIPS (AISStream WebSocket) ───────────────────────────
export function useShips(enabled, aisKey) {
  const [ships,   setShips]   = useState(new Map())
  const [wsState, setWsState] = useState('idle')
  const wsRef   = useRef(null)
  const pingRef = useRef(null)
  const retryRef = useRef(null)

  const connect = useCallback(() => {
    if (!enabled || !aisKey?.trim()) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    setWsState('connecting')

    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream')
    wsRef.current = ws

    ws.onopen = () => {
      setWsState('connected')
      ws.send(JSON.stringify({
        APIKey: aisKey.trim(),
        BoundingBoxes: [[[-11, 95], [6, 141]]],
        FilterMessageTypes: ['PositionReport'],
      }))
      clearInterval(pingRef.current)
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('{"ping":1}')
      }, 25_000)
    }
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d.MessageType !== 'PositionReport') return
        const { MMSI, ShipName, latitude, longitude } = d.MetaData
        if (!latitude||!longitude||!MMSI) return
        const pr = d.Message?.PositionReport||{}
        setShips(prev => {
          const n = new Map(prev)
          n.set(MMSI, { mmsi:MMSI, name:(ShipName||'').trim()||`${MMSI}`, lat:latitude, lon:longitude, speed:pr.Sog||0, heading:pr.TrueHeading||pr.Cog||0, navStatus:pr.NavigationalStatus??-1, ts:Date.now() })
          return n
        })
      } catch(_) {}
    }
    ws.onerror = () => setWsState('error')
    ws.onclose = () => {
      clearInterval(pingRef.current)
      setWsState('disconnected')
      if (enabled) retryRef.current = setTimeout(connect, 5000)
    }
  }, [enabled, aisKey])

  useEffect(() => {
    if (!enabled || !aisKey?.trim()) return
    connect()
    return () => {
      clearTimeout(retryRef.current); clearInterval(pingRef.current)
      wsRef.current?.close(); wsRef.current = null
    }
  }, [enabled, aisKey, connect])

  // Prune stale ships
  useEffect(() => {
    const id = setInterval(() => {
      setShips(p => { const n=new Map(); const c=Date.now()-600_000; p.forEach((s,k)=>{ if(s.ts>c)n.set(k,s) }); return n })
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { if (!enabled) { setShips(new Map()); setWsState('idle') } }, [enabled])
  return { ships: Array.from(ships.values()), count: ships.size, wsState }
}

// ── USGS EARTHQUAKES ─────────────────────────────────────
export function useQuakes(enabled) {
  const [data, setData] = useState([])
  const f = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
      const j = await res.json()
      setData(j.features.filter(f => { const[lon,lat]=f.geometry.coordinates; return lat>=-11&&lat<=6&&lon>=95&&lon<=141 }))
    } catch(_) {}
  }, [enabled])
  useEffect(() => { f(); const id=setInterval(f,300_000); return ()=>clearInterval(id) }, [f])
  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, count: data.length }
}

// ── BMKG EARTHQUAKES ─────────────────────────────────────
export function useBMKGQuakes(enabled) {
  const [data, setData] = useState([])
  const f = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json')
      const j = await res.json()
      setData((j?.Infogempa?.gempa||[]).map(q => {
        const[lat,lon]=(q.Coordinates||'0,0').split(',').map(Number)
        return {lat,lon,mag:parseFloat(q.Magnitude),depth:q.Kedalaman,wilayah:q.Wilayah,potensi:q.Potensi,waktu:q.Jam,tanggal:q.Tanggal,dirasakan:q.Dirasakan||'—'}
      }))
    } catch(_) {}
  }, [enabled])
  useEffect(() => { f(); const id=setInterval(f,120_000); return ()=>clearInterval(id) }, [f])
  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, count: data.length }
}

// ── ISS ───────────────────────────────────────────────────
export function useISS(enabled) {
  const [data, setData] = useState(null)
  const f = useCallback(async () => {
    if (!enabled) return
    try { const r=await fetch('https://api.wheretheiss.at/v1/satellites/25544'); setData(await r.json()) } catch(_) {}
  }, [enabled])
  useEffect(() => { f(); const id=setInterval(f,5_000); return ()=>clearInterval(id) }, [f])
  useEffect(() => { if (!enabled) setData(null) }, [enabled])
  return { data }
}

// ── FIRES (NASA FIRMS — 2 area queries for full coverage) ─
export function useFires(enabled, firmsKey) {
  const [data,   setData]   = useState([])
  const [status, setStatus] = useState('idle')
  const f = useCallback(async () => {
    if (!enabled||!firmsKey?.trim()) return
    setStatus('loading')
    try {
      const urls=[
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey.trim()}/VIIRS_NOAA20_NRT/94,-11,120,7/1`,
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey.trim()}/VIIRS_NOAA20_NRT/118,-11,141,7/1`,
      ]
      const txts = await Promise.all(urls.map(u=>fetch(u).then(r=>r.text())))
      const pts=[]
      txts.forEach(txt => {
        const lines=txt.trim().split('\n'); const h=lines[0].split(',')
        const[iL,iO,iB,iC,iD]=['latitude','longitude','bright_ti4','confidence','acq_date'].map(k=>h.indexOf(k))
        lines.slice(1).forEach(l => { const c=l.split(','); const lat=parseFloat(c[iL]),lon=parseFloat(c[iO]); if(!isNaN(lat)&&!isNaN(lon)) pts.push({lat,lon,bright:c[iB]?parseFloat(c[iB]).toFixed(1):'—',conf:c[iC]||'—',date:c[iD]||'—'}) })
      })
      setData(pts); setStatus('ok')
    } catch(e) { setStatus('error') }
  }, [enabled, firmsKey])
  useEffect(() => { f(); const id=setInterval(f,600_000); return ()=>clearInterval(id) }, [f])
  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, status, count: data.length }
}

// ── WEATHER (Open-Meteo, no key, 60+ cities, batched) ────
export function useWeather(enabled, cities) {
  const [data, setData] = useState([])
  const f = useCallback(async () => {
    if (!enabled||!cities?.length) return
    try {
      const chunks=[]; for(let i=0;i<cities.length;i+=20)chunks.push(cities.slice(i,i+20))
      const all=[]
      for(const ch of chunks){
        const lat=ch.map(c=>c.lat).join(','),lon=ch.map(c=>c.lon).join(',')
        const res=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia%2FJakarta&forecast_days=3`)
        const j=await res.json(); const arr=Array.isArray(j)?j:[j]
        arr.forEach((w,i)=>all.push({city:ch[i],temp:w.current?.temperature_2m,humidity:w.current?.relative_humidity_2m,windSpeed:w.current?.wind_speed_10m,weatherCode:w.current?.weather_code,daily:{maxTemp:w.daily?.temperature_2m_max?.[0],minTemp:w.daily?.temperature_2m_min?.[0],rainProb:w.daily?.precipitation_probability_max?.[0],tomorrow:{code:w.daily?.weather_code?.[1],max:w.daily?.temperature_2m_max?.[1],rainProb:w.daily?.precipitation_probability_max?.[1]}}}))
      }
      setData(all)
    } catch(_) {}
  }, [enabled, cities])
  useEffect(() => { f(); const id=setInterval(f,1_800_000); return ()=>clearInterval(id) }, [f])
  useEffect(() => { if (!enabled) setData([]) }, [enabled])
  return { data, count: data.length }
}

// ── VOLCANOES + ASH WIND DATA ─────────────────────────────
export function useVolcanoes(enabled, staticData) {
  const [data, setData] = useState(staticData||[])

  const f = useCallback(async () => {
    if (!enabled) return
    try {
      // Get wind data for active volcanoes (level 2+) to show ash plume direction
      const active = (staticData||[]).filter(v => v.level >= 2)
      if (active.length === 0) return

      const lats = active.map(v => v.lat).join(',')
      const lons = active.map(v => v.lon).join(',')
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=wind_speed_10m,wind_direction_10m&timezone=auto`
      )
      const json = await res.json()
      const winds = Array.isArray(json) ? json : [json]

      // Merge wind data into volcano objects
      const enriched = (staticData||[]).map(sv => {
        const idx = active.findIndex(a => a.name === sv.name)
        if (idx >= 0 && winds[idx]) {
          return {
            ...sv,
            windDir: winds[idx].current?.wind_direction_10m,
            windSpeed: winds[idx].current?.wind_speed_10m,
          }
        }
        return sv
      })
      setData(enriched)
    } catch(_) { setData(staticData||[]) }
  }, [enabled, staticData])

  useEffect(() => { f(); const id=setInterval(f,1_800_000); return ()=>clearInterval(id) }, [f])
  useEffect(() => { if (!enabled) setData(staticData||[]) }, [enabled, staticData])
  return { data, count: data.length }
}

// ── WEATHER HELPERS ───────────────────────────────────────
export function weatherEmoji(c){
  if(c===0)return'☀️';if(c<=3)return'⛅';if(c<=48)return'🌫️';if(c<=57)return'🌦️';if(c<=67)return'🌧️';if(c<=77)return'❄️';if(c<=82)return'🌦️';if(c<=99)return'⛈️';return'🌤️'
}
export function weatherDesc(c){
  if(c===0)return'Cerah';if(c<=2)return'Cerah berawan';if(c===3)return'Mendung';if(c<=48)return'Berkabut';if(c<=57)return'Gerimis';if(c<=67)return'Hujan';if(c<=77)return'Salju';if(c<=82)return'Hujan lokal';if(c<=99)return'Hujan petir';return'—'
}
