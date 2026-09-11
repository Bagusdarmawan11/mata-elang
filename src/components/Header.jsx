import { useState, useEffect } from 'react'
import { Settings, PanelLeft, PanelRight } from 'lucide-react'

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      const pad = v => String(v).padStart(2, '0')
      setTime(`${pad(n.getUTCHours())}:${pad(n.getUTCMinutes())}:${pad(n.getUTCSeconds())} UTC`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={styles.clock}>{time}</span>
}

export default function Header({ flights, quakes, fires, sidebarOpen, infoPanelOpen, onSidebarToggle, onInfoToggle, onConfigOpen }) {
  return (
    <header style={styles.header}>
      {/* Logo */}
      <div style={styles.logoWrap}>
        <div style={styles.logoRing}>
          <span style={{ fontSize: 15 }}>👁</span>
          <div style={styles.logoOrbit} />
        </div>
      </div>

      <div style={styles.brand}>
        <div style={styles.brandName}>MATA ELANG</div>
        <div style={styles.brandSub}>INDONESIA INTELLIGENCE</div>
      </div>

      <div style={styles.divider} />

      {/* Stats */}
      {[
        { label: 'PESAWAT', val: flights.count || '—' },
        { label: 'GEMPA', val: quakes.count || '—' },
        { label: 'TITIK API', val: fires.count || '—' },
      ].map(s => (
        <div key={s.label} style={styles.stat}>
          <div style={styles.statVal}>{s.val}</div>
          <div style={styles.statLabel}>{s.label}</div>
        </div>
      ))}

      <div style={{ flex: 1 }} />

      {/* Live badge */}
      <div style={styles.liveBadge}>
        <div style={styles.liveDot} />
        <span>LIVE</span>
      </div>

      <Clock />

      {/* Icon buttons */}
      <button style={{ ...styles.iconBtn, ...(sidebarOpen ? styles.iconBtnActive : {}) }}
        onClick={onSidebarToggle} title="Toggle Sidebar">
        <PanelLeft size={16} />
      </button>
      <button style={{ ...styles.iconBtn, ...(infoPanelOpen ? styles.iconBtnActive : {}) }}
        onClick={onInfoToggle} title="Status Panel">
        <PanelRight size={16} />
      </button>
      <button style={styles.iconBtn} onClick={onConfigOpen} title="API Keys">
        <Settings size={16} />
      </button>
    </header>
  )
}

const C = { cyan: '#06b6d4', surface2: 'rgba(10,25,50,0.95)', border: 'rgba(30,60,100,0.55)', borderHi: 'rgba(6,182,212,0.35)', text: '#94a3b8', textHi: '#e2e8f0', textLo: '#475569', cyanDim: 'rgba(6,182,212,0.12)', mono: "'JetBrains Mono',monospace" }

const styles = {
  header: { position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 100, background: C.surface2, borderBottom: `1px solid ${C.borderHi}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 },
  logoWrap: { position: 'relative', width: 34, height: 34, flexShrink: 0 },
  logoRing: { width: 34, height: 34, border: `1.5px solid ${C.cyan}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px rgba(6,182,212,.25)` },
  logoOrbit: { position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid rgba(6,182,212,.2)`, animation: 'spin-ring 8s linear infinite', pointerEvents: 'none' },
  brand: { flexShrink: 0 },
  brandName: { fontFamily: C.mono, fontSize: 15, fontWeight: 600, color: C.textHi, letterSpacing: 3, lineHeight: 1 },
  brandSub: { fontSize: 9, color: C.textLo, letterSpacing: 2, marginTop: 2, fontFamily: C.mono },
  divider: { width: 1, height: 30, background: C.border, flexShrink: 0, margin: '0 4px' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 },
  statVal: { fontFamily: C.mono, fontSize: 14, fontWeight: 600, color: C.cyan, lineHeight: 1 },
  statLabel: { fontSize: 8, color: C.textLo, letterSpacing: 1, marginTop: 2 },
  liveBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid rgba(16,185,129,.3)', borderRadius: 20, background: 'rgba(16,185,129,.08)', fontFamily: C.mono, fontSize: 10, color: '#10b981' },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 1.5s infinite' },
  clock: { fontFamily: C.mono, fontSize: 12, color: C.text, letterSpacing: 2 },
  iconBtn: { width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, borderRadius: 8, background: 'transparent', cursor: 'pointer', color: C.text, transition: 'all .2s' },
  iconBtnActive: { borderColor: C.cyan, color: C.cyan, background: C.cyanDim },
}
