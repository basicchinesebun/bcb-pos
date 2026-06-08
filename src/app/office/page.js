'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// ─── helpers ───
function fmt(n) { return (n || 0).toLocaleString() }
function fmtKip(n) { return fmt(n) + ' ກີບ' }
function todayRange() { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString() }
function monthRange() { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString() }
function branchStatus() {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours() + now.getMinutes() / 60
  const open = hour >= 15 && hour < 19.5
  const simeuang  = open && [1, 3, 5].includes(day)
  const houayhong = open && [2, 4, 6].includes(day)
  return { simeuang, houayhong, anyOpen: simeuang || houayhong }
}
const DAY_LABELS = ['ອາທິດ','ຈັນ','ອັງຄານ','ພຸດ','ພະຫັດ','ສຸກ','ເສົາ']

// ─── PIN PAD ───
function PinPad({ onSubmit, error }) {
  const [pin, setPin] = useState('')
  function press(v) {
    if (v === '⌫') { setPin(p => p.slice(0,-1)); return }
    if (pin.length >= 6) return
    const next = pin + v
    setPin(next)
    if (next.length === 6) { setTimeout(() => { onSubmit(next); setPin('') }, 120) }
  }
  return (
    <div className="h-dvh flex flex-col items-center justify-center" style={{ background: '#0a0503' }}>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏢</div>
        <div className="font-serif text-2xl font-black" style={{ color: '#fdf6ee' }}>BCB Office</div>
        <div className="text-sm font-bold mt-1" style={{ color: 'rgba(253,246,238,0.4)' }}>ໃສ່ລະຫັດ Staff</div>
      </div>
      <div className="flex gap-3 mb-5">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="w-3.5 h-3.5 rounded-full transition-all"
            style={{ background: pin.length > i ? '#fde68a' : 'rgba(253,246,238,0.15)' }} />
        ))}
      </div>
      {error && <div className="text-red-300 text-sm font-bold mb-4">{error}</div>}
      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
          <button key={i} onClick={() => k && press(k)}
            className="w-16 h-16 rounded-2xl font-black text-xl transition-all active:scale-90"
            style={{ background: k ? 'rgba(253,246,238,0.08)' : 'transparent', color: '#fdf6ee', border: k ? '1px solid rgba(253,246,238,0.12)' : 'none' }}>
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── ROW ───
function Row({ label, value, sub, big }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.45)' }}>{label}</span>
      <div className="text-right">
        <div className={`font-black ${big ? 'text-xl' : 'text-sm'}`} style={{ color: '#fdf6ee' }}>{value}</div>
        {sub && <div className="text-xs" style={{ color: 'rgba(253,246,238,0.35)' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── ROOM DEFINITIONS ───
const ROOM_DEFS = [
  { col:0, row:0, id:'walkin',  icon:'🏪', label:'Walk-in',
    topC:'#c4b5fd', leftC:'#2e1065', rightC:'#6d28d9',
    wallTop:'#7c3aed', wallBot:'#4c1d95' },
  { col:1, row:0, id:'pos',     icon:'💻', label:'POS',
    topC:'#93c5fd', leftC:'#1e3a8a', rightC:'#1d4ed8',
    wallTop:'#2563eb', wallBot:'#1e40af' },
  { col:2, row:0, id:'chatbot', icon:'🤖', label:'AI Chat',
    topC:'#67e8f9', leftC:'#0c4a6e', rightC:'#0369a1',
    wallTop:'#0891b2', wallBot:'#075985' },
  { col:0, row:1, id:'content', icon:'📱', label:'Content',
    topC:'#f9a8d4', leftC:'#4a044e', rightC:'#be185d',
    wallTop:'#db2777', wallBot:'#9d174d' },
  { col:1, row:1, id:'finance', icon:'💰', label:'Finance',
    topC:'#86efac', leftC:'#052e16', rightC:'#15803d',
    wallTop:'#16a34a', wallBot:'#14532d' },
  { col:2, row:1, id:'slip',    icon:'🧾', label:'Slip',
    topC:'#fdba74', leftC:'#431407', rightC:'#b45309',
    wallTop:'#d97706', wallBot:'#92400e' },
]

// ─── ISOMETRIC BUILDING ───
function IsoBuilding({ active, onSelect, roomStatus }) {
  const cx = 76, cy = 38, WH = 108, OX = 246, OY = 74

  function iso(c, r) { return [OX + (c - r) * cx, OY + (c + r) * cy] }
  function pts(arr) { return arr.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ') }

  // Returns parallelogram window points on a wall
  // e1,e2: start/end of top wall edge; t1,t2: along param; h1,h2: height offsets
  function win(e1, e2, t1, t2, h1, h2) {
    const dx = e2[0]-e1[0], dy = e2[1]-e1[1]
    return [
      [e1[0]+t1*dx, e1[1]+t1*dy+h1],
      [e1[0]+t2*dx, e1[1]+t2*dy+h1],
      [e1[0]+t2*dx, e1[1]+t2*dy+h2],
      [e1[0]+t1*dx, e1[1]+t1*dy+h2],
    ]
  }

  const sorted = [...ROOM_DEFS].sort((a,b) => (a.col+a.row) - (b.col+b.row) || a.col - b.col)

  const PH = 10  // parapet height
  const FL = WH * 0.48  // floor divider position

  return (
    <svg viewBox="0 0 580 480" className="w-full select-none" style={{ maxHeight:'440px' }}>
      <defs>
        <style>{`
          @keyframes neonPulse {
            0%,100% { opacity:1; filter:drop-shadow(0 0 8px #fde68a) drop-shadow(0 0 16px #f59e0b); }
            50%      { opacity:0.75; filter:drop-shadow(0 0 4px #fde68a); }
          }
          @keyframes statusPulse {
            0%,100% { r:5; opacity:1; }
            50%      { r:7; opacity:0.6; }
          }
          .neon-sign { animation: neonPulse 2.8s ease-in-out infinite; }
          .status-ok { animation: statusPulse 2s ease-in-out infinite; }
        `}</style>
        <radialGradient id="bgG" cx="50%" cy="15%" r="75%">
          <stop offset="0%" stopColor="#1c0e04" />
          <stop offset="100%" stopColor="#050201" />
        </radialGradient>
        <radialGradient id="groundG" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#2a1508" />
          <stop offset="100%" stopColor="#0d0602" />
        </radialGradient>
        <radialGradient id="moonG" cx="38%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#fffde7" />
          <stop offset="100%" stopColor="#fde68a" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="winGlow">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.6"/>
        </filter>
      </defs>

      {/* Sky */}
      <rect width="580" height="480" fill="url(#bgG)" rx="14"/>

      {/* Stars */}
      {[[28,16],[72,28],[140,10],[210,22],[295,8],[370,19],[440,32],[510,15],[545,48],[60,55],[165,44],[480,62],[340,50],[90,75],[510,80]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i%5===0?2.2:1.4} fill="white" opacity={0.2+((i*37)%60)/200}/>
      ))}

      {/* Moon */}
      <circle cx={510} cy={40} r={22} fill="url(#moonG)" opacity="0.88" filter="url(#glow)"/>
      <circle cx={522} cy={33} r={17} fill="#0a0401"/>

      {/* Ground */}
      <polygon points={pts([iso(-1,-0.5),iso(4,-0.5),iso(4,3),iso(-1,3)])} fill="url(#groundG)"/>
      {/* Ground grid lines */}
      {[0,1,2,3].map(c => {
        const a = iso(c,0), b = iso(c,3)
        return <line key={'gc'+c} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(255,200,100,0.06)" strokeWidth="0.8"/>
      })}
      {[0,1,2,3].map(r => {
        const a = iso(0,r), b = iso(3,r)
        return <line key={'gr'+r} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(255,200,100,0.06)" strokeWidth="0.8"/>
      })}

      {/* Rooms */}
      {sorted.map(room => {
        const { col, row, id, topC, leftC, rightC, wallTop, wallBot } = room
        const [nx,ny] = iso(col,   row)
        const [ex,ey] = iso(col+1, row)
        const [sx,sy] = iso(col+1, row+1)
        const [wx,wy] = iso(col,   row+1)
        const isActive = active === id
        const status = roomStatus?.[id]
        const dotColor = status==='ok'?'#4ade80' : status==='warn'?'#fb923c' : '#475569'

        // Windows: 2 per wall per floor = 4 per wall
        const E = [ex,ey], S = [sx,sy], W = [wx,wy]
        // Right wall windows (E→S direction)
        const rW = [
          win(E,S, 0.06,0.42, WH*0.06,WH*0.40),
          win(E,S, 0.58,0.94, WH*0.06,WH*0.40),
          win(E,S, 0.06,0.42, WH*0.56,WH*0.90),
          win(E,S, 0.58,0.94, WH*0.56,WH*0.90),
        ]
        // Left wall windows (W→S direction)
        const lW = [
          win(W,S, 0.08,0.44, WH*0.06,WH*0.40),
          win(W,S, 0.56,0.92, WH*0.06,WH*0.40),
          win(W,S, 0.08,0.44, WH*0.56,WH*0.90),
          win(W,S, 0.56,0.92, WH*0.56,WH*0.90),
        ]

        // Wall gradient: two-tone using floor divider
        const floorDx_r = (sx-ex)*1, floorDy_r = (sy-ey)*1
        const floorDx_l = (sx-wx)*1, floorDy_l = (sy-wy)*1

        // Top floor belt (darker), bottom floor (lighter) for right wall
        const rTop = [[ex,ey],[sx,sy],[sx,sy+FL],[ex,ey+FL]]
        const rBot = [[ex,ey+FL],[sx,sy+FL],[sx,sy+WH],[ex,ey+WH]]
        const lTop = [[wx,wy],[sx,sy],[sx,sy+FL],[wx,wy+FL]]
        const lBot = [[wx,wy+FL],[sx,sy+FL],[sx,sy+WH],[wx,wy+WH]]

        const tcx = (nx+sx)/2, tcy = (ny+sy)/2

        return (
          <g key={id} onClick={() => onSelect(id===active?null:id)} style={{cursor:'pointer'}} filter={isActive?'url(#shadow)':undefined}>
            {/* LEFT WALL — upper floor */}
            <polygon points={pts(lTop)} fill={leftC}/>
            {/* LEFT WALL — lower floor (slightly lighter) */}
            <polygon points={pts(lBot)} fill={leftC} opacity="0.78"/>
            {/* Floor divider line on left wall */}
            <line x1={wx + (sx-wx)*0} y1={wy + (sy-wy)*0+FL} x2={wx + (sx-wx)*1} y2={wy + (sy-wy)*1+FL}
              stroke="rgba(255,255,255,0.12)" strokeWidth="1.2"/>
            {/* Left wall edge highlight */}
            <line x1={wx} y1={wy} x2={wx} y2={wy+WH} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
            {/* Left windows */}
            {lW.map((w,i) => (
              <g key={i}>
                <polygon points={pts(w)} fill={isActive?'#fef3c7':'#fde68a'} opacity={isActive?0.72:0.35} filter="url(#winGlow)"/>
                <polygon points={pts(w)} fill="none" stroke="#fde68a" strokeWidth="0.7" opacity="0.5"/>
                {/* window pane divider */}
                <line
                  x1={(w[0][0]+w[1][0])/2} y1={(w[0][1]+w[1][1])/2}
                  x2={(w[3][0]+w[2][0])/2} y2={(w[3][1]+w[2][1])/2}
                  stroke="#fde68a" strokeWidth="0.5" opacity="0.4"/>
              </g>
            ))}

            {/* RIGHT WALL — upper floor */}
            <polygon points={pts(rTop)} fill={rightC}/>
            {/* RIGHT WALL — lower floor */}
            <polygon points={pts(rBot)} fill={rightC} opacity="0.82"/>
            {/* Floor divider line on right wall */}
            <line x1={ex + (sx-ex)*0} y1={ey + (sy-ey)*0+FL} x2={ex + (sx-ex)*1} y2={ey + (sy-ey)*1+FL}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
            {/* Right wall edge highlight */}
            <line x1={sx} y1={sy} x2={sx} y2={sy+WH} stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
            {/* Right windows */}
            {rW.map((w,i) => (
              <g key={i}>
                <polygon points={pts(w)} fill={isActive?'#fef3c7':'#fde68a'} opacity={isActive?0.72:0.4} filter="url(#winGlow)"/>
                <polygon points={pts(w)} fill="none" stroke="#fde68a" strokeWidth="0.7" opacity="0.5"/>
                <line
                  x1={(w[0][0]+w[1][0])/2} y1={(w[0][1]+w[1][1])/2}
                  x2={(w[3][0]+w[2][0])/2} y2={(w[3][1]+w[2][1])/2}
                  stroke="#fde68a" strokeWidth="0.5" opacity="0.4"/>
              </g>
            ))}

            {/* TOP FACE (roof) */}
            <polygon points={pts([[nx,ny],[ex,ey],[sx,sy],[wx,wy]])}
              fill={isActive ? '#fffdf5' : topC}
              stroke={isActive ? '#fdf6ee' : 'rgba(255,255,255,0.18)'} strokeWidth={isActive?2:0.8}/>

            {/* PARAPET — front edges only (N→E and N→W) */}
            <polygon points={pts([[nx,ny-PH],[ex,ey-PH],[ex,ey],[nx,ny]])}
              fill={rightC} opacity="0.6" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
            <polygon points={pts([[nx,ny-PH],[wx,wy-PH],[wx,wy],[nx,ny]])}
              fill={leftC} opacity="0.55" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
            {/* Parapet top edge */}
            <line x1={nx} y1={ny-PH} x2={ex} y2={ey-PH} stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            <line x1={nx} y1={ny-PH} x2={wx} y2={wy-PH} stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>

            {/* Roof edge outlines */}
            <line x1={nx} y1={ny} x2={ex} y2={ey} stroke="rgba(255,255,255,0.22)" strokeWidth="1"/>
            <line x1={nx} y1={ny} x2={wx} y2={wy} stroke="rgba(255,255,255,0.16)" strokeWidth="1"/>

            {/* Status light on roof */}
            <circle cx={tcx} cy={tcy-4} r={5} fill={dotColor} filter="url(#glow)" className={status==='ok'?'status-ok':''}/>
            <circle cx={tcx} cy={tcy-4} r={2.2} fill="white" opacity="0.85"/>

            {/* Room icon */}
            <text x={tcx} y={tcy+14} textAnchor="middle" fontSize="13" style={{userSelect:'none'}}>{room.icon}</text>

            {/* Active ring */}
            {isActive && (
              <polygon points={pts([[nx,ny],[ex,ey],[sx,sy],[wx,wy]])}
                fill="none" stroke="#fdf6ee" strokeWidth="3" opacity="0.9"/>
            )}
          </g>
        )
      })}

      {/* Rooftop details — AC units on back row */}
      {[0,1,2].map(col => {
        const [rx,ry] = iso(col+0.3, col % 2 === 0 ? 0.15 : 0.2)
        return (
          <g key={col}>
            <rect x={rx-5} y={ry-12} width={10} height={8} rx="1"
              fill="#1a1a2e" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
            <rect x={rx-3} y={ry-13} width={6} height={3} rx="0.5" fill="#0f3460" opacity="0.8"/>
          </g>
        )
      })}

      {/* Trees */}
      {[[-1.2, 2.2], [3.15, 0.8], [-0.8, 0.5], [3.0, 2.5]].map(([tc, tr], i) => {
        const [tx, ty] = iso(tc, tr)
        const h = 50+i*8
        return (
          <g key={i}>
            <line x1={tx} y1={ty} x2={tx} y2={ty+h*0.45} stroke="#2d1b09" strokeWidth="3"/>
            <ellipse cx={tx} cy={ty-h*0.2} rx={18+i*3} ry={28+i*4}
              fill={['#1a4d1f','#1e5922','#163d1a','#1f5226'][i]} opacity="0.9"/>
            <ellipse cx={tx} cy={ty-h*0.2} rx={18+i*3} ry={28+i*4}
              fill="none" stroke="#2d6b2d" strokeWidth="0.8" opacity="0.5"/>
            {/* Tree highlight */}
            <ellipse cx={tx-4} cy={ty-h*0.2-5} rx={8+i} ry={10+i}
              fill="#2d7a35" opacity="0.4"/>
          </g>
        )
      })}

      {/* Street lamp */}
      {[[-0.1, 2.8], [3.1, 1.7]].map(([tc,tr],i) => {
        const [lx,ly] = iso(tc,tr)
        return (
          <g key={i} filter="url(#glow)">
            <line x1={lx} y1={ly} x2={lx} y2={ly-55} stroke="#b45309" strokeWidth="2"/>
            <path d={`M ${lx} ${ly-55} Q ${lx+18} ${ly-62} ${lx+20} ${ly-50}`} fill="none" stroke="#b45309" strokeWidth="2"/>
            <circle cx={lx+20} cy={ly-50} r={5} fill="#fde68a" opacity="0.9" filter="url(#glow)"/>
            <ellipse cx={lx+20} cy={ly-42} rx={10} ry={5} fill="#fde68a" opacity="0.12"/>
          </g>
        )
      })}

      {/* Entrance — front arch */}
      {(() => {
        const [dx, dy] = iso(1.5, 2.05)
        return (
          <g>
            {/* Steps */}
            <polygon points={pts([[dx-18,dy+2],[dx+18,dy+2],[dx+16,dy+8],[dx-16,dy+8]])} fill="#1a0c06"/>
            <polygon points={pts([[dx-16,dy+8],[dx+16,dy+8],[dx+13,dy+14],[dx-13,dy+14]])} fill="#150a04"/>
            {/* Door frame */}
            <rect x={dx-13} y={dy-42} width={26} height={44} rx="13" fill="#0a0503" stroke="#c97d2a" strokeWidth="2"/>
            <rect x={dx-9} y={dy-40} width={18} height={36} rx="9" fill="#150a04"/>
            {/* Door handle */}
            <circle cx={dx+4} cy={dy-18} r={2.5} fill="#f59e0b"/>
            {/* Frame glow */}
            <rect x={dx-13} y={dy-42} width={26} height={44} rx="13" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.5" filter="url(#glow)"/>
          </g>
        )
      })()}

      {/* NEON SIGN */}
      {(() => {
        const [sx2, sy2] = iso(1.5, 2.05)
        return (
          <g className="neon-sign">
            {/* Sign board */}
            <rect x={sx2-85} y={sy2+22} width={170} height={32} rx="6"
              fill="#0d0602" stroke="#f59e0b" strokeWidth="1.5" opacity="0.95"/>
            <rect x={sx2-82} y={sy2+25} width={164} height={26} rx="4"
              fill="rgba(253,214,42,0.06)"/>
            {/* Sign text */}
            <text x={sx2} y={sy2+41}
              textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="13" fontWeight="900"
              fill="#fde68a"
              letterSpacing="1.5"
              style={{userSelect:'none'}}>
              BASIC CHINESE BUN
            </text>
            {/* Corner ornaments */}
            <text x={sx2-76} y={sy2+41} fontSize="9" fill="#f59e0b" opacity="0.7">✦</text>
            <text x={sx2+70} y={sy2+41} fontSize="9" fill="#f59e0b" opacity="0.7">✦</text>
          </g>
        )
      })()}

      {/* Room labels under each room */}
      {ROOM_DEFS.map(room => {
        const [sx3, sy3] = iso(room.col+1, room.row+1)
        const isActive = active === room.id
        return (
          <text key={room.id}
            x={sx3} y={sy3+WH+18}
            textAnchor="middle" fontSize="9.5" fontWeight="bold"
            fill={isActive ? '#fde68a' : 'rgba(253,246,238,0.38)'}
            style={{userSelect:'none'}}>
            {room.label}
          </text>
        )
      })}
    </svg>
  )
}

function shiftLighten(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + 55)
  const g = Math.min(255, ((n >>  8) & 0xff) + 45)
  const b = Math.min(255, ((n      ) & 0xff) + 40)
  return `rgb(${r},${g},${b})`
}

// ─── SLIP CHECKER ───
function SlipCard({ orders, slipResults, todayCount, limit, onResult, onSaveLimit }) {
  const [checking,     setChecking]     = useState({})
  const [localResults, setLocalResults] = useState({})
  const [limitInput,   setLimitInput]   = useState(String(limit || 100))
  const [showSettings, setShowSettings] = useState(false)
  const [error,        setError]        = useState(null)

  const allResults = { ...slipResults, ...localResults }
  const slipOrders = (orders || []).filter(o => o.type==='online' && o.slip_url && !o.done && !o.cancelled)
  const warned = slipOrders.filter(o => { const r=allResults[o.id]; return r&&(r.suspicious||!r.amount_matches||!r.date_is_today) })

  async function checkOrder(o) {
    if (checking[o.id]) return
    setChecking(p => ({ ...p, [o.id]:true })); setError(null)
    try {
      const res = await fetch('/api/verify-slip', { method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ slipUrl:o.slip_url, expectedAmount:o.total, orderId:o.id }) })
      const data = await res.json()
      if (data.limitReached) setError(`ຄົບ Limit (${data.count}/${data.limit})`)
      else if (data.ok) { setLocalResults(p => ({ ...p, [o.id]:data.result })); onResult?.(o.id,data.result,data.count) }
      else setError(data.error||'ຜິດພາດ')
    } catch(err) { setError(err.message) }
    finally { setChecking(p => ({ ...p, [o.id]:false })) }
  }

  async function checkAll() { for(const o of slipOrders) { if(!allResults[o.id]) await checkOrder(o) } }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold" style={{color:'rgba(253,246,238,0.5)'}}>
          ວັນນີ້: <span style={{color:'#fde68a'}}>{todayCount}</span>/{limit} ໃບ
        </div>
        {warned.length>0 && <div className="text-xs font-black px-2 py-0.5 rounded-full" style={{background:'#7f1d1d',color:'#fca5a5'}}>⚠ {warned.length} ໃບ</div>}
      </div>
      {slipOrders.filter(o=>!allResults[o.id]).length>0 && todayCount<limit && (
        <button onClick={checkAll} className="w-full py-2 rounded-xl font-black text-sm" style={{background:'#d97706',color:'#fff'}}>
          🔍 ກວດທັງໝົດ ({slipOrders.filter(o=>!allResults[o.id]).length} ໃບ)
        </button>
      )}
      {error && <div className="px-3 py-2 rounded-xl text-xs font-bold" style={{background:'rgba(127,29,29,0.5)',color:'#fca5a5'}}>❌ {error}</div>}
      {slipOrders.length===0
        ? <div className="text-xs font-bold text-center py-3" style={{color:'rgba(253,246,238,0.3)'}}>ບໍ່ມີ Preorder ລໍຖ້າ</div>
        : <div className="flex flex-col gap-1.5">
            {slipOrders.map(o => {
              const r = allResults[o.id]
              const sc = r ? (r.suspicious||!r.amount_matches||!r.date_is_today?'warn':'ok') : null
              const isChecking = checking[o.id]
              const cust = o.customer ? (typeof o.customer==='string' ? (()=>{ try{return JSON.parse(o.customer)}catch{return null} })() : o.customer) : null
              return (
                <div key={o.id} className="rounded-xl p-2.5 flex items-center gap-2"
                  style={{background:sc==='warn'?'rgba(127,29,29,0.35)':sc==='ok'?'rgba(20,83,45,0.35)':'rgba(255,255,255,0.05)', border:`1px solid ${sc==='warn'?'#991b1b':sc==='ok'?'#166534':'rgba(255,255,255,0.08)'}`}}>
                  <a href={o.slip_url} target="_blank" rel="noopener noreferrer">
                    <img src={o.slip_url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="slip" style={{border:'1px solid rgba(255,255,255,0.1)'}}/>
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black" style={{color:'#fdf6ee'}}>#{String(o.qnum||0).padStart(4,'0')} · {fmt(o.total)} ກີບ</div>
                    {cust?.name && <div className="text-xs truncate" style={{color:'rgba(253,246,238,0.5)'}}>{cust.name}</div>}
                    {r && <div className="text-xs font-bold mt-0.5" style={{color:sc==='ok'?'#86efac':'#fca5a5'}}>
                      {sc==='ok'?'✅ ຜ່ານ':[!r.amount_matches&&`❌ ຈຳນວນ ${fmt(r.amount_found)}`,!r.date_is_today&&'⚠ ວັນທີ',r.suspicious&&'🚨 ສົງໄສ'].filter(Boolean).join(' · ')}
                    </div>}
                  </div>
                  {!r && <button onClick={()=>checkOrder(o)} disabled={isChecking}
                    className="flex-shrink-0 text-xs font-black px-2.5 py-1.5 rounded-lg"
                    style={{background:isChecking?'rgba(255,255,255,0.08)':'#d97706',color:'#fff'}}>
                    {isChecking?'...':'ກວດ'}
                  </button>}
                </div>
              )
            })}
          </div>
      }
      <button onClick={()=>setShowSettings(v=>!v)} className="text-xs font-bold text-center pt-1" style={{color:'rgba(253,246,238,0.3)'}}>
        ⚙ Limit {showSettings?'▲':'▼'}
      </button>
      {showSettings && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{color:'rgba(253,246,238,0.4)'}}>Limit/ວັນ:</span>
          <input type="number" min="1" max="9999" value={limitInput} onChange={e=>setLimitInput(e.target.value)}
            className="w-20 px-2 py-1 rounded-lg text-xs font-black text-center"
            style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'#fdf6ee'}}/>
          <button onClick={()=>{const v=parseInt(limitInput);if(v>0)onSaveLimit?.(v)}}
            className="flex-1 py-1.5 rounded-lg text-xs font-black" style={{background:'#d97706',color:'#fff'}}>ບັນທຶກ</button>
        </div>
      )}
    </div>
  )
}

// ─── ROOM DETAIL ───
function RoomDetail({ roomId, onClose, data }) {
  const room = ROOM_DEFS.find(r => r.id===roomId)
  if (!room) return null
  const { orders, settings, branches, msgCount, slipResults, slipLimit, slipTodayCount,
    onSlipResult, onSaveLimit, revenueToday, revenueMonth, doneToday, monthOrders,
    pendingOnline, walkinToday, preorderToday, lowStockMenus, branch, dayLabel, timeStr } = data

  const panelContent = () => {
    if (roomId==='walkin') return <>
      <Row label="ວັນທີ" value={`${dayLabel} ${timeStr}`}/>
      <Row label="ສາຂາສີເມືອງ" value={branch.simeuang?'ເປີດ ✓':'ປິດ'} sub="ຈ·ພ·ສ 15:00–19:30"/>
      <Row label="ສາຂາຫວຍຫົງ" value={branch.houayhong?'ເປີດ ✓':'ປິດ'} sub="ຄ·ສກ·ອ 15:00–19:30"/>
      {branches.map(b => b.phone1 && <Row key={b.id} label={b.name} value={'📞 '+b.phone1}/>)}
    </>
    if (roomId==='pos') return <>
      <Row label="Walk-in ວັນນີ້" value={walkinToday+' ໃບ'}/>
      <Row label="Preorder ວັນນີ້" value={preorderToday+' ໃບ'}/>
      <Row label="Pending" value={pendingOnline.length+' ໃບ'}/>
      <Row label="ຍອດ Done ວັນນີ້" value={fmtKip(revenueToday)} big/>
      {lowStockMenus.length>0 && <div className="mt-2 px-2 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(251,191,36,0.1)',color:'#fcd34d',border:'1px solid rgba(251,191,36,0.15)'}}>⚠ ໃກ້ໝົດ: {lowStockMenus.map(m=>m.lo||m).join(', ')}</div>}
    </>
    if (roomId==='chatbot') return <>
      <Row label="AI Status" value={settings.aiOn!==false?'Online ✓':'Offline'}/>
      <Row label="ຂໍ້ຄວາມວັນ" value={msgCount+' ຂໍ້ຄວາມ'}/>
      <Row label="ຮັບ Online" value={settings.onlineOn!==false?'ເປີດ ✓':'ປິດ'}/>
      <Row label="ຮັບ Walk-in" value={settings.walkinOn!==false?'ເປີດ ✓':'ປິດ'}/>
      {settings.aiOn===false && <div className="mt-2 px-2 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(220,38,38,0.12)',color:'#fca5a5',border:'1px solid rgba(220,38,38,0.15)'}}>AI ຖືກປິດ</div>}
    </>
    if (roomId==='content') return <>
      {branches.length>0 ? branches.map(b => (
        <div key={b.id} className="mb-2">
          <div className="text-xs font-black mb-1" style={{color:'rgba(253,246,238,0.4)'}}>{b.name}</div>
          <div className="flex gap-2 flex-wrap">
            {b.facebookUrl && <a href={b.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:'rgba(37,99,235,0.2)',color:'#93c5fd'}}>Facebook →</a>}
            {b.tiktokUrl   && <a href={b.tiktokUrl}   target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:'rgba(126,34,206,0.2)',color:'#d8b4fe'}}>TikTok →</a>}
          </div>
        </div>
      )) : <div className="text-xs py-2" style={{color:'rgba(253,246,238,0.35)'}}>ຕັ້ງຄ່າ Branch ກ່ອນ</div>}
      <div className="mt-1 px-2 py-2 rounded-lg text-xs text-center" style={{background:'rgba(255,255,255,0.04)',color:'rgba(253,246,238,0.25)',border:'1px dashed rgba(255,255,255,0.08)'}}>📊 Engagement coming soon</div>
    </>
    if (roomId==='finance') return <>
      <Row label="ຍອດ Done ວັນ" value={fmtKip(revenueToday)} big/>
      <Row label="ຍອດ Done ເດືອນ" value={fmtKip(revenueMonth)}/>
      <Row label="Order Done ວັນ" value={doneToday.length+' ໃບ'}/>
      <Row label="Order Done ເດືອນ" value={monthOrders.length+' ໃບ'}/>
      {revenueToday>0&&doneToday.length>0 && <Row label="ສະເລ່ຍ/ໃບ" value={fmtKip(Math.round(revenueToday/doneToday.length))}/>}
      <div className="mt-2 px-2 py-2 rounded-lg text-xs text-center" style={{background:'rgba(22,163,74,0.08)',color:'rgba(134,239,172,0.4)',border:'1px dashed rgba(22,163,74,0.15)'}}>💳 ລາຍຈ່າຍ coming soon</div>
    </>
    if (roomId==='slip') return <SlipCard orders={orders} slipResults={slipResults} todayCount={slipTodayCount} limit={slipLimit} onResult={onSlipResult} onSaveLimit={onSaveLimit}/>
  }

  return (
    <div className="rounded-2xl p-5 mx-3 mb-4" style={{
      background:'linear-gradient(145deg,#120806,#060201)',
      border:`1.5px solid ${room.rightC}`,
      boxShadow:`0 0 40px ${room.rightC}25, inset 0 1px 0 rgba(255,255,255,0.06)`,
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{room.icon}</span>
          <span className="font-black text-base" style={{color:'#fdf6ee'}}>{room.label}</span>
        </div>
        <button onClick={onClose} className="text-xs font-black px-3 py-1.5 rounded-xl" style={{background:'rgba(255,255,255,0.07)',color:'rgba(253,246,238,0.55)'}}>✕</button>
      </div>
      <div className="flex flex-col">{panelContent()}</div>
    </div>
  )
}

// ─── MAIN PAGE ───
export default function OfficePage() {
  const [unlocked,      setUnlocked]      = useState(false)
  const [staffPin,      setStaffPin]      = useState('')
  const [pinError,      setPinError]      = useState('')
  const [loading,       setLoading]       = useState(true)
  const [lastUpdate,    setLastUpdate]    = useState(null)
  const [activeRoom,    setActiveRoom]    = useState(null)

  const [orders,         setOrders]         = useState([])
  const [menus,          setMenus]          = useState([])
  const [stockShop,      setStockShop]      = useState([])
  const [stockOnline,    setStockOnline]    = useState([])
  const [settings,       setSettings]       = useState({})
  const [shopInfo,       setShopInfo]       = useState({ name:'Basic Chinese Bun' })
  const [branches,       setBranches]       = useState([])
  const [msgCount,       setMsgCount]       = useState(0)
  const [slipResults,    setSlipResults]    = useState({})
  const [slipLimit,      setSlipLimit]      = useState(100)
  const [slipTodayCount, setSlipTodayCount] = useState(0)

  const loadConfig = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('shop_config').select('*')
    if (!data) return
    const cfg = {}
    data.forEach(r => { cfg[r.key] = r.value })
    if (cfg.menus)        setMenus(JSON.parse(cfg.menus))
    if (cfg.stock_shop)   setStockShop(JSON.parse(cfg.stock_shop))
    if (cfg.stock_online) setStockOnline(JSON.parse(cfg.stock_online))
    if (cfg.settings)     setSettings(JSON.parse(cfg.settings))
    if (cfg.shop_info)    setShopInfo(JSON.parse(cfg.shop_info))
    if (cfg.branches)     setBranches(JSON.parse(cfg.branches))
    if (cfg.staff_pin)    setStaffPin(cfg.staff_pin)
    if (cfg.slip_verify_results) { try { setSlipResults(JSON.parse(cfg.slip_verify_results)) } catch {} }
    if (cfg.slip_verify_limit)   setSlipLimit(parseInt(cfg.slip_verify_limit)||100)
    if (cfg.slip_verify_today) {
      try {
        const t = JSON.parse(cfg.slip_verify_today)
        const todayISO = new Date().toISOString().split('T')[0]
        setSlipTodayCount(t.date===todayISO ? (t.count||0) : 0)
      } catch {}
    }
  }, [])

  const loadOrders = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('orders')
      .select('id,qnum,type,status,total,done,cancelled,created_at,done_at,slip_url,customer')
      .order('created_at', { ascending:false })
    if (data) setOrders(data)
  }, [])

  const loadMessages = useCallback(async () => {
    if (!supabase) return
    const { count } = await supabase.from('messages').select('id',{count:'exact',head:true}).gte('created_at',todayRange())
    setMsgCount(count||0)
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([loadConfig(), loadOrders(), loadMessages()])
    setLastUpdate(new Date()); setLoading(false)
  }, [loadConfig, loadOrders, loadMessages])

  useEffect(() => { refresh(); const t=setInterval(refresh,60000); return ()=>clearInterval(t) }, [refresh])

  function tryPin(pin) {
    if (!staffPin || pin===staffPin) { setUnlocked(true); setPinError('') }
    else setPinError('ລະຫັດຜິດ')
  }

  if (!unlocked) return <PinPad onSubmit={tryPin} error={pinError}/>

  const today      = todayRange()
  const monthStart = monthRange()
  const now        = new Date()
  const dayLabel   = DAY_LABELS[now.getDay()]
  const timeStr    = now.toLocaleTimeString('lo-LA', { hour:'2-digit', minute:'2-digit' })

  const todayOrders   = orders.filter(o => o.created_at >= today)
  const doneToday     = todayOrders.filter(o => o.done)
  const revenueToday  = doneToday.reduce((s,o) => s+(o.total||0), 0)
  const pendingOnline = orders.filter(o => o.type==='online' && o.status==='pending' && !o.done && !o.cancelled)
  const walkinToday   = todayOrders.filter(o => o.type==='walkin').length
  const preorderToday = todayOrders.filter(o => o.type==='online').length
  const monthOrders   = orders.filter(o => o.created_at>=monthStart && o.done)
  const revenueMonth  = monthOrders.reduce((s,o) => s+(o.total||0), 0)
  const LOW = 5
  const lowStockMenus = menus.filter((_,i) => (stockShop[i]||0)<=LOW || (stockOnline[i]||0)<=LOW)
  const branch        = branchStatus()

  const slipOrders = orders.filter(o => o.type==='online' && o.slip_url && !o.done && !o.cancelled)
  const slipWarned = slipOrders.filter(o => { const r=slipResults[o.id]; return r&&(r.suspicious||!r.amount_matches||!r.date_is_today) })
  const roomStatus = {
    walkin:  branch.anyOpen ? 'ok' : 'idle',
    pos:     todayOrders.length > 0 ? 'ok' : 'idle',
    chatbot: settings.aiOn !== false ? 'ok' : 'warn',
    content: 'idle',
    finance: revenueToday > 0 ? 'ok' : 'idle',
    slip:    slipWarned.length>0 ? 'warn' : slipOrders.length>0 ? 'ok' : 'idle',
  }

  const detailData = {
    orders, menus, stockShop, stockOnline, settings, branches, msgCount,
    slipResults, slipLimit, slipTodayCount, revenueToday, revenueMonth,
    doneToday, monthOrders, pendingOnline, walkinToday, preorderToday,
    lowStockMenus, branch, dayLabel, timeStr,
    onSlipResult: (id, result, cnt) => { setSlipResults(p => ({...p,[id]:result})); setSlipTodayCount(cnt) },
    onSaveLimit: async val => {
      setSlipLimit(val)
      await supabase.from('shop_config').upsert({key:'slip_verify_limit',value:String(val)},{onConflict:'key'})
    },
  }

  return (
    <div className="min-h-dvh" style={{background:'#050201'}}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{background:'rgba(12,5,1,0.96)',borderBottom:'1px solid rgba(201,125,42,0.15)',backdropFilter:'blur(10px)'}}>
        <div>
          <div className="font-serif font-black text-base" style={{color:'#fde68a',letterSpacing:'0.5px'}}>BASIC CHINESE BUN</div>
          <div className="text-xs font-bold" style={{color:'rgba(253,246,238,0.35)'}}>{dayLabel} · {timeStr} · Office</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95"
            style={{background:'rgba(201,125,42,0.15)',color:'#fde68a',border:'1px solid rgba(201,125,42,0.2)'}}>
            {loading ? '...' : '↺'}
          </button>
          <button onClick={()=>setUnlocked(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-black"
            style={{background:'rgba(255,255,255,0.05)',color:'rgba(253,246,238,0.35)'}}>🔒</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-3 pt-3 pb-0">
        {[
          ['ວັນນີ້', todayOrders.length+' ໃບ', '#fde68a'],
          ['ຍອດ Done', fmtKip(revenueToday), '#86efac'],
          ['Pending', pendingOnline.length+' ໃບ', pendingOnline.length>0?'#fca5a5':'#475569'],
        ].map(([l,v,c]) => (
          <div key={l} className="rounded-xl p-2.5 text-center"
            style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="text-sm font-black" style={{color:c}}>{v}</div>
            <div className="text-xs font-bold mt-0.5" style={{color:'rgba(253,246,238,0.3)'}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="text-center pt-2 pb-0 text-xs" style={{color:'rgba(253,246,238,0.2)'}}>
        tap a building to view details
      </div>

      {/* Building */}
      <div className="px-1 pt-1">
        <IsoBuilding active={activeRoom} onSelect={setActiveRoom} roomStatus={roomStatus}/>
      </div>

      {/* Detail panel */}
      {activeRoom && (
        <RoomDetail roomId={activeRoom} onClose={()=>setActiveRoom(null)} data={detailData}/>
      )}

      {/* Footer */}
      <div className="text-center pb-6 text-xs" style={{color:'rgba(253,246,238,0.15)'}}>
        BCB Office · auto-refresh 60s
        {lastUpdate && <span> · {lastUpdate.toLocaleTimeString('lo-LA',{hour:'2-digit',minute:'2-digit'})}</span>}
      </div>
    </div>
  )
}
