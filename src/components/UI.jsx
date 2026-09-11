import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const C = { cyan:'#06b6d4', surface:'rgba(8,20,40,0.88)', surface2:'rgba(10,25,50,0.95)', border:'rgba(30,60,100,0.55)', borderHi:'rgba(6,182,212,0.35)', text:'#94a3b8', textHi:'#e2e8f0', textLo:'#475569', cyanDim:'rgba(6,182,212,0.12)', emerald:'#10b981', amber:'#f59e0b', rose:'#f43f5e', mono:"'JetBrains Mono',monospace" }

// ── INFO PANEL ───────────────────────────────────────────
export function InfoPanel({ open, flights, quakes, iss, fires, target, onClose, onCCTVOpen }) {
  return (
    <aside style={{ ...S.panel, transform: open ? 'none' : 'translateX(260px)' }}>
      <div style={S.panelHead}>
        <span style={S.panelTitle}>STATUS INTEL</span>
        <button style={S.closeBtn} onClick={onClose}><X size={14}/></button>
      </div>
      <div style={S.panelBody}>
        <div style={S.statsGrid}>
          <StatCard label="PESAWAT" val={flights.count || '—'} sub="aktif di udara" />
          <StatCard label="GEMPA 24J" val={quakes.count || '—'} sub="di Indonesia" />
          <StatCard label="ISS ALT" val={iss.data ? `${Math.round(iss.data.altitude)} km` : '—'} sub="orbit" small />
          <StatCard label="TITIK API" val={fires.count || '—'} sub="VIIRS NOAA-20" />
        </div>
        <StatCard label="KAMERA CCTV" val="25" sub="Jakarta · Bandung · Yogya · Surabaya · Bali +" full />
        <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textLo, marginTop: 6, marginBottom: 12 }}>
          Sync: {new Date().toLocaleTimeString('id-ID')}
        </div>

        {target && (
          <>
            <div style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: 3, color: C.textLo, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 8 }}>TARGET AKTIF</div>
            <div style={S.targetCard}>
              <div style={S.targetTitle}>{target.title}</div>
              {target.rows.map(([k, v]) => (
                <div key={k} style={S.targetRow}>
                  <span style={{ color: C.textLo }}>{k}</span>
                  <span style={{ color: C.textHi }}>{v}</span>
                </div>
              ))}
              {target.cctv?.url && (
                <button style={S.cctvBtn} onClick={() => onCCTVOpen(target.cctv)}>
                  ▶ Buka Feed CCTV
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function StatCard({ label, val, sub, small, full }) {
  return (
    <div style={{ ...S.statCard, ...(full ? S.statCardFull : {}) }}>
      <div style={S.scLabel}>{label}</div>
      <div style={{ ...S.scVal, ...(small ? { fontSize: 13 } : {}) }}>{val}</div>
      <div style={S.scSub}>{sub}</div>
    </div>
  )
}

// ── FOOTER ───────────────────────────────────────────────
export function Footer({ coords, loading }) {
  return (
    <footer style={S.footer}>
      <span style={S.coords}>
        LAT: {coords?.lat?.toFixed(4) ?? '—'}°  LON: {coords?.lng?.toFixed(4) ?? '—'}°
      </span>
      {loading && <span style={S.loading}><span style={{ animation: 'blink 0.8s infinite', display: 'inline-block' }}>●</span> {loading}</span>}
      <span style={{ flex: 1 }} />
      <span style={S.watermark}>
        MATA ELANG &nbsp;·&nbsp; Powered by <span style={{ color: C.cyan }}>PT Catindo Bagus Perkasa</span>
      </span>
    </footer>
  )
}

// ── CONFIG MODAL ─────────────────────────────────────────
export function ConfigModal({ config, onSave, onClose }) {
  const [firms, setFirms] = useState('')
  const [tomtom, setTomtom] = useState('')

  const save = () => {
    onSave({
      firms: firms || config.firms,
      tomtom: tomtom || config.tomtom,
    })
  }

  return (
    <Overlay onClose={onClose}>
      <div style={S.modal}>
        <div style={S.modalTitle}>⚙ Konfigurasi API Keys</div>

        {[
          { label: 'NASA FIRMS MAP KEY — titik api aktif', placeholder: config.firms ? 'Key tersimpan ✓' : 'Paste FIRMS MAP KEY...', val: firms, set: setFirms, hint: 'firms.modaps.eosdis.nasa.gov', hintUrl: 'https://firms.modaps.eosdis.nasa.gov/api/map_key/' },
          { label: 'TOMTOM API KEY — traffic live', placeholder: config.tomtom ? 'Key tersimpan ✓' : 'Paste TomTom API Key...', val: tomtom, set: setTomtom, hint: 'developer.tomtom.com', hintUrl: 'https://developer.tomtom.com' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <div style={S.mLabel}>{f.label}</div>
            <input style={S.mInput} type="password" value={f.val}
              onChange={e => f.set(e.target.value)} placeholder={f.placeholder}/>
            <div style={S.mHint}>Daftar gratis di <a href={f.hintUrl} target="_blank" rel="noreferrer" style={{ color: C.cyan, textDecoration: 'none' }}>{f.hint}</a></div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button style={S.btnPrimary} onClick={save}>Simpan Keys</button>
          <button style={S.btnSecondary} onClick={onClose}>Tutup</button>
        </div>
      </div>
    </Overlay>
  )
}

// ── CCTV MODAL ───────────────────────────────────────────
export function CCTVModal({ cam, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ ...S.modal, width: 520 }}>
        <div style={S.modalTitle}>📹 {cam.name} — {cam.city}</div>
        <iframe src={cam.url} style={S.cctvFrame} frameBorder="0" title="CCTV Feed" />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <a href={cam.url} target="_blank" rel="noreferrer" style={S.btnOutline}>↗ Buka di tab baru</a>
          <button style={S.btnSecondary} onClick={onClose}>Tutup</button>
        </div>
        <div style={{ fontSize: 9, color: C.textLo, marginTop: 8, fontFamily: C.mono }}>
          ⚠ Ketersediaan feed tergantung pengelola. Jika kosong, kamera mungkin offline.
        </div>
      </div>
    </Overlay>
  )
}

// ── OVERLAY ──────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      {children}
    </div>
  )
}

// ── TOASTS ───────────────────────────────────────────────
export function Toasts({ toasts }) {
  return (
    <div style={S.toasts}>
      {toasts.map(t => (
        <div key={t.id} style={{ ...S.toast, ...(t.type === 'success' ? S.toastSuccess : t.type === 'warn' ? S.toastWarn : t.type === 'error' ? S.toastError : {}) }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── STYLES ───────────────────────────────────────────────
const S = {
  panel: { position:'fixed', right:0, top:56, bottom:28, width:260, zIndex:90, background:C.surface, borderLeft:`1px solid ${C.border}`, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', transition:'transform .3s cubic-bezier(.4,0,.2,1)', display:'flex', flexDirection:'column' },
  panelHead: { padding:'13px 14px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 },
  panelTitle: { fontFamily:C.mono, fontSize:9, letterSpacing:3, color:C.textLo },
  closeBtn: { background:'transparent', border:'none', cursor:'pointer', color:C.textLo, display:'flex', padding:2 },
  panelBody: { padding:14, overflowY:'auto', flex:1 },
  statsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 },
  statCard: { borderRadius:8, border:`1px solid ${C.border}`, padding:'10px 10px 8px', background:'rgba(255,255,255,.02)' },
  statCardFull: { gridColumn:'1/-1' },
  scLabel: { fontFamily:C.mono, fontSize:8, color:C.textLo, letterSpacing:2 },
  scVal: { fontFamily:C.mono, fontSize:20, fontWeight:600, color:C.cyan, lineHeight:1.2, marginTop:3 },
  scSub: { fontSize:9, color:C.textLo, marginTop:2 },
  targetCard: { borderRadius:8, border:`1px solid ${C.borderHi}`, padding:12, background:C.cyanDim },
  targetTitle: { fontFamily:C.mono, fontSize:11, color:C.cyan, fontWeight:600, marginBottom:8 },
  targetRow: { display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:`1px solid rgba(30,60,100,.3)`, fontSize:10, fontFamily:C.mono },
  cctvBtn: { display:'block', width:'100%', marginTop:10, padding:'6px', border:`1px solid ${C.borderHi}`, borderRadius:5, background:C.cyanDim, color:C.cyan, fontFamily:C.mono, fontSize:9, cursor:'pointer', letterSpacing:1 },
  footer: { position:'fixed', bottom:0, left:0, right:0, height:28, zIndex:100, background:'rgba(10,25,50,0.95)', borderTop:`1px solid ${C.border}`, backdropFilter:'blur(20px)', display:'flex', alignItems:'center', padding:'0 14px', gap:20 },
  coords: { fontFamily:C.mono, fontSize:10, color:C.cyan, letterSpacing:1 },
  loading: { fontFamily:C.mono, fontSize:9, color:C.amber },
  watermark: { fontFamily:C.mono, fontSize:9, color:C.textLo, letterSpacing:1.5, whiteSpace:'nowrap' },
  overlay: { position:'fixed', inset:0, zIndex:500, background:'rgba(3,11,24,.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' },
  modal: { background:C.surface2, border:`1px solid ${C.borderHi}`, borderRadius:12, padding:24, width:390, boxShadow:'0 0 60px rgba(6,182,212,.1)' },
  modalTitle: { fontFamily:C.mono, fontSize:13, color:C.cyan, letterSpacing:2, marginBottom:18 },
  mLabel: { fontSize:10, color:C.textLo, letterSpacing:1, marginBottom:5, fontFamily:C.mono },
  mInput: { width:'100%', background:'rgba(0,0,0,.4)', border:`1px solid ${C.border}`, borderRadius:6, color:C.textHi, padding:'8px 12px', fontFamily:C.mono, fontSize:11, outline:'none' },
  mHint: { fontSize:9, color:C.textLo, marginTop:4, fontFamily:C.mono },
  btnPrimary: { flex:1, padding:9, borderRadius:6, background:C.cyan, border:'none', color:'#030b18', fontFamily:C.mono, fontSize:11, fontWeight:600, cursor:'pointer', letterSpacing:1 },
  btnSecondary: { padding:'9px 16px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.textLo, fontFamily:C.mono, fontSize:11, cursor:'pointer' },
  btnOutline: { padding:'7px 14px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.text, fontFamily:C.mono, fontSize:10, textDecoration:'none', display:'inline-block' },
  cctvFrame: { width:'100%', height:270, border:`1px solid ${C.border}`, borderRadius:6, background:'#000', display:'block', marginTop:12 },
  toasts: { position:'fixed', bottom:40, right:16, zIndex:600, display:'flex', flexDirection:'column', gap:6 },
  toast: { padding:'10px 14px', borderRadius:8, border:`1px solid ${C.border}`, background:C.surface2, backdropFilter:'blur(20px)', fontFamily:C.mono, fontSize:10, color:C.textHi, maxWidth:260, animation:'toast-in .3s ease' },
  toastSuccess: { borderColor:'rgba(16,185,129,.4)', color:'#10b981' },
  toastWarn: { borderColor:'rgba(245,158,11,.4)', color:'#f59e0b' },
  toastError: { borderColor:'rgba(244,63,94,.4)', color:'#f43f5e' },
}
