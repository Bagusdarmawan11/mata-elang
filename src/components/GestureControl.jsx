import { useEffect, useRef, useState, useCallback } from 'react'

const GESTURES = {
  Thumb_Up:    { label: '👍 Zoom In',    action: 'zoomIn'  },
  Pointing_Up: { label: '☝ Zoom In',    action: 'zoomIn'  },
  Thumb_Down:  { label: '👎 Zoom Out',   action: 'zoomOut' },
  Open_Palm:   { label: '✋ Pan Mode',    action: 'pan'     },
  Closed_Fist: { label: '✊ Stop',       action: 'stop'    },
  Victory:     { label: '✌ Reset View', action: 'reset'   },
}

export default function GestureControl({ mapRef }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const recogRef  = useRef(null)
  const lastPan   = useRef(null)
  const cooldown  = useRef(0)

  const [active,  setActive]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [gesture, setGesture] = useState('—')
  const [err,     setErr]     = useState('')

  const stopAll = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    const vid = videoRef.current
    if (vid?.srcObject) { vid.srcObject.getTracks().forEach(t => t.stop()); vid.srcObject = null }
    recogRef.current = null
    setGesture('—')
  }, [])

  useEffect(() => {
    if (!active) { stopAll(); return }
    let dead = false

    ;(async () => {
      setLoading(true); setErr('')
      try {
        const { GestureRecognizer, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const fs = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        )
        recogRef.current = await GestureRecognizer.createFromOptions(fs, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          },
          runningMode: 'VIDEO', numHands: 1,
        })
        if (dead) return

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
        if (dead) { stream.getTracks().forEach(t => t.stop()); return }
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        const cv = canvasRef.current
        const ctx = cv.getContext('2d')
        cv.width = 320; cv.height = 240
        setLoading(false)

        const loop = () => {
          if (dead || !recogRef.current) return
          const now = performance.now()
          const vid = videoRef.current
          if (vid.readyState >= 2) {
            const res = recogRef.current.recognizeForVideo(vid, now)
            // Mirror draw
            ctx.save(); ctx.scale(-1,1); ctx.translate(-320,0)
            ctx.drawImage(vid, 0, 0, 320, 240)
            ctx.restore()

            const map = mapRef?.current
            const g0  = res.gestures?.[0]?.[0]
            if (g0 && g0.score > 0.78 && map) {
              const info = GESTURES[g0.categoryName]
              if (info) {
                setGesture(`${info.label} (${Math.round(g0.score*100)}%)`)
                const t = Date.now()
                if (info.action === 'zoomIn'  && t > cooldown.current) { map.zoomIn(.5);  cooldown.current = t + 700 }
                if (info.action === 'zoomOut' && t > cooldown.current) { map.zoomOut(.5); cooldown.current = t + 700 }
                if (info.action === 'reset'   && t > cooldown.current) { map.setView([-2.5,118],5); cooldown.current = t + 1500 }
                if (info.action === 'pan') {
                  const lm = res.worldLandmarks?.[0]?.[0]
                  if (lm && lastPan.current) {
                    const dx = (lm.x - lastPan.current.x) * -600
                    const dy = (lm.y - lastPan.current.y) *  600
                    if (Math.abs(dx)+Math.abs(dy) > 0.5) map.panBy([dx,dy],{animate:false})
                  }
                  lastPan.current = res.worldLandmarks?.[0]?.[0] ? { x: res.worldLandmarks[0][0].x, y: res.worldLandmarks[0][0].y } : null
                } else { lastPan.current = null }
                // overlay label
                ctx.fillStyle='rgba(6,182,212,.9)'; ctx.font='bold 13px monospace'
                ctx.fillText(info.label, 8, 26)
              } else { setGesture('—'); lastPan.current = null }
            } else { setGesture('—'); lastPan.current = null }
          }
          animRef.current = requestAnimationFrame(loop)
        }
        loop()
      } catch(e) {
        if (!dead) { setErr(e.message || 'Gagal init gesture'); setLoading(false); setActive(false) }
      }
    })()

    return () => { dead = true; stopAll() }
  }, [active, stopAll, mapRef])

  return (
    <div style={W.wrap}>
      <button style={{...W.btn,...(active?W.btnOn:{})}} onClick={()=>setActive(a=>!a)}>
        {loading ? '⏳ Memuat model...' : active ? '✋ Gesture ON' : '🖐 Gesture Mode'}
      </button>
      {active && (
        <div style={W.panel}>
          <div style={W.ptitle}>GESTURE CONTROL</div>
          <div style={W.preview}>
            <video ref={videoRef} style={{display:'none'}} muted playsInline/>
            <canvas ref={canvasRef} style={W.canvas}/>
            {loading && <div style={W.loadOverlay}>Memuat MediaPipe...</div>}
          </div>
          <div style={W.glabel}><span style={W.gdot}/>{gesture}</div>
          {err && <div style={W.err}>⚠ {err}</div>}
          <div style={W.hints}>
            <span>👍 Zoom in</span><span>👎 Zoom out</span>
            <span>✋ Pan map</span><span>✌ Reset view</span>
          </div>
          <div style={W.note}>Butuh kamera &amp; koneksi internet untuk load model pertama kali</div>
        </div>
      )}
    </div>
  )
}

const W = {
  wrap:{position:'fixed',bottom:36,right:16,zIndex:150,display:'flex',flexDirection:'column-reverse',gap:8,alignItems:'flex-end'},
  btn:{padding:'8px 14px',borderRadius:8,border:'1px solid rgba(30,60,100,.55)',background:'rgba(10,25,50,.95)',color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',fontSize:10,cursor:'pointer',backdropFilter:'blur(12px)',letterSpacing:1,transition:'all .2s',whiteSpace:'nowrap'},
  btnOn:{borderColor:'#06b6d4',color:'#06b6d4',background:'rgba(6,182,212,.1)'},
  panel:{background:'rgba(10,25,50,.96)',border:'1px solid rgba(6,182,212,.35)',borderRadius:10,padding:12,width:220,backdropFilter:'blur(20px)'},
  ptitle:{fontFamily:'JetBrains Mono,monospace',fontSize:9,letterSpacing:3,color:'#475569',marginBottom:8},
  preview:{position:'relative',width:'100%',aspectRatio:'4/3',borderRadius:6,overflow:'hidden',background:'#000',marginBottom:8},
  canvas:{position:'absolute',inset:0,width:'100%',height:'100%'},
  loadOverlay:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#06b6d4',fontSize:10,fontFamily:'JetBrains Mono,monospace',background:'rgba(0,0,0,.7)'},
  glabel:{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#06b6d4',display:'flex',alignItems:'center',gap:6,marginBottom:6},
  gdot:{width:6,height:6,borderRadius:'50%',background:'#06b6d4',animation:'pulse-dot 1.5s infinite',flexShrink:0},
  err:{fontSize:9,color:'#f43f5e',fontFamily:'JetBrains Mono,monospace',marginBottom:6},
  hints:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,fontSize:9,color:'#475569',fontFamily:'JetBrains Mono,monospace',marginBottom:6},
  note:{fontSize:8,color:'#334155',fontFamily:'JetBrains Mono,monospace',lineHeight:1.4},
}
