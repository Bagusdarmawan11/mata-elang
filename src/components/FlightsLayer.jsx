import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { getAirline } from '../data/airlines.js'

// ── VERTICAL TREND ────────────────────────────────────────
function vTrend(vrMs) {
  if (!vrMs || Math.abs(vrMs) < 0.5) return { icon:'→', label:'Level',      color:'#94a3b8' }
  if (vrMs > 5)   return { icon:'↑↑', label:'Naik cepat',  color:'#10b981' }
  if (vrMs > 0.5) return { icon:'↑',  label:'Naik',         color:'#10b981' }
  if (vrMs < -5)  return { icon:'↓↓', label:'Turun cepat', color:'#f43f5e' }
  return              { icon:'↓',  label:'Turun',        color:'#f59e0b' }
}

// ── PLANE ICON ────────────────────────────────────────────
const planeIco = (hdg=0, indo=false) => L.divIcon({
  className: '',
  html: `<svg width="13" height="15" viewBox="0 0 13 15">
    <polygon points="6.5,0 13,15 6.5,11 0,15"
      fill="${indo ? '#f59e0b' : '#06b6d4'}" opacity=".93"
      transform="rotate(${hdg},6.5,7.5)"/>
    ${indo ? '' : ''}
  </svg>`,
  iconSize:[13,15], iconAnchor:[6,7], popupAnchor:[0,-9],
})

// ── POPUP ─────────────────────────────────────────────────
function mkPopup(f) {
  const airline = getAirline(f.callsign)
  const trend   = vTrend(f.vrMs)
  const indo    = airline?.flag === '🇮🇩'
  const title   = `${indo ? '🇮🇩 ' : ''}✈ ${f.callsign}`

  const rows = [
    ['Maskapai',   airline ? `${airline.flag} ${airline.name}` : (f.country || '—')],
    ['Altitude',   f.altM  ? `${f.altM.toLocaleString()} m`   : '—'],
    ['Kecepatan',  f.velKmh? `${f.velKmh} km/j`               : '—'],
    ['Heading',    `${Math.round(f.hdg)}°`],
    ['Vertikal',   `${trend.icon} ${trend.label}`,              trend.color],
    f.type ? ['Tipe', f.type] : null,
    f.reg  ? ['Registrasi', f.reg] : null,
    ['ICAO24',     f.icao],
  ].filter(Boolean)

  return `<div style="font-family:monospace;min-width:190px">
    <div style="color:#06b6d4;font-size:11px;font-weight:600;margin-bottom:7px;
      padding-bottom:5px;border-bottom:1px solid rgba(30,60,100,.5)">${title}</div>
    ${rows.map(([k,v,c])=>`
      <div style="display:flex;justify-content:space-between;gap:10px;
        margin-bottom:3px;font-size:10px">
        <span style="color:#475569;flex-shrink:0">${k}</span>
        <span style="color:${c||'#e2e8f0'};text-align:right">${v}</span>
      </div>`).join('')}
  </div>`
}

// ── CLUSTER FACTORY ───────────────────────────────────────
function makeCluster() {
  return L.markerClusterGroup({
    maxClusterRadius: 45,
    iconCreateFunction: c => L.divIcon({
      className: '',
      html: `<div style="
        width:34px;height:34px;border-radius:50%;
        background:rgba(6,182,212,.12);
        border:1px solid rgba(6,182,212,.5);
        display:flex;align-items:center;justify-content:center;
        font-family:monospace;font-size:11px;font-weight:700;
        color:#06b6d4;box-shadow:0 0 8px rgba(6,182,212,.2)
      ">${c.getChildCount()}</div>`,
      iconSize:[34,34], iconAnchor:[17,17],
    }),
  })
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function FlightsLayer({ data, onSelect }) {
  const map = useMap()
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) map.removeLayer(ref.current)
    const cluster = makeCluster()

    data.forEach(f => {
      if (!f.lat || !f.lon) return
      const airline = getAirline(f.callsign)
      const trend   = vTrend(f.vrMs)
      const indo    = airline?.flag === '🇮🇩'

      const m = L.marker([f.lat, f.lon], { icon: planeIco(f.hdg, indo) })
      m.bindPopup(mkPopup(f))
      m.on('click', () => onSelect({
        title: `${indo ? '🇮🇩 ' : ''}✈ ${f.callsign}`,
        rows: [
          ['Maskapai',  airline ? `${airline.flag} ${airline.name}` : f.country || '—'],
          ['Altitude',  f.altM  ? `${f.altM.toLocaleString()} m`   : '—'],
          ['Kecepatan', f.velKmh? `${f.velKmh} km/j`               : '—'],
          ['Heading',   `${Math.round(f.hdg)}°`],
          ['Vertikal',  `${trend.icon} ${trend.label}`],
          ...(f.type ? [['Tipe', f.type]] : []),
          ...(f.reg  ? [['Reg',  f.reg ]] : []),
          ['Sumber',    f.source || '—'],
        ],
      }))
      cluster.addLayer(m)
    })

    map.addLayer(cluster)
    ref.current = cluster
    return () => { if (ref.current) map.removeLayer(ref.current) }
  }, [data, map, onSelect])

  return null
}
