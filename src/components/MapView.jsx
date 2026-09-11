import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import { CCTV_DATA } from '../data/cctv.js'
import { getRegion } from '../data/regions.js'
import { getAirline, getVerticalTrend, getNavStatus } from '../data/airlines.js'
import { weatherEmoji, weatherDesc } from '../hooks/useIntelData.js'

// ── ICONS ────────────────────────────────────────────────
const planeIco = (h=0,indo=false) => L.divIcon({className:'',
  html:`<svg width="12" height="14" viewBox="0 0 12 14"><polygon points="6,0 12,14 6,10 0,14" fill="${indo?'#f59e0b':'#06b6d4'}" opacity=".92" transform="rotate(${h},6,7)"/></svg>`,
  iconSize:[12,14],iconAnchor:[6,7],popupAnchor:[0,-9]})

const shipIco = (h=0,mv=true) => L.divIcon({className:'',
  html:`<svg width="10" height="14" viewBox="0 0 10 14"><polygon points="5,0 10,10 5,14 0,10" fill="${mv?'#22c55e':'#94a3b8'}" opacity=".88" transform="rotate(${h},5,7)"/></svg>`,
  iconSize:[10,14],iconAnchor:[5,7],popupAnchor:[0,-9]})

const issIco = L.divIcon({className:'',
  html:`<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="3.5" fill="#10b981"/><circle cx="11" cy="11" r="7" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/><line x1="1" y1="11" x2="21" y2="11" stroke="#10b981" stroke-width="1.5" opacity=".5"/><line x1="11" y1="3" x2="11" y2="19" stroke="#10b981" stroke-width=".8" opacity=".35"/></svg>`,
  iconSize:[22,22],iconAnchor:[11,11],popupAnchor:[0,-13]})

const cctvIco = L.divIcon({className:'',
  html:`<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="rgba(139,92,246,.18)" stroke="#8b5cf6" stroke-width="1.5"/><circle cx="7" cy="7" r="2.5" fill="#8b5cf6"/></svg>`,
  iconSize:[14,14],iconAnchor:[7,7],popupAnchor:[0,-9]})

const wxIco = (t,c) => L.divIcon({className:'',
  html:`<div style="background:rgba(8,20,40,.92);border:1px solid rgba(6,182,212,.4);border-radius:6px;padding:3px 7px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#e2e8f0;white-space:nowrap;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,.4)"><span style="font-size:12px">${weatherEmoji(c)}</span><span>${Math.round(t)}°C</span></div>`,
  iconSize:[68,24],iconAnchor:[34,12],popupAnchor:[0,-14]})

const volcIco = (level) => {
  const cols={1:'#10b981',2:'#f59e0b',3:'#f97316',4:'#f43f5e'}
  const col=cols[level]||'#94a3b8'
  return L.divIcon({className:'',
    html:`<div style="position:relative;width:24px;height:24px">
      <div style="position:absolute;inset:0;border-radius:50%;background:${col}22;border:2px solid ${col};animation:pulse-dot ${level>2?'1':'3'}s infinite"/>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px">🌋</div>
    </div>`,
    iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-14]})
}

// ── POPUP ────────────────────────────────────────────────
const mkP = (title,rows) => `<div style="font-family:'JetBrains Mono',monospace;min-width:190px">
  <div style="color:#06b6d4;font-size:11px;font-weight:600;margin-bottom:7px;padding-bottom:5px;border-bottom:1px solid rgba(30,60,100,.5)">${title}</div>
  ${rows.map(([k,v,c])=>`<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:3px;font-size:10px"><span style="color:#475569;flex-shrink:0">${k}</span><span style="color:${c||'#e2e8f0'};text-align:right;word-break:break-word;max-width:140px">${v}</span></div>`).join('')}
</div>`

// ── MAP CAPTURE (passes map ref to App) ──────────────────
function MapCapture({mapRef}){
  const map=useMap()
  useEffect(()=>{mapRef.current=map},[map,mapRef])
  return null
}
function CoordTracker({onMove}){useMapEvents({mousemove:e=>onMove(e.latlng)});return null}

function makeCluster(color='#06b6d4'){
  return L.markerClusterGroup({maxClusterRadius:40,iconCreateFunction:c=>L.divIcon({className:'',
    html:`<div style="width:30px;height:30px;border-radius:50%;background:${color}18;border:1px solid ${color}55;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:10px;color:${color};font-weight:600">${c.getChildCount()}</div>`,
    iconSize:[30,30],iconAnchor:[15,15]})})
}

// ── FLIGHTS ──────────────────────────────────────────────
function FlightsLayer({data,onSelect}){
  const map=useMap(),ref=useRef(null)
  useEffect(()=>{
    if(ref.current)map.removeLayer(ref.current)
    const cl=makeCluster('#06b6d4')
    data.forEach(s=>{
      const[icao,cs,cntry,,,lon,lat,alt,,vel,hdg,vr]=s
      if(!lat||!lon)return
      const call=(cs||icao||'???').trim()
      const airline=getAirline(call)
      const trend=getVerticalTrend(vr)
      const indo=airline?.flag==='🇮🇩'
      const m=L.marker([lat,lon],{icon:planeIco(hdg||0,indo)})
      m.bindPopup(mkP(`${indo?'🇮🇩 ':''}✈ ${call}`,[
        ['Maskapai',airline?`${airline.flag} ${airline.name}`:cntry||'—'],
        ['Altitude',alt?`${Math.round(alt).toLocaleString()} m`:'—'],
        ['Kecepatan',vel?`${Math.round(vel*3.6)} km/j`:'—'],
        ['Heading',hdg?`${Math.round(hdg)}°`:'—'],
        ['Vertikal',`${trend.icon} ${trend.label}`,trend.color],
        ['ICAO24',icao||'—'],
      ]))
      m.on('click',()=>onSelect({title:`✈ ${call}`,rows:[['Maskapai',airline?`${airline.flag} ${airline.name}`:cntry||'—'],['Altitude',alt?`${Math.round(alt).toLocaleString()} m`:'—'],['Kecepatan',vel?`${Math.round(vel*3.6)} km/j`:'—'],['Vertikal',`${trend.icon} ${trend.label}`]]}))
      cl.addLayer(m)
    })
    map.addLayer(cl);ref.current=cl
    return()=>{if(ref.current)map.removeLayer(ref.current)}
  },[data,map,onSelect])
  return null
}

// ── SHIPS ────────────────────────────────────────────────
function ShipsLayer({ships,onSelect}){
  const map=useMap(),ref=useRef(null)
  useEffect(()=>{
    if(ref.current)map.removeLayer(ref.current)
    const cl=makeCluster('#22c55e')
    ships.forEach(s=>{
      const mv=s.speed>0.5
      const m=L.marker([s.lat,s.lon],{icon:shipIco(s.heading,mv)})
      m.bindPopup(mkP(`🚢 ${s.name}`,[['MMSI',String(s.mmsi)],['Kecepatan',`${s.speed.toFixed(1)} knot`],['Heading',`${Math.round(s.heading)}°`],['Status',getNavStatus(s.navStatus)],['Wilayah',getRegion(s.lat,s.lon)]]))
      m.on('click',()=>onSelect({title:`🚢 ${s.name}`,rows:[['MMSI',String(s.mmsi)],['Kecepatan',`${s.speed.toFixed(1)} knot`],['Status',getNavStatus(s.navStatus)],['Wilayah',getRegion(s.lat,s.lon)]]}))
      cl.addLayer(m)
    })
    map.addLayer(cl);ref.current=cl
    return()=>{if(ref.current)map.removeLayer(ref.current)}
  },[ships,map,onSelect])
  return null
}

// ── VOLCANOES ─────────────────────────────────────────────
function VolcanoesLayer({data,onSelect}){
  return data.map((v,i)=>{
    const col=v.level>=4?'#f43f5e':v.level===3?'#f97316':v.level===2?'#f59e0b':'#10b981'
    return(<Marker key={i} position={[v.lat,v.lon]} icon={volcIco(v.level)}
      eventHandlers={{click:()=>onSelect({title:`🌋 ${v.name}`,rows:[['Status',`${v.status}`,col],['Level',`${v.level} dari 4`],['Keterangan',v.desc],['Wilayah',getRegion(v.lat,v.lon)],['Koordinat',`${v.lat.toFixed(3)}, ${v.lon.toFixed(3)}`]]})}}>
    </Marker>)
  })
}

// ── FIRES ────────────────────────────────────────────────
function FiresLayer({data}){
  return data.map((p,i)=>{
    const col=p.conf==='h'?'#f43f5e':p.conf==='n'?'#f59e0b':'#fb923c'
    return(<CircleMarker key={i} center={[p.lat,p.lon]} radius={3.5}
      pathOptions={{fillColor:col,color:col,weight:0,fillOpacity:.85}}>
    </CircleMarker>)
  })
}

// ── WEATHER ──────────────────────────────────────────────
function WeatherLayer({data,onSelect}){
  return data.map((w,i)=>{
    if(w.temp==null)return null
    return(<Marker key={i} position={[w.city.lat,w.city.lon]} icon={wxIco(w.temp,w.weatherCode)}
      eventHandlers={{click:()=>onSelect({title:`${weatherEmoji(w.weatherCode)} ${w.city.name}`,rows:[['Kondisi',weatherDesc(w.weatherCode)],['Suhu',`${Math.round(w.temp)}°C (${Math.round(w.daily?.minTemp||0)}–${Math.round(w.daily?.maxTemp||0)}°C)`],['Kelembapan',`${w.humidity}%`],['Angin',`${Math.round(w.windSpeed)} km/j`],['Peluang Hujan',`${w.daily?.rainProb||0}%`],['Besok',`${weatherEmoji(w.daily?.tomorrow?.code)} ${weatherDesc(w.daily?.tomorrow?.code)} ${Math.round(w.daily?.tomorrow?.max||0)}°C`]]})}}>
    </Marker>)
  })
}

// ── CCTV ─────────────────────────────────────────────────
function CCTVLayer({onSelect}){
  return CCTV_DATA.map(cam=>(
    <Marker key={cam.id} position={[cam.lat,cam.lon]} icon={cctvIco}
      eventHandlers={{click:()=>onSelect({title:`📹 ${cam.name}`,cctv:cam,rows:[['Kota',cam.city],['Tipe',cam.type],['Info',cam.info]]})}}>
    </Marker>
  ))
}

// ── TRAFFIC ──────────────────────────────────────────────
function TrafficLayer({k}){
  const map=useMap()
  useEffect(()=>{
    if(!k)return
    const tl=L.tileLayer(`https://api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=${k}`,{opacity:.75,maxZoom:18})
    tl.addTo(map);return()=>map.removeLayer(tl)
  },[map,k])
  return null
}

// ── MAIN ─────────────────────────────────────────────────
export default function MapView({mapRef,layers,config,flights,ships,quakes,bmkgQuakes,iss,fires,weather,volcanoes,onCoordsChange,onTargetSelect,onCCTVOpen}){
  return(
    <div id="map-wrap" style={{position:'fixed',inset:0,zIndex:0}}>
      <MapContainer center={[-2.5,118]} zoom={5} style={{height:'100%',width:'100%'}} preferCanvas>
        {/* Esri World Imagery - free satellite, no key needed */}
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="© Esri, Maxar" maxZoom={19}/>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" subdomains="abcd" maxZoom={19} opacity={0.8}/>
        <MapCapture mapRef={mapRef}/>
        <CoordTracker onMove={onCoordsChange}/>
        {layers.flights    && <FlightsLayer  data={flights.data}   onSelect={onTargetSelect}/>}
        {layers.ships      && <ShipsLayer    ships={ships.ships}   onSelect={onTargetSelect}/>}
        {layers.iss        && iss.data && <Marker position={[iss.data.latitude,iss.data.longitude]} icon={issIco} zIndexOffset={1000} eventHandlers={{click:()=>onTargetSelect({title:'🛰 ISS',rows:[['Altitude',`${Math.round(iss.data.altitude)} km`],['Kecepatan',`${Math.round(iss.data.velocity).toLocaleString()} km/j`],['Visibility',iss.data.visibility]]})}}/>}
        {layers.quakes     && quakes.data.map((f,i)=>{
          const{mag,place,time}=f.properties;const[lon,lat,dep]=f.geometry.coordinates
          const col=mag>=6?'#f43f5e':mag>=5?'#f59e0b':mag>=4?'#fde047':'#10b981'
          return(<CircleMarker key={i} center={[lat,lon]} radius={Math.max(5,mag*5)} pathOptions={{fillColor:col,color:col,weight:1,opacity:.9,fillOpacity:.25}} eventHandlers={{click:()=>onTargetSelect({title:`🌋 USGS M${mag}`,rows:[['Lokasi',place],['Magnitude',`M${mag}`],['Kedalaman',`${dep} km`],['Waktu',new Date(time).toLocaleString('id-ID')]]})}}>
          </CircleMarker>)
        })}
        {layers.bmkgQuakes && bmkgQuakes.data.map((q,i)=>{
          const col=q.mag>=6?'#f43f5e':q.mag>=5?'#f59e0b':q.mag>=4?'#fde047':'#10b981'
          return(<CircleMarker key={i} center={[q.lat,q.lon]} radius={Math.max(5,q.mag*5.5)} pathOptions={{fillColor:col,color:col,weight:1.5,opacity:.9,fillOpacity:.3,dashArray:'4 2'}} eventHandlers={{click:()=>onTargetSelect({title:`📡 BMKG M${q.mag}`,rows:[['Wilayah',q.wilayah],['Magnitude',`M${q.mag}`],['Kedalaman',q.depth],['Waktu',`${q.tanggal} ${q.waktu}`],['Dirasakan',q.dirasakan],['Tsunami',q.potensi]]})}}>
          </CircleMarker>)
        })}
        {layers.fires      && <FiresLayer    data={fires.data}/>}
        {layers.traffic    && config.tomtom && <TrafficLayer k={config.tomtom}/>}
        {layers.weather    && <WeatherLayer  data={weather.data}  onSelect={onTargetSelect}/>}
        {layers.volcanoes  && <VolcanoesLayer data={volcanoes.data} onSelect={onTargetSelect}/>}
        {layers.cctv       && <CCTVLayer     onSelect={onTargetSelect}/>}
      </MapContainer>
    </div>
  )
}
