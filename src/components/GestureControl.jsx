import { useEffect, useRef, useState, useCallback } from 'react'

// MediaPipe landmark indices
const TIPS  = [4, 8, 12, 16, 20]
const PIPS  = [3, 6, 10, 14, 18]
const BONES = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
]

// Analyze hand landmarks
function analyze(lm) {
  // Count fingers: tip.y < pip.y means finger is UP (extended)
  const extCount = [1,2,3,4].filter(i => lm[TIPS[i]].y < lm[PIPS[i]].y).length

  // Pinch distance: thumb tip (4) to index tip (8), normalized 0-1
  const pinch = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y)

  // Palm center (wrist + middle MCP average)
  const cx = (lm[0].x + lm[9].x) / 2
  const cy = (lm[0].y + lm[9].y) / 2

  return {
    pinch,
    extCount,
    center: { x: cx, y: cy },
    // Pinch: thumb+index very close, other fingers irrelevant
    isPinch: pinch < 0.075,
    // Palm: at least 3 fingers clearly extended
    isPalm:  extCount >= 3,
  }
}

// Draw hand skeleton on canvas (mirror-corrected)
function drawHand(ctx, lm, state, W, H) {
  const col = state.isPinch ? '#f59e0b' : state.isPalm ? '#10b981' : '#06b6d4'
  // Mirror: x = (1 - lm.x) * W
  const px = (i) => (1 - lm[i].x) * W
  const py = (i) => lm[i].y * H

  // Bones
  ctx.strokeStyle = col + '88'; ctx.lineWidth = 1.5
  BONES.forEach(([a, b]) => {
    ctx.beginPath(); ctx.moveTo(px(a),py(a)); ctx.lineTo(px(b),py(b)); ctx.stroke()
  })

  // Joints
  lm.forEach((_, i) => {
    const r = TIPS.includes(i) ? 5 : 3
    ctx.fillStyle = TIPS.includes(i) ? '#f43f5e' : col
    ctx.beginPath(); ctx.arc(px(i), py(i), r, 0, Math.PI*2); ctx.fill()
  })

  // Pinch line between thumb & index
  if (state.pinch < 0.15) {
    ctx.strokeStyle = state.isPinch ? '#f59e0b' : '#ffffff44'; ctx.lineWidth = 2
    ctx.setLineDash([4,3])
    ctx.beginPath(); ctx.moveTo(px(4),py(4)); ctx.lineTo(px(8),py(8)); ctx.stroke()
    ctx.setLineDash([])
    // Circle at midpoint
    const mx = (px(4)+px(8))/2, my = (py(4)+py(8))/2
    const r = Math.max(4, (0.15 - state.pinch) * 120)
    ctx.fillStyle = (state.isPinch ? '#f59e0b' : '#ffffff') + '33'
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI*2); ctx.fill()
  }

  // Mode label
  const label = state.isPinch ? '🤏 PINCH ZOOM' : state.isPalm ? '✋ PAN' : '👐 Siap'
  ctx.fillStyle = col + 'cc'; ctx.font = 'bold 11px monospace'
  ctx.fillText(label, 6, 18)
}

export default function GestureControl({ mapRef }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef  = useRef(null)
  const hlRef    = useRef(null)   // HandLandmarker instance
  const prevRef  = useRef(null)   // { pinch, center }

  const [active,  setActive]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode,    setMode]    = useState('—')
  const [err,     setErr]     = useState('')

  const stopAll = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    const v = videoRef.current
    if (v?.srcObject) { v.srcObject.getTracks().forEach(t => t.stop()); v.srcObject = null }
    hlRef.current = null; prevRef.current = null; setMode('—')
  }, [])

  useEffect(() => {
    if (!active) { stopAll(); return }
    let dead = false;

    (async () => {
      setLoading(true); setErr('')
      try {
        // Dynamic import to avoid build-time WASM issues
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const fs = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        )
        hlRef.current = await HandLandmarker.createFromOptions(fs, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        })
        if (dead) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' }
        })
        if (dead) { stream.getTracks().forEach(t => t.stop()); return }
        const vid = videoRef.current
        vid.srcObject = stream; await vid.play()
        const cv = canvasRef.current, ctx = cv.getContext('2d')
        cv.width = 320; cv.height = 240
        setLoading(false)

        const loop = () => {
          if (dead || !hlRef.current) return
          const now = performance.now()
          const map = mapRef?.current

          if (vid.readyState >= 2) {
            // Detect landmarks
            const res = hlRef.current.detectForVideo(vid, now)

            // Draw mirrored video frame
            ctx.save()
            ctx.scale(-1, 1); ctx.translate(-320, 0)
            ctx.drawImage(vid, 0, 0, 320, 240)
            ctx.restore()
            // Semi-dark overlay for better landmark visibility
            ctx.fillStyle = 'rgba(3,11,24,0.4)'
            ctx.fillRect(0, 0, 320, 240)

            const lm  = res.landmarks?.[0]
            const prev = prevRef.current

            if (lm && map) {
              const state = analyze(lm)
              drawHand(ctx, lm, state, 320, 240)

              // ── PINCH ZOOM ────────────────────────────────────────
              if (state.isPinch) {
                setMode('🤏 Cubit Zoom')
                if (prev?.pinch != null) {
                  const velocity = state.pinch - prev.pinch
                  // Spreading (velocity > 0) = "cubit keluar" = ZOOM IN
                  // Closing   (velocity < 0) = "cubit dalam"  = ZOOM OUT
                  if (Math.abs(velocity) > 0.002) {
                    // Scale: ~0.005/frame typical → ×5 = 0.025 zoom/frame → 1.5 zoom/sec
                    map.setZoom(map.getZoom() + velocity * 5, { animate: false })
                  }
                }
              }

              // ── PALM PAN ──────────────────────────────────────────
              else if (state.isPalm) {
                setMode('✋ Telapak Pan')
                if (prev?.center) {
                  const rawDx = state.center.x - prev.center.x
                  const rawDy = state.center.y - prev.center.y

                  // Camera is mirrored horizontally:
                  // User moves hand LEFT → raw x INCREASES (camera sees rightward)
                  // We want map to pan LEFT → panBy([-amount, 0])
                  // So: panX = -rawDx * scale  ← negate for natural mirror feel
                  const panX = -rawDx * 1100
                  const panY =  rawDy *  800  // Y needs no flip

                  if (Math.abs(panX) + Math.abs(panY) > 0.4) {
                    map.panBy([panX, panY], { animate: false })
                  }
                }
              }

              else {
                setMode('👐 Siap')
              }

              prevRef.current = { pinch: state.pinch, center: state.center }
            } else {
              prevRef.current = null
              setMode('—')
            }
          }
          animRef.current = requestAnimationFrame(loop)
        }
        loop()
      } catch(e) {
        if (!dead) { setErr(e.message||'Gagal init gesture control'); setLoading(false); setActive(false) }
      }
    })()
    return () => { dead = true; stopAll() }
  }, [active, stopAll, mapRef])

  return (
    <div style={W.wrap}>
      <button style={{...W.btn,...(active?W.on:{})}} onClick={()=>setActive(a=>!a)}>
        {loading?'⏳ Load model...' : active?'✋ Gesture ON':'🖐 Gesture Mode'}
      </button>

      {active && (
        <div style={W.panel}>
          <div style={W.title}>GESTURE CONTROL</div>

          {/* Camera preview */}
          <div style={W.pv}>
            <video ref={videoRef} muted playsInline style={{display:'none'}}/>
            <canvas ref={canvasRef} style={W.cv}/>
            {loading&&<div style={W.lo}>⏳ Memuat model AI...<br/><span style={{fontSize:8,color:'#475569'}}>Butuh internet ~10MB</span></div>}
          </div>

          {/* Current mode */}
          <div style={W.ml}><span style={W.md}/>{mode}</div>
          {err&&<div style={W.er}>⚠ {err}</div>}

          {/* Instructions */}
          <div style={W.gl}>
            <div style={W.gr}>
              <span style={{fontSize:16}}>🤏</span>
              <div>
                <div style={{color:'#e2e8f0'}}>Pinch Zoom</div>
                <div>Cubit keluar → Zoom in</div>
                <div>Cubit dalam → Zoom out</div>
              </div>
            </div>
            <div style={W.gr}>
              <span style={{fontSize:16}}>✋</span>
              <div>
                <div style={{color:'#e2e8f0'}}>Telapak Pan</div>
                <div>5 jari terbuka, geser</div>
                <div>ke segala arah</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const W = {
  wrap:{position:'fixed',bottom:36,right:16,zIndex:150,display:'flex',flexDirection:'column-reverse',gap:8,alignItems:'flex-end'},
  btn:{padding:'8px 14px',borderRadius:8,border:'1px solid rgba(30,60,100,.55)',background:'rgba(10,25,50,.96)',color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',fontSize:10,cursor:'pointer',backdropFilter:'blur(12px)',letterSpacing:1,transition:'all .2s',whiteSpace:'nowrap'},
  on:{borderColor:'#06b6d4',color:'#06b6d4',background:'rgba(6,182,212,.1)',boxShadow:'0 0 12px rgba(6,182,212,.2)'},
  panel:{background:'rgba(8,18,36,.97)',border:'1px solid rgba(6,182,212,.35)',borderRadius:12,padding:12,width:230,backdropFilter:'blur(24px)',boxShadow:'0 0 30px rgba(0,0,0,.5)'},
  title:{fontFamily:'JetBrains Mono,monospace',fontSize:9,letterSpacing:3,color:'#475569',marginBottom:8},
  pv:{position:'relative',width:'100%',borderRadius:8,overflow:'hidden',background:'#000',marginBottom:8,border:'1px solid rgba(30,60,100,.6)',aspectRatio:'4/3'},
  cv:{position:'absolute',inset:0,width:'100%',height:'100%'},
  lo:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#06b6d4',fontSize:10,fontFamily:'JetBrains Mono,monospace',background:'rgba(0,0,0,.85)',gap:4,textAlign:'center',padding:8},
  ml:{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#06b6d4',display:'flex',alignItems:'center',gap:7,marginBottom:10,minHeight:16},
  md:{width:7,height:7,borderRadius:'50%',background:'#06b6d4',animation:'pulse-dot 1.2s infinite',flexShrink:0},
  er:{fontSize:9,color:'#f43f5e',fontFamily:'JetBrains Mono,monospace',marginBottom:8,lineHeight:1.4,wordBreak:'break-word'},
  gl:{display:'flex',flexDirection:'column',gap:8},
  gr:{display:'flex',alignItems:'flex-start',gap:9,fontSize:9,color:'#475569',fontFamily:'JetBrains Mono,monospace',lineHeight:1.6},
}
