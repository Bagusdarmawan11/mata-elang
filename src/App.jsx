import { useState, useCallback } from 'react'
import MapView from './components/MapView.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import { InfoPanel, Footer, ConfigModal, CCTVModal, Toasts } from './components/UI.jsx'
import {
  useFlights, useShips, useQuakes, useBMKGQuakes,
  useISS, useFires, useWeather,
} from './hooks/useIntelData.js'
import { WEATHER_CITIES } from './data/regions.js'

export default function App() {
  const [layers, setLayers] = useState({
    flights:true, ships:false, quakes:true, bmkgQuakes:true,
    iss:true, fires:false, traffic:false, weather:false, cctv:false,
  })
  const [visualStyle, setVisualStyle] = useState('normal')
  const [target, setTarget]           = useState(null)
  const [coords, setCoords]           = useState(null)
  const [config, setConfig]           = useState({
    firms:  localStorage.getItem('me_firms')  || '',
    tomtom: localStorage.getItem('me_tomtom') || '',
    ais:    localStorage.getItem('me_ais')    || '',
  })
  const [sidebarOpen, setSidebarOpen]     = useState(true)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const [showConfig, setShowConfig]       = useState(false)
  const [showCCTV, setShowCCTV]           = useState(null)
  const [toasts, setToasts]               = useState([])

  // data hooks
  const flights    = useFlights(layers.flights)
  const ships      = useShips(layers.ships, config.ais)
  const quakes     = useQuakes(layers.quakes)
  const bmkgQuakes = useBMKGQuakes(layers.bmkgQuakes)
  const iss        = useISS(layers.iss)
  const fires      = useFires(layers.fires, config.firms)
  const weather    = useWeather(layers.weather, WEATHER_CITIES)

  const addToast = useCallback((msg, type='') => {
    const id = Date.now()
    setToasts(t => [...t, {id, msg, type}])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const toggleLayer = useCallback(name => {
    setLayers(prev => ({...prev, [name]: !prev[name]}))
  }, [])

  const handleTargetSelect = useCallback(t => {
    setTarget(t); setInfoPanelOpen(true)
  }, [])

  const handleSaveConfig = useCallback(newCfg => {
    if (newCfg.firms)  localStorage.setItem('me_firms', newCfg.firms)
    if (newCfg.tomtom) localStorage.setItem('me_tomtom', newCfg.tomtom)
    if (newCfg.ais)    localStorage.setItem('me_ais', newCfg.ais)
    setConfig(newCfg)
    addToast('API keys berhasil disimpan', 'success')
    setShowConfig(false)
  }, [addToast])

  return (
    <div className={visualStyle !== 'normal' ? `mode-${visualStyle}` : ''} style={{height:'100%',position:'relative'}}>
      <div className="grid-overlay"/>
      <div className="scan-overlay"/>
      <MapView
        layers={layers} config={config}
        flights={flights} ships={ships} quakes={quakes} bmkgQuakes={bmkgQuakes}
        iss={iss} fires={fires} weather={weather}
        onCoordsChange={setCoords} onTargetSelect={handleTargetSelect}
        onCCTVOpen={setShowCCTV}
      />
      <Header
        flights={flights} quakes={quakes} fires={fires} ships={ships}
        sidebarOpen={sidebarOpen} infoPanelOpen={infoPanelOpen}
        onSidebarToggle={() => setSidebarOpen(s => !s)}
        onInfoToggle={() => setInfoPanelOpen(s => !s)}
        onConfigOpen={() => setShowConfig(true)}
      />
      <Sidebar
        open={sidebarOpen} layers={layers} onToggleLayer={toggleLayer}
        style={visualStyle} onStyleChange={setVisualStyle}
        onConfigOpen={() => setShowConfig(true)}
        flights={flights} ships={ships} quakes={quakes} bmkgQuakes={bmkgQuakes}
        fires={fires} weather={weather} iss={iss}
      />
      <InfoPanel
        open={infoPanelOpen} flights={flights} quakes={quakes} iss={iss}
        fires={fires} ships={ships} bmkgQuakes={bmkgQuakes} target={target}
        onClose={() => setInfoPanelOpen(false)} onCCTVOpen={setShowCCTV}
      />
      <Footer coords={coords}/>
      {showConfig && <ConfigModal config={config} onSave={handleSaveConfig} onClose={() => setShowConfig(false)}/>}
      {showCCTV   && <CCTVModal  cam={showCCTV}   onClose={() => setShowCCTV(null)}/>}
      <Toasts toasts={toasts}/>
    </div>
  )
}
