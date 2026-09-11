import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import { CCTV_DATA } from '../data/cctv.js'

// ── ICONS ────────────────────────────────────────────────
const planeIcon = (hdg = 0) => L.divIcon({
  className: '',
  html: `<svg width="10" height="12" viewBox="0 0 10 12">
    <polygon points="5,0 10,12 5,9 0,12" fill="#06b6d4" opacity=".9"
      transform="rotate(${hdg},5,6)"/>
  </svg>`,
  iconSize: [10, 12], iconAnchor: [5, 6], popupAnchor: [0, -8],
})

const issIcon = L.divIcon({
  className: '',
  html: `<svg width="22" height="22" viewBox="0 0 22 22">
    <circle cx="11" cy="11" r="3.5" fill="#10b981"/>
    <circle cx="11" cy="11" r="7" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>
    <line x1="1" y1="11" x2="21" y2="11" stroke="#10b981" stroke-width="1.5" opacity=".5"/>
    <line x1="11" y1="3" x2="11" y2="19" stroke="#10b981" stroke-width=".8" opacity=".35"/>
  </svg>`,
  iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -13],
})

const cctvIcon = L.divIcon({
  className: '',
  html: `<svg width="14" height="14" viewBox="0 0 14 14">
    <circle cx="7" cy="7" r="6" fill="rgba(139,92,246,.18)" stroke="#8b5cf6" stroke-width="1.5"/>
    <circle cx="7" cy="7" r="2.5" fill="#8b5cf6"/>
  </svg>`,
  iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -9],
})

// ── POPUP HELPERS ────────────────────────────────────────
const popup = (title, rows) => `
  <div style="font-family:'JetBrains Mono',monospace">
    <div style="color:#06b6d4;font-size:11px;font-weight:600;
      margin-bottom:7px;padding-bottom:5px;border-bottom:1px solid rgba(30,60,100,.5)">
      ${title}
    </div>
    ${rows.map(([k, v]) => `
      <div style="display:flex;justify-content:space-between;gap:12px;
        margin-bottom:3px;font-size:10px">
        <span style="color:#475569">${k}</span>
        <span style="color:#e2e8f0;text-align:right">${v}</span>
      </div>`).join('')}
  </div>`

// ── COORD TRACKER ────────────────────────────────────────
function CoordTracker({ onMove }) {
  useMapEvents({ mousemove: e => onMove(e.latlng) })
  return null
}

// ── FLIGHTS LAYER ────────────────────────────────────────
function FlightsLayer({ data, onSelect }) {
  const map = useMap()
  const clusterRef = useRef(null)

  useEffect(() => {
    if (clusterRef.current) map.removeLayer(clusterRef.current)
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: c => L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50%;
          background:rgba(6,182,212,.12);border:1px solid rgba(6,182,212,.4);
          display:flex;align-items:center;justify-content:center;
          font-family:'JetBrains Mono',monospace;font-size:10px;color:#06b6d4;font-weight:600">
          ${c.getChildCount()}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      }),
    })

    data.forEach(s => {
      const [icao, cs, cntry, , , lon, lat, alt, , vel, hdg] = s
      const call = (cs || icao || '???').trim()
      const m = L.marker([lat, lon], { icon: planeIcon(hdg || 0) })
      m.bindPopup(popup(`✈ ${call}`, [
        ['ICAO', icao || '—'],
        ['Negara', cntry || '—'],
        ['Altitude', alt ? `${Math.round(alt).toLocaleString()} m` : '—'],
        ['Kecepatan', vel ? `${Math.round(vel * 3.6)} km/j` : '—'],
        ['Heading', hdg ? `${Math.round(hdg)}°` : '—'],
      ]))
      m.on('click', () => onSelect({
        title: `✈ ${call}`,
        rows: [
          ['ICAO', icao || '—'], ['Negara', cntry || '—'],
          ['Altitude', alt ? `${Math.round(alt).toLocaleString()} m` : '—'],
          ['Kecepatan', vel ? `${Math.round(vel * 3.6)} km/j` : '—'],
        ],
      }))
      cluster.addLayer(m)
    })

    map.addLayer(cluster)
    clusterRef.current = cluster
    return () => { if (clusterRef.current) map.removeLayer(clusterRef.current) }
  }, [data, map, onSelect])

  return null
}

// ── ISS LAYER ────────────────────────────────────────────
function ISSLayer({ data, onSelect }) {
  if (!data) return null
  return (
    <Marker
      position={[data.latitude, data.longitude]}
      icon={issIcon}
      zIndexOffset={1000}
      eventHandlers={{
        click: () => onSelect({
          title: '🛰 ISS',
          rows: [
            ['Altitude', `${Math.round(data.altitude)} km`],
            ['Kecepatan', `${Math.round(data.velocity).toLocaleString()} km/j`],
            ['Visibility', data.visibility],
          ],
        }),
      }}
    >
    </Marker>
  )
}

// ── FIRES LAYER ──────────────────────────────────────────
function FiresLayer({ data }) {
  return data.map((p, i) => {
    const col = p.conf === 'h' ? '#f43f5e' : p.conf === 'n' ? '#f59e0b' : '#fb923c'
    return (
      <CircleMarker key={i} center={[p.lat, p.lon]}
        radius={3} pathOptions={{ fillColor: col, color: col, weight: 0, fillOpacity: 0.8 }}>
      </CircleMarker>
    )
  })
}

// ── TRAFFIC LAYER ─────────────────────────────────────────
function TrafficLayer({ tomtomKey }) {
  const map = useMap()
  useEffect(() => {
    if (!tomtomKey) return
    const tl = L.tileLayer(
      `https://api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=${tomtomKey}`,
      { opacity: 0.7, maxZoom: 18 }
    )
    tl.addTo(map)
    return () => map.removeLayer(tl)
  }, [map, tomtomKey])
  return null
}

// ── CCTV LAYER ───────────────────────────────────────────
function CCTVLayer({ onSelect }) {
  return CCTV_DATA.map(cam => (
    <Marker key={cam.id} position={[cam.lat, cam.lon]} icon={cctvIcon}
      eventHandlers={{
        click: () => onSelect({
          title: `📹 ${cam.name}`,
          rows: [['Kota', cam.city], ['Tipe', cam.type],
            ['URL', cam.url ? 'Tersedia' : 'Belum ada']],
          cctv: cam,
        }),
      }}>
    </Marker>
  ))
}

// ── MAIN MAPVIEW ─────────────────────────────────────────
export default function MapView({ layers, config, flights, quakes, iss, fires, onCoordsChange, onTargetSelect }) {
  return (
    <div id="map-wrap" style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <MapContainer
        center={[-2.5, 118]} zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        preferCanvas={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>'
          subdomains="abcd" maxZoom={19}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          subdomains="abcd" maxZoom={19}
        />

        <CoordTracker onMove={ll => onCoordsChange(ll)} />

        {layers.flights && <FlightsLayer data={flights.data} onSelect={onTargetSelect} />}

        {layers.quakes && quakes.data.map((f, i) => {
          const { mag, place, time } = f.properties
          const [lon, lat, dep] = f.geometry.coordinates
          const col = mag >= 6 ? '#f43f5e' : mag >= 5 ? '#f59e0b' : mag >= 4 ? '#fde047' : '#10b981'
          return (
            <CircleMarker key={i} center={[lat, lon]}
              radius={Math.max(5, mag * 5)}
              pathOptions={{ fillColor: col, color: col, weight: 1, opacity: 0.9, fillOpacity: 0.25 }}
              eventHandlers={{
                click: () => onTargetSelect({
                  title: `🌋 Gempa M${mag}`,
                  rows: [['Lokasi', place], ['Magnitude', `M${mag}`],
                    ['Kedalaman', `${dep} km`], ['Waktu', new Date(time).toLocaleTimeString('id-ID')]],
                }),
              }}>
            </CircleMarker>
          )
        })}

        {layers.iss && <ISSLayer data={iss.data} onSelect={onTargetSelect} />}
        {layers.fires && <FiresLayer data={fires.data} />}
        {layers.traffic && config.tomtom && <TrafficLayer tomtomKey={config.tomtom} />}
        {layers.cctv && <CCTVLayer onSelect={onTargetSelect} />}
      </MapContainer>
    </div>
  )
}
