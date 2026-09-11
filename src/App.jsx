import { useState, useCallback } from 'react'
import MapView from './components/MapView.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import { InfoPanel, Footer, ConfigModal, CCTVModal, Toasts } from './components/UI.jsx'
import { useFlights, useQuakes, useISS, useFires } from './hooks/useIntelData.js'

export default function App() {
  // ── State ──────────────────────────────────────────────
  const [layers, setLayers] = useState({
    flights: true, quakes: true, iss: true,
    fires: false, traffic: false, cctv: false,
  })
  const [visualStyle, setVisualStyle] = useState('normal')
  const [target, setTarget]           = useState(null)
  const [coords, setCoords]           = useState(null)
  const [config, setConfig]           = useState({
    firms:  localStorage.getItem('me_firms')  || '',
    tomtom: localStorage.getItem('me_tomtom') || '',
  })
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [showConfig, setShowConfig]     = useState(false)
  const [showCCTV, setShowCCTV]         = useState(null)
  const [toasts, setToasts]             = useState([])

  // ── Data hooks ─────────────────────────────────────────
  const flights = useFlights(layers.flights)
  const quakes  = useQuakes(layers.quakes)
  const iss     = useISS(layers.iss)
  const fires   = useFires(layers.fires, config.firms)

  // ── Toast ──────────────────────────────────────────────
  const addToast = useCallback((msg, type = '') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  // ── Handlers ───────────────────────────────────────────
  const toggleLayer = useCallback(name => {
    setLayers(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  const handleTargetSelect = useCallback(t => {
    setTarget(t)
    setInfoPanelOpen(true)
  }, [])

  const handleSaveConfig = useCallback(newCfg => {
    if (newCfg.firms)  localStorage.setItem('me_firms',  newCfg.firms)
    if (newCfg.tomtom) localStorage.setItem('me_tomtom', newCfg.tomtom)
    setConfig(newCfg)
    addToast('API keys berhasil disimpan', 'success')
    setShowConfig(false)
  }, [addToast])

  // ── Visual mode class ──────────────────────────────────
  const modeClass = visualStyle !== 'normal' ? `mode-${visualStyle}` : ''

  return (
    <div className={modeClass} style={{ height: '100%', position: 'relative' }}>
      {/* Overlays */}
      <div className="grid-overlay" />
      <div className="scan-overlay" />

      {/* Map */}
      <MapView
        layers={layers}
        config={config}
        flights={flights}
        quakes={quakes}
        iss={iss}
        fires={fires}
        onCoordsChange={setCoords}
        onTargetSelect={handleTargetSelect}
        onCCTVOpen={setShowCCTV}
      />

      {/* HUD */}
      <Header
        flights={flights}
        quakes={quakes}
        fires={fires}
        sidebarOpen={sidebarOpen}
        infoPanelOpen={infoPanelOpen}
        onSidebarToggle={() => setSidebarOpen(s => !s)}
        onInfoToggle={() => setInfoPanelOpen(s => !s)}
        onConfigOpen={() => setShowConfig(true)}
      />

      <Sidebar
        open={sidebarOpen}
        layers={layers}
        onToggleLayer={toggleLayer}
        style={visualStyle}
        onStyleChange={setVisualStyle}
        onConfigOpen={() => setShowConfig(true)}
        flights={flights}
        quakes={quakes}
        fires={fires}
        stats={{ issAlt: iss.data ? Math.round(iss.data.altitude) : null }}
      />

      <InfoPanel
        open={infoPanelOpen}
        flights={flights}
        quakes={quakes}
        iss={iss}
        fires={fires}
        target={target}
        onClose={() => setInfoPanelOpen(false)}
        onCCTVOpen={setShowCCTV}
      />

      <Footer coords={coords} />

      {/* Modals */}
      {showConfig && (
        <ConfigModal config={config} onSave={handleSaveConfig} onClose={() => setShowConfig(false)} />
      )}
      {showCCTV && (
        <CCTVModal cam={showCCTV} onClose={() => setShowCCTV(null)} />
      )}

      <Toasts toasts={toasts} />
    </div>
  )
}
