import { Settings } from 'lucide-react'

const LAYERS = [
  { key: 'flights', icon: '✈', label: 'Pesawat Live',    countKey: 'flights' },
  { key: 'quakes',  icon: '🌋', label: 'Gempa Bumi',     countKey: 'quakes'  },
  { key: 'iss',     icon: '🛰', label: 'ISS / Satelit',  countKey: 'iss'     },
  { key: 'fires',   icon: '🔥', label: 'Titik Api',      countKey: 'fires'   },
  { key: 'traffic', icon: '🚗', label: 'Traffic Live',   countKey: null      },
  { key: 'cctv',    icon: '📹', label: 'CCTV Indonesia', countKey: null      },
]

const STYLES = [
  { key: 'normal', label: 'Normal', color: '#06b6d4' },
  { key: 'nvg',    label: 'NVG',    color: '#10b981' },
  { key: 'crt',    label: 'CRT',    color: '#f59e0b' },
  { key: 'flir',   label: 'FLIR',   color: '#f43f5e' },
]

export default function Sidebar({ open, layers, onToggleLayer, style, onStyleChange, onConfigOpen, stats, flights, quakes, fires }) {
  const getMeta = (key) => {
    if (key === 'flights') {
      return flights?.status === 'error' ? 'rate limited — coba lagi' : `${flights?.count || 0} aktif`
    }
    if (key === 'quakes') return `${quakes?.count || 0} event 24 jam`
    if (key === 'iss') return stats?.issAlt ? `ISS @ ${stats.issAlt} km` : 'tracking...'
    if (key === 'fires') return fires?.count ? `${fires.count} deteksi` : 'butuh FIRMS key'
    if (key === 'traffic') return 'butuh TomTom key'
    if (key === 'cctv') return '25 kamera'
    return ''
  }

  return (
    <nav style={{ ...S.sidebar, transform: open ? 'none' : 'translateX(-256px)' }}>
      {/* Layers */}
      <div style={S.section}>
        <div style={S.sectionTitle}>DATA LAYERS</div>
        {LAYERS.map(l => (
          <div key={l.key}
            style={{ ...S.layerCard, ...(layers[l.key] ? S.layerCardOn : {}) }}
            onClick={() => onToggleLayer(l.key)}
          >
            <div style={{ ...S.layerIcon, ...(layers[l.key] ? S.layerIconOn : {}) }}>
              {l.icon}
            </div>
            <div style={S.layerInfo}>
              <div style={S.layerName}>{l.label}</div>
              <div style={{ ...S.layerMeta, ...(layers[l.key] ? S.layerMetaOn : {}) }}>
                {getMeta(l.key)}
              </div>
            </div>
            <Toggle on={layers[l.key]} />
          </div>
        ))}
      </div>

      {/* Style */}
      <div style={S.section}>
        <div style={S.sectionTitle}>TAMPILAN SENSOR</div>
        <div style={S.styleGrid}>
          {STYLES.map(s => (
            <button key={s.key}
              style={{ ...S.styleBtn, ...(style === s.key ? { borderColor: s.color, color: s.color, background: `${s.color}15` } : {}) }}
              onClick={() => onStyleChange(s.key)}
            >
              ⬤ {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Config */}
      <div style={{ marginTop: 'auto', padding: '8px 14px 14px' }}>
        <button style={S.cfgBtn} onClick={onConfigOpen}>
          <Settings size={13} />
          <span>Konfigurasi API Keys</span>
        </button>
      </div>
    </nav>
  )
}

function Toggle({ on }) {
  return (
    <div style={{ ...S.toggle, ...(on ? S.toggleOn : {}) }}>
      <div style={{ ...S.knob, ...(on ? S.knobOn : {}) }} />
    </div>
  )
}

const C = { cyan: '#06b6d4', surface: 'rgba(8,20,40,0.88)', border: 'rgba(30,60,100,0.55)', borderHi: 'rgba(6,182,212,0.35)', text: '#94a3b8', textHi: '#e2e8f0', textLo: '#475569', cyanDim: 'rgba(6,182,212,0.12)', mono: "'JetBrains Mono',monospace" }
const S = {
  sidebar: { position: 'fixed', left: 0, top: 56, bottom: 28, width: 256, zIndex: 90, background: C.surface, borderRight: `1px solid ${C.border}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflowY: 'auto', transition: 'transform .3s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column' },
  section: { padding: '14px 14px 8px' },
  sectionTitle: { fontFamily: C.mono, fontSize: 9, letterSpacing: 3, color: C.textLo, borderBottom: `1px solid ${C.border}`, paddingBottom: 7, marginBottom: 10 },
  layerCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, border: '1px solid transparent', cursor: 'pointer', transition: 'all .2s', marginBottom: 4, background: 'rgba(255,255,255,.02)' },
  layerCardOn: { borderColor: C.borderHi, background: C.cyanDim },
  layerIcon: { width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, background: 'rgba(255,255,255,.04)', border: `1px solid ${C.border}`, transition: 'all .2s' },
  layerIconOn: { background: 'rgba(6,182,212,.18)', borderColor: C.borderHi },
  layerInfo: { flex: 1, minWidth: 0 },
  layerName: { fontSize: 12, fontWeight: 500, color: C.textHi, fontFamily: C.mono },
  layerMeta: { fontSize: 9, color: C.textLo, marginTop: 1, fontFamily: C.mono },
  layerMetaOn: { color: C.cyan },
  toggle: { width: 26, height: 14, borderRadius: 7, flexShrink: 0, background: '#1e3a5f', border: `1px solid ${C.border}`, position: 'relative', transition: 'all .2s' },
  toggleOn: { background: C.cyan, borderColor: C.cyan },
  knob: { width: 10, height: 10, borderRadius: '50%', background: C.textLo, position: 'absolute', top: 1, left: 1, transition: 'all .2s' },
  knobOn: { left: 13, background: '#030b18' },
  styleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 },
  styleBtn: { padding: '7px 4px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,.02)', cursor: 'pointer', fontFamily: C.mono, fontSize: 9, color: C.textLo, letterSpacing: 1, transition: 'all .2s', textAlign: 'center' },
  cfgBtn: { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', fontFamily: C.mono, fontSize: 10, color: C.textLo, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s', letterSpacing: 1 },
}
