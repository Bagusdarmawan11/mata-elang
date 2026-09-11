import { useState } from 'react'
import { X } from 'lucide-react'

const C={cyan:'#06b6d4',surface:'rgba(8,20,40,0.88)',surface2:'rgba(10,25,50,0.95)',border:'rgba(30,60,100,0.55)',borderHi:'rgba(6,182,212,0.35)',text:'#94a3b8',textHi:'#e2e8f0',textLo:'#475569',cyanDim:'rgba(6,182,212,0.12)',emerald:'#10b981',amber:'#f59e0b',rose:'#f43f5e',mono:"'JetBrains Mono',monospace"}

// ── INFO PANEL ───────────────────────────────────────────
export function InfoPanel({open,flights,quakes,iss,fires,ships,bmkgQuakes,target,onClose,onCCTVOpen}){
  return(
    <aside style={{...S.panel,transform:open?'none':'translateX(260px)'}}>
      <div style={S.panelHd}>
        <span style={S.panelTitle}>STATUS INTEL</span>
        <button style={S.closeBtn} onClick={onClose}><X size={14}/></button>
      </div>
      <div style={S.panelBody}>
        <div style={S.grid}>
          <SC label="PESAWAT"  val={flights?.count??'—'}      sub="aktif di udara"/>
          <SC label="KAPAL"    val={ships?.count??'—'}        sub="AIS live"/>
          <SC label="GEMPA USGS" val={quakes?.count??'—'}    sub="24 jam"/>
          <SC label="GEMPA BMKG" val={bmkgQuakes?.count??'—'} sub="terkini"/>
          <SC label="ISS ALT"  val={iss?.data?`${Math.round(iss.data.altitude)} km`:'—'} sub="orbit" small/>
          <SC label="TITIK API" val={fires?.count??'—'}       sub="VIIRS NOAA"/>
        </div>
        <div style={{...S.statCard,marginBottom:8}}>
          <div style={S.scLabel}>KAMERA CCTV</div>
          <div style={S.scVal}>25</div>
          <div style={S.scSub}>Jakarta · Bandung · Yogya · Surabaya · Bali +</div>
        </div>
        <div style={{fontFamily:C.mono,fontSize:9,color:C.textLo,marginBottom:12}}>
          Sync: {new Date().toLocaleTimeString('id-ID')}
        </div>
        {target&&(
          <>
            <div style={{fontFamily:C.mono,fontSize:9,letterSpacing:3,color:C.textLo,borderBottom:`1px solid ${C.border}`,paddingBottom:6,marginBottom:8}}>TARGET AKTIF</div>
            <div style={S.targetCard}>
              <div style={S.targetTitle}>{target.title}</div>
              {target.rows.map(([k,v])=>(
                <div key={k} style={S.targetRow}>
                  <span style={{color:C.textLo}}>{k}</span>
                  <span style={{color:C.textHi,textAlign:'right',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</span>
                </div>
              ))}
              {target.cctv?.url&&<button style={S.cctvBtn} onClick={()=>onCCTVOpen(target.cctv)}>▶ Buka Feed CCTV</button>}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function SC({label,val,sub,small,full}){
  return(
    <div style={{...S.statCard,...(full?{gridColumn:'1/-1'}:{})}}>
      <div style={S.scLabel}>{label}</div>
      <div style={{...S.scVal,...(small?{fontSize:13}:{})}}>{val}</div>
      <div style={S.scSub}>{sub}</div>
    </div>
  )
}

// ── FOOTER ───────────────────────────────────────────────
export function Footer({coords}){
  return(
    <footer style={S.footer}>
      <span style={S.coords}>LAT: {coords?.lat?.toFixed(4)??'—'}°  LON: {coords?.lng?.toFixed(4)??'—'}°</span>
      <span style={{flex:1}}/>
      <span style={S.watermark}>MATA ELANG &nbsp;·&nbsp; Powered by <span style={{color:C.cyan}}>PT Catindo Bagus Perkasa</span></span>
    </footer>
  )
}

// ── CONFIG MODAL ─────────────────────────────────────────
export function ConfigModal({config,onSave,onClose}){
  const [firms,  setFirms]  = useState('')
  const [tomtom, setTomtom] = useState('')
  const [ais,    setAis]    = useState('')
  const save=()=>onSave({
    firms:  firms  || config.firms,
    tomtom: tomtom || config.tomtom,
    ais:    ais    || config.ais,
  })
  const fields=[
    {label:'NASA FIRMS MAP KEY — titik api',   val:firms,  set:setFirms,  ph:config.firms ?'Tersimpan ✓':'Paste FIRMS MAP KEY...',   hint:'firms.modaps.eosdis.nasa.gov', url:'https://firms.modaps.eosdis.nasa.gov/api/map_key/'},
    {label:'TOMTOM API KEY — traffic live',    val:tomtom, set:setTomtom, ph:config.tomtom?'Tersimpan ✓':'Paste TomTom API Key...',  hint:'developer.tomtom.com',          url:'https://developer.tomtom.com'},
    {label:'AISSTREAM API KEY — kapal laut',   val:ais,    set:setAis,    ph:config.ais   ?'Tersimpan ✓':'Paste AISStream Key...',   hint:'aisstream.io',                  url:'https://aisstream.io'},
  ]
  return(
    <Overlay onClose={onClose}>
      <div style={S.modal}>
        <div style={S.modalTitle}>⚙ Konfigurasi API Keys</div>
        {fields.map(f=>(
          <div key={f.label} style={{marginBottom:14}}>
            <div style={S.mLabel}>{f.label}</div>
            <input style={S.mInput} type="password" value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}/>
            <div style={S.mHint}>Daftar gratis: <a href={f.url} target="_blank" rel="noreferrer" style={{color:C.cyan,textDecoration:'none'}}>{f.hint}</a></div>
          </div>
        ))}
        <div style={{marginTop:6,padding:10,borderRadius:6,background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',fontFamily:C.mono,fontSize:9,color:'#10b981'}}>
          ✓ Cuaca Indonesia (Open-Meteo) & BMKG aktif otomatis — tidak butuh API key
        </div>
        <div style={{display:'flex',gap:8,marginTop:16}}>
          <button style={S.btnPrimary} onClick={save}>Simpan Keys</button>
          <button style={S.btnSecondary} onClick={onClose}>Tutup</button>
        </div>
      </div>
    </Overlay>
  )
}

// ── CCTV MODAL ───────────────────────────────────────────
export function CCTVModal({cam,onClose}){
  return(
    <Overlay onClose={onClose}>
      <div style={{...S.modal,width:520}}>
        <div style={S.modalTitle}>📹 {cam.name} — {cam.city}</div>
        <iframe src={cam.url} style={S.cctvFrame} frameBorder="0" title="CCTV"/>
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <a href={cam.url} target="_blank" rel="noreferrer" style={{...S.btnSecondary,textDecoration:'none',display:'inline-block'}}>↗ Buka tab baru</a>
          <button style={S.btnSecondary} onClick={onClose}>Tutup</button>
        </div>
        <div style={{fontSize:9,color:C.textLo,marginTop:8,fontFamily:C.mono}}>⚠ Ketersediaan feed tergantung pengelola kamera.</div>
      </div>
    </Overlay>
  )
}

function Overlay({children,onClose}){
  return(<div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>{children}</div>)
}

export function Toasts({toasts}){
  return(
    <div style={S.toasts}>
      {toasts.map(t=>(
        <div key={t.id} style={{...S.toast,...(t.type==='success'?S.toastOk:t.type==='warn'?S.toastWarn:t.type==='error'?S.toastErr:{})}}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

const S={
  panel:{position:'fixed',right:0,top:56,bottom:28,width:260,zIndex:90,background:C.surface,borderLeft:`1px solid ${C.border}`,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',transition:'transform .3s cubic-bezier(.4,0,.2,1)',display:'flex',flexDirection:'column'},
  panelHd:{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0},
  panelTitle:{fontFamily:C.mono,fontSize:9,letterSpacing:3,color:C.textLo},
  closeBtn:{background:'transparent',border:'none',cursor:'pointer',color:C.textLo,display:'flex',padding:2},
  panelBody:{padding:12,overflowY:'auto',flex:1},
  grid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:6},
  statCard:{borderRadius:7,border:`1px solid ${C.border}`,padding:'9px 10px 7px',background:'rgba(255,255,255,.02)',marginBottom:5},
  scLabel:{fontFamily:C.mono,fontSize:8,color:C.textLo,letterSpacing:2},
  scVal:{fontFamily:C.mono,fontSize:18,fontWeight:600,color:C.cyan,lineHeight:1.2,marginTop:3},
  scSub:{fontSize:9,color:C.textLo,marginTop:2},
  targetCard:{borderRadius:8,border:`1px solid ${C.borderHi}`,padding:12,background:C.cyanDim},
  targetTitle:{fontFamily:C.mono,fontSize:11,color:C.cyan,fontWeight:600,marginBottom:8},
  targetRow:{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:`1px solid rgba(30,60,100,.3)`,fontSize:10,fontFamily:C.mono,gap:8},
  cctvBtn:{display:'block',width:'100%',marginTop:10,padding:6,border:`1px solid ${C.borderHi}`,borderRadius:5,background:C.cyanDim,color:C.cyan,fontFamily:C.mono,fontSize:9,cursor:'pointer'},
  footer:{position:'fixed',bottom:0,left:0,right:0,height:28,zIndex:100,background:'rgba(10,25,50,0.95)',borderTop:`1px solid ${C.border}`,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',padding:'0 14px',gap:20},
  coords:{fontFamily:C.mono,fontSize:10,color:C.cyan,letterSpacing:1},
  watermark:{fontFamily:C.mono,fontSize:9,color:C.textLo,letterSpacing:1.5,whiteSpace:'nowrap'},
  overlay:{position:'fixed',inset:0,zIndex:500,background:'rgba(3,11,24,.82)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:C.surface2,border:`1px solid ${C.borderHi}`,borderRadius:12,padding:24,width:400,boxShadow:'0 0 60px rgba(6,182,212,.1)'},
  modalTitle:{fontFamily:C.mono,fontSize:13,color:C.cyan,letterSpacing:2,marginBottom:18},
  mLabel:{fontSize:10,color:C.textLo,letterSpacing:1,marginBottom:5,fontFamily:C.mono},
  mInput:{width:'100%',background:'rgba(0,0,0,.4)',border:`1px solid ${C.border}`,borderRadius:6,color:C.textHi,padding:'8px 12px',fontFamily:C.mono,fontSize:11,outline:'none'},
  mHint:{fontSize:9,color:C.textLo,marginTop:4,fontFamily:C.mono},
  btnPrimary:{flex:1,padding:9,borderRadius:6,background:C.cyan,border:'none',color:'#030b18',fontFamily:C.mono,fontSize:11,fontWeight:600,cursor:'pointer'},
  btnSecondary:{padding:'9px 16px',borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.textLo,fontFamily:C.mono,fontSize:11,cursor:'pointer'},
  cctvFrame:{width:'100%',height:270,border:`1px solid ${C.border}`,borderRadius:6,background:'#000',display:'block',marginTop:12},
  toasts:{position:'fixed',bottom:40,right:16,zIndex:600,display:'flex',flexDirection:'column',gap:6},
  toast:{padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.surface2,backdropFilter:'blur(20px)',fontFamily:C.mono,fontSize:10,color:C.textHi,maxWidth:260,animation:'toast-in .3s ease'},
  toastOk:{borderColor:'rgba(16,185,129,.4)',color:'#10b981'},
  toastWarn:{borderColor:'rgba(245,158,11,.4)',color:'#f59e0b'},
  toastErr:{borderColor:'rgba(244,63,94,.4)',color:'#f43f5e'},
}
