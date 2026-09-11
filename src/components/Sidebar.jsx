import { Settings } from 'lucide-react'

const LAYERS=[
  {key:'flights',   icon:'✈', label:'Pesawat Live',     mk:'flights'},
  {key:'ships',     icon:'🚢',label:'Kapal Laut Live',   mk:'ships'},
  {key:'quakes',    icon:'🌋',label:'Gempa (USGS)',      mk:'quakes'},
  {key:'bmkgQuakes',icon:'📡',label:'Gempa BMKG',       mk:'bmkg'},
  {key:'iss',       icon:'🛰',label:'ISS / Satelit',    mk:'iss'},
  {key:'volcanoes', icon:'🌋',label:'Abu Vulkanik',      mk:'volc'},
  {key:'fires',     icon:'🔥',label:'Titik Api NASA',   mk:'fires'},
  {key:'traffic',   icon:'🚗',label:'Traffic Live',     mk:null},
  {key:'weather',   icon:'🌤',label:'Cuaca 60 Kota',    mk:'weather'},
  {key:'cctv',      icon:'📹',label:'CCTV Indonesia',   mk:null},
]

const STYLES=[
  {key:'normal',label:'Normal',color:'#06b6d4'},
  {key:'nvg',   label:'NVG',   color:'#10b981'},
  {key:'crt',   label:'CRT',   color:'#f59e0b'},
  {key:'flir',  label:'FLIR',  color:'#f43f5e'},
]

export default function Sidebar({open,layers,onToggleLayer,style,onStyleChange,onConfigOpen,flights,ships,quakes,bmkgQuakes,fires,weather,iss,volcanoes}){
  const getMeta=key=>{
    if(key==='flights'){
      const st = flights?.status
      if(st==='loading')  return '⏳ mengambil data...'
      if(st==='ok')       return `${flights.count} aktif · ${flights.source||''}`
      if(st==='stale')    return `⚠ data lama · ${flights.count} pesawat`
      if(st==='ratelimit')return '⏳ rate limit, tunggu...'
      if(st==='error')    return `⚠ ${flights?.errMsg||'semua sumber gagal'}`
      return 'memuat...'
    }
    if(key==='ships'){
      const st=ships?.wsState
      if(!st||st==='idle')return'butuh AISStream key'
      if(st==='connecting')return'🔄 menghubungkan...'
      if(st==='connected') return ships?.count?`${ships.count} kapal live`:'terhubung'
      if(st==='error')     return'⚠ gagal connect'
      return'—'
    }
    if(key==='quakes')     return quakes?.count?`${quakes.count} event 24j`:'memuat...'
    if(key==='bmkgQuakes') return bmkgQuakes?.count?`${bmkgQuakes.count} dari BMKG`:'memuat...'
    if(key==='iss')        return iss?.data?`ISS @ ${Math.round(iss.data.altitude)} km`:'tracking...'
    if(key==='volcanoes')  return volcanoes?.count?`${volcanoes.count} gunung · ${volcanoes.data?.filter(v=>v.level>=3).length||0} siaga+`:'memuat...'
    if(key==='fires')      return fires?.count?`${fires.count} deteksi`:fires?.status==='error'?'⚠ cek FIRMS key':'butuh FIRMS key'
    if(key==='traffic')    return'butuh TomTom key'
    if(key==='weather')    return weather?.count?`${weather.count} kota`:'memuat...'
    if(key==='cctv')       return'30 kamera tersedia'
    return''
  }
  return(
    <nav style={{...S.sb,transform:open?'none':'translateX(-256px)'}}>
      <div style={S.sec}>
        <div style={S.stitle}>DATA LAYERS</div>
        {LAYERS.map(l=>(
          <div key={l.key} style={{...S.card,...(layers[l.key]?S.cardOn:{})}} onClick={()=>onToggleLayer(l.key)}>
            <div style={{...S.icon,...(layers[l.key]?S.iconOn:{})}}>{l.icon}</div>
            <div style={S.info}>
              <div style={S.name}>{l.label}</div>
              <div style={{...S.meta,...(layers[l.key]?S.metaOn:{})}}>{getMeta(l.key)}</div>
            </div>
            <Tog on={layers[l.key]}/>
          </div>
        ))}
      </div>
      <div style={S.sec}>
        <div style={S.stitle}>TAMPILAN SENSOR</div>
        <div style={S.sgrid}>
          {STYLES.map(s=>(
            <button key={s.key} style={{...S.sbtn,...(style===s.key?{borderColor:s.color,color:s.color,background:`${s.color}15`}:{})}} onClick={()=>onStyleChange(s.key)}>
              ⬤ {s.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginTop:'auto',padding:'8px 12px 12px'}}>
        <button style={S.cfgBtn} onClick={onConfigOpen}>
          <Settings size={13}/><span>Konfigurasi API Keys</span>
        </button>
      </div>
    </nav>
  )
}

function Tog({on}){
  return(<div style={{...S.tog,...(on?S.togOn:{})}}><div style={{...S.knob,...(on?S.knobOn:{})}}/></div>)
}

const C={cyan:'#06b6d4',surface:'rgba(8,20,40,0.88)',border:'rgba(30,60,100,0.55)',borderHi:'rgba(6,182,212,0.35)',textHi:'#e2e8f0',textLo:'#475569',cyanDim:'rgba(6,182,212,0.12)',mono:"'JetBrains Mono',monospace"}
const S={
  sb:{position:'fixed',left:0,top:56,bottom:28,width:256,zIndex:90,background:C.surface,borderRight:`1px solid ${C.border}`,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',overflowY:'auto',transition:'transform .3s cubic-bezier(.4,0,.2,1)',display:'flex',flexDirection:'column'},
  sec:{padding:'12px 12px 6px'},
  stitle:{fontFamily:C.mono,fontSize:9,letterSpacing:3,color:C.textLo,borderBottom:`1px solid ${C.border}`,paddingBottom:7,marginBottom:8},
  card:{display:'flex',alignItems:'center',gap:9,padding:'7px 10px',borderRadius:8,border:'1px solid transparent',cursor:'pointer',transition:'all .2s',marginBottom:3,background:'rgba(255,255,255,.02)'},
  cardOn:{borderColor:C.borderHi,background:C.cyanDim},
  icon:{width:28,height:28,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,background:'rgba(255,255,255,.04)',border:`1px solid ${C.border}`,transition:'all .2s'},
  iconOn:{background:'rgba(6,182,212,.18)',borderColor:C.borderHi},
  info:{flex:1,minWidth:0},
  name:{fontSize:11,fontWeight:500,color:C.textHi,fontFamily:C.mono},
  meta:{fontSize:9,color:C.textLo,marginTop:1,fontFamily:C.mono},
  metaOn:{color:C.cyan},
  tog:{width:26,height:14,borderRadius:7,flexShrink:0,background:'#1e3a5f',border:`1px solid ${C.border}`,position:'relative',transition:'all .2s'},
  togOn:{background:C.cyan,borderColor:C.cyan},
  knob:{width:10,height:10,borderRadius:'50%',background:C.textLo,position:'absolute',top:1,left:1,transition:'all .2s'},
  knobOn:{left:13,background:'#030b18'},
  sgrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5},
  sbtn:{padding:'7px 4px',borderRadius:6,border:`1px solid ${C.border}`,background:'rgba(255,255,255,.02)',cursor:'pointer',fontFamily:C.mono,fontSize:9,color:C.textLo,letterSpacing:1,transition:'all .2s',textAlign:'center'},
  cfgBtn:{width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',fontFamily:C.mono,fontSize:10,color:C.textLo,cursor:'pointer',display:'flex',alignItems:'center',gap:8,transition:'all .2s'},
}
