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
    <div className="h-dvh flex flex-col items-center justify-center" style={{ background: '#3d1f0a' }}>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏢</div>
        <div className="font-serif text-2xl font-black" style={{ color: '#fdf6ee' }}>BCB Office</div>
        <div className="text-sm font-bold mt-1" style={{ color: 'rgba(253,246,238,0.5)' }}>ໃສ່ລະຫັດ Staff</div>
      </div>
      <div className="flex gap-3 mb-5">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="w-3.5 h-3.5 rounded-full transition-all"
            style={{ background: pin.length > i ? '#fdf6ee' : 'rgba(253,246,238,0.2)' }} />
        ))}
      </div>
      {error && <div className="text-red-300 text-sm font-bold mb-4">{error}</div>}
      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
          <button key={i} onClick={() => k && press(k)}
            className="w-16 h-16 rounded-2xl font-black text-xl transition-all active:scale-90"
            style={{ background: k ? 'rgba(253,246,238,0.1)' : 'transparent', color: '#fdf6ee', border: k ? '1.5px solid rgba(253,246,238,0.15)' : 'none' }}>
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── ROW (for detail panels) ───
function Row({ label, value, sub, big }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(253,246,238,0.15)' }}>
      <span className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.5)' }}>{label}</span>
      <div className="text-right">
        <div className={`font-black ${big ? 'text-xl' : 'text-sm'}`} style={{ color: '#fdf6ee' }}>{value}</div>
        {sub && <div className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.4)' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── ROOM DEFINITIONS ───
const ROOM_DEFS = [
  { col:0, row:0, id:'walkin',  icon:'🏪', label:'ໜ້າຮ້ານ',
    topC:'#c4b5fd', leftC:'#3b0764', rightC:'#7c3aed' },
  { col:1, row:0, id:'pos',     icon:'💻', label:'POS',
    topC:'#93c5fd', leftC:'#1e3a8a', rightC:'#2563eb' },
  { col:2, row:0, id:'chatbot', icon:'🤖', label:'AI Chat',
    topC:'#67e8f9', leftC:'#164e63', rightC:'#0891b2' },
  { col:0, row:1, id:'content', icon:'📱', label:'Content',
    topC:'#f9a8d4', leftC:'#500724', rightC:'#db2777' },
  { col:1, row:1, id:'finance', icon:'💰', label:'ການເງິນ',
    topC:'#86efac', leftC:'#14532d', rightC:'#16a34a' },
  { col:2, row:1, id:'slip',    icon:'🧾', label:'Slip',
    topC:'#fdba74', leftC:'#431407', rightC:'#c2410c' },
]

// ─── ISOMETRIC BUILDING SVG ───
function IsoBuilding({ active, onSelect, roomStatus }) {
  const cx = 68, cy = 34, WH = 58, OX = 258, OY = 108

  function iso(c, r) { return [OX + (c - r) * cx, OY + (c + r) * cy] }
  function pts(arr) { return arr.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ') }

  const sorted = [...ROOM_DEFS].sort((a,b) => (a.col+a.row) - (b.col+b.row) || a.col - b.col)

  // Ground base polygon (extends one unit beyond rooms)
  const gPts = pts([iso(0,-1), iso(3,-1), iso(4,0), iso(4,3), iso(3,4), iso(0,4), iso(-1,3), iso(-1,0)])

  // Road strip at front
  const road1 = iso(0, 2.5), road2 = iso(3, 2.5), road3 = iso(3, 3.5), road4 = iso(0, 3.5)

  return (
    <svg viewBox="0 0 560 390" className="w-full select-none" style={{ maxHeight: '360px' }}>
      <defs>
        <radialGradient id="bgG" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#261108" />
          <stop offset="100%" stopColor="#060201" />
        </radialGradient>
        <radialGradient id="moonG" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fef9e7" />
          <stop offset="100%" stopColor="#fde68a" />
        </radialGradient>
        <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="groundG" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#3d1f0a" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1a0904" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="560" height="390" fill="url(#bgG)" rx="16" />

      {/* Stars */}
      {[[35,18],[88,32],[160,12],[235,28],[318,14],[400,36],[470,22],[520,48],[55,72],[505,75],[148,58],[385,62]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i%4===0?2:1.2} fill="white" opacity={0.35+i*0.04} />
      ))}

      {/* Moon */}
      <circle cx={492} cy={42} r={20} fill="url(#moonG)" opacity="0.85" filter="url(#softglow)" />
      <circle cx={503} cy={36} r={15} fill="#100804" />

      {/* Ground platform */}
      <polygon points={gPts} fill="url(#groundG)" />
      <polygon points={gPts} fill="none" stroke="rgba(253,214,150,0.12)" strokeWidth="1" />

      {/* Road/path at entrance */}
      <polygon points={pts([road1,road2,road3,road4])} fill="#1a0c06" opacity="0.7" />
      <line x1={iso(1.5,2.5)[0]} y1={iso(1.5,2.5)[1]} x2={iso(1.5,3.5)[0]} y2={iso(1.5,3.5)[1]}
        stroke="#fde68a" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.4" />

      {/* Rooms (painter order: back to front) */}
      {sorted.map(room => {
        const { col, row, id, topC, leftC, rightC } = room
        const [nx, ny] = iso(col, row)
        const [ex, ey] = iso(col+1, row)
        const [sx, sy] = iso(col+1, row+1)
        const [wx, wy] = iso(col, row+1)
        const isActive = active === id
        const status = roomStatus?.[id]  // 'ok'|'warn'|'idle'|undefined
        const dotColor = status === 'ok' ? '#4ade80' : status === 'warn' ? '#fb923c' : status === 'idle' ? '#94a3b8' : '#fbbf24'

        // Window on right wall (SE face): parallelogram inset
        const rw = 0.55  // along-wall position (0=E side, 1=S side)
        const rw1 = 0.25, rw2 = 0.75
        const rh1 = WH * 0.18, rh2 = WH * 0.62
        const rwPts = pts([
          [ex + rw1*(sx-ex), ey + rw1*(sy-ey) + rh1],
          [ex + rw2*(sx-ex), ey + rw2*(sy-ey) + rh1],
          [ex + rw2*(sx-ex), ey + rw2*(sy-ey) + rh2],
          [ex + rw1*(sx-ex), ey + rw1*(sy-ey) + rh2],
        ])
        // Window on left wall (SW face)
        const lw1 = 0.2, lw2 = 0.8
        const lwPts = pts([
          [wx + lw1*(sx-wx), wy + lw1*(sy-wy) + rh1],
          [wx + lw2*(sx-wx), wy + lw2*(sy-wy) + rh1],
          [wx + lw2*(sx-wx), wy + lw2*(sy-wy) + rh2],
          [wx + lw1*(sx-wx), wy + lw1*(sy-wy) + rh2],
        ])

        // Center of top face for label/light
        const tcx = (nx+sx)/2, tcy = (ny+sy)/2

        return (
          <g key={id} onClick={() => onSelect(id === active ? null : id)} style={{ cursor: 'pointer' }}>
            {/* Left wall */}
            <polygon points={pts([[wx,wy],[sx,sy],[sx,sy+WH],[wx,wy+WH]])}
              fill={isActive ? shiftLighten(leftC) : leftC} />
            {/* Left wall window (warm glow) */}
            <polygon points={lwPts} fill="#fde68a" opacity={isActive ? 0.7 : 0.35} />
            <polygon points={lwPts} fill="none" stroke="#fde68a" strokeWidth="0.5" opacity="0.5" />

            {/* Right wall */}
            <polygon points={pts([[ex,ey],[sx,sy],[sx,sy+WH],[ex,ey+WH]])}
              fill={isActive ? shiftLighten(rightC) : rightC} />
            {/* Right wall window */}
            <polygon points={rwPts} fill="#fde68a" opacity={isActive ? 0.7 : 0.35} />
            <polygon points={rwPts} fill="none" stroke="#fde68a" strokeWidth="0.5" opacity="0.5" />

            {/* Top face */}
            <polygon points={pts([[nx,ny],[ex,ey],[sx,sy],[wx,wy]])}
              fill={isActive ? '#fff8f0' : topC}
              opacity={isActive ? 1 : 0.92} />

            {/* Active border on top */}
            {isActive && (
              <polygon points={pts([[nx,ny],[ex,ey],[sx,sy],[wx,wy]])}
                fill="none" stroke="#fdf6ee" strokeWidth="2.5" />
            )}

            {/* Roof accent line */}
            <line x1={nx} y1={ny} x2={ex} y2={ey} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <line x1={nx} y1={ny} x2={wx} y2={wy} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

            {/* Status light on roof */}
            <circle cx={tcx} cy={tcy-6} r={4.5} fill={dotColor} filter="url(#glow)" />
            <circle cx={tcx} cy={tcy-6} r={2} fill="white" opacity="0.8" />

            {/* Room icon */}
            <text x={tcx} y={tcy+10} textAnchor="middle" fontSize="12" style={{ userSelect:'none' }}>
              {room.icon}
            </text>

            {/* Hover/active pulse ring */}
            {isActive && (
              <circle cx={tcx} cy={tcy-6} r={8} fill="none" stroke={dotColor} strokeWidth="1.5" opacity="0.6" />
            )}
          </g>
        )
      })}

      {/* Entrance arch at front-center of building */}
      {(() => {
        const [dx, dy] = iso(1.5, 2)
        const archW = 22, archH = 36
        return (
          <g filter="url(#glow)">
            {/* Arch frame */}
            <rect x={dx-archW/2} y={dy-archH+4} width={archW} height={archH}
              rx={archW/2} fill="#2a1205" stroke="#c97d2a" strokeWidth="1.5" />
            {/* Door inner */}
            <rect x={dx-archW/2+4} y={dy-archH+12} width={archW-8} height={archH-8}
              rx={(archW-8)/2} fill="#3d1f0a" opacity="0.9" />
            {/* Door knob */}
            <circle cx={dx+4} cy={dy-6} r={2} fill="#c97d2a" />
          </g>
        )
      })()}

      {/* "Basic Chinese Bun" neon sign */}
      {(() => {
        const [cx2, cy2] = iso(1.5, 2)
        return (
          <g>
            <text x={cx2} y={cy2+22} textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif" fontSize="11"
              fontWeight="bold" fill="#fde68a" filter="url(#glow)" opacity="0.95"
              style={{ letterSpacing: '1px' }}>
              ✦ BASIC CHINESE BUN ✦
            </text>
            <text x={cx2} y={cy2+36} textAnchor="middle"
              fontFamily="'Noto Sans Lao', sans-serif" fontSize="9"
              fill="#fdba74" opacity="0.7">
              ບາຊິກ ຈີນ ບັນ
            </text>
          </g>
        )
      })()}

      {/* Room labels below building */}
      {ROOM_DEFS.map(room => {
        const [sx, sy] = iso(room.col+1, room.row+1)
        return (
          <text key={room.id} x={sx} y={sy + WH + 12}
            textAnchor="middle" fontSize="8.5" fontWeight="bold"
            fill={active === room.id ? '#fdf6ee' : 'rgba(253,246,238,0.45)'}
            style={{ userSelect:'none' }}>
            {room.label}
          </text>
        )
      })}
    </svg>
  )
}

// simple color lightener for active state (crude but avoids deps)
function shiftLighten(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + 60)
  const g = Math.min(255, ((n >>  8) & 0xff) + 50)
  const b = Math.min(255, ((n      ) & 0xff) + 40)
  return `rgb(${r},${g},${b})`
}

// ─── SLIP CHECKER CARD ───
function SlipCard({ orders, slipResults, todayCount, limit, onResult, onSaveLimit }) {
  const [checking,     setChecking]     = useState({})
  const [localResults, setLocalResults] = useState({})
  const [limitInput,   setLimitInput]   = useState(String(limit || 100))
  const [showSettings, setShowSettings] = useState(false)
  const [error,        setError]        = useState(null)

  const allResults = { ...slipResults, ...localResults }
  const slipOrders = (orders || []).filter(o => o.type === 'online' && o.slip_url && !o.done && !o.cancelled)
  const warned = slipOrders.filter(o => { const r = allResults[o.id]; return r && (r.suspicious || !r.amount_matches || !r.date_is_today) })

  async function checkOrder(o) {
    if (checking[o.id]) return
    setChecking(p => ({ ...p, [o.id]: true })); setError(null)
    try {
      const res = await fetch('/api/verify-slip', { method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ slipUrl: o.slip_url, expectedAmount: o.total, orderId: o.id }) })
      const data = await res.json()
      if (data.limitReached) { setError(`ຄົບ Limit (${data.count}/${data.limit} ໃບ)`) }
      else if (data.ok) { setLocalResults(p => ({ ...p, [o.id]: data.result })); onResult?.(o.id, data.result, data.count) }
      else { setError(data.error || 'ຜິດພາດ') }
    } catch (err) { setError(err.message) }
    finally { setChecking(p => ({ ...p, [o.id]: false })) }
  }

  async function checkAll() { for (const o of slipOrders) { if (!allResults[o.id]) await checkOrder(o) } }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.6)' }}>
          ວັນນີ້: <span style={{ color: '#fdf6ee' }}>{todayCount}</span>/{limit} ໃບ
        </div>
        {warned.length > 0 && (
          <div className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: '#7f1d1d', color: '#fca5a5' }}>
            ⚠ {warned.length} ໃບໜ້າສົງໄສ
          </div>
        )}
      </div>

      {slipOrders.filter(o => !allResults[o.id]).length > 0 && todayCount < limit && (
        <button onClick={checkAll}
          className="w-full py-2 rounded-xl font-black text-sm transition-all active:scale-95"
          style={{ background: '#c2410c', color: '#fdf6ee' }}>
          🔍 ກວດທັງໝົດ ({slipOrders.filter(o => !allResults[o.id]).length} ໃບ)
        </button>
      )}
      {error && <div className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: '#7f1d1d', color: '#fca5a5' }}>❌ {error}</div>}

      {slipOrders.length === 0 ? (
        <div className="text-xs font-bold text-center py-3" style={{ color: 'rgba(253,246,238,0.4)' }}>ບໍ່ມີ Preorder ທີ່ລໍຖ້າກວດ</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {slipOrders.map(o => {
            const r = allResults[o.id]
            const sc = r ? (r.suspicious || !r.amount_matches || !r.date_is_today ? 'warn' : 'ok') : null
            const isChecking = checking[o.id]
            const cust = o.customer ? (typeof o.customer === 'string' ? (() => { try { return JSON.parse(o.customer) } catch { return null } })() : o.customer) : null
            return (
              <div key={o.id} className="rounded-xl p-2.5 flex items-center gap-2"
                style={{ background: sc==='warn'?'rgba(127,29,29,0.4)':sc==='ok'?'rgba(20,83,45,0.4)':'rgba(255,255,255,0.05)', border:`1px solid ${sc==='warn'?'#991b1b':sc==='ok'?'#166534':'rgba(255,255,255,0.1)'}` }}>
                <a href={o.slip_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  <img src={o.slip_url} className="w-10 h-10 rounded-lg object-cover" alt="slip" style={{ border:'1px solid rgba(255,255,255,0.15)' }} />
                </a>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black" style={{ color:'#fdf6ee' }}>#{String(o.qnum||0).padStart(4,'0')} · {fmt(o.total)} ກີບ</div>
                  {cust?.name && <div className="text-xs font-bold truncate" style={{ color:'rgba(253,246,238,0.6)' }}>{cust.name}</div>}
                  {r && <div className="text-xs font-bold mt-0.5" style={{ color:sc==='warn'?'#fca5a5':'#86efac' }}>
                    {sc==='ok'?'✅ ຜ່ານ': [!r.amount_matches&&`❌ ຈຳນວນ ${fmt(r.amount_found)}`,!r.date_is_today&&'⚠ ວັນທີ',r.suspicious&&'🚨 ສົງໄສ'].filter(Boolean).join(' · ')}
                  </div>}
                </div>
                {!r && (
                  <button onClick={() => checkOrder(o)} disabled={isChecking}
                    className="flex-shrink-0 text-xs font-black px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                    style={{ background:isChecking?'rgba(255,255,255,0.1)':'#c2410c', color:'#fdf6ee' }}>
                    {isChecking ? '...' : 'ກວດ'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <button onClick={() => setShowSettings(v => !v)} className="text-xs font-bold text-center pt-1" style={{ color:'rgba(253,246,238,0.4)' }}>
        ⚙ Limit {showSettings ? '▲' : '▼'}
      </button>
      {showSettings && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color:'rgba(253,246,238,0.5)' }}>Limit/ວັນ:</span>
          <input type="number" min="1" max="9999" value={limitInput} onChange={e => setLimitInput(e.target.value)}
            className="w-20 px-2 py-1 rounded-lg text-xs font-black text-center"
            style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fdf6ee' }} />
          <button onClick={() => { const v=parseInt(limitInput); if(v>0) onSaveLimit?.(v) }}
            className="flex-1 py-1.5 rounded-lg text-xs font-black"
            style={{ background:'#c2410c', color:'#fdf6ee' }}>ບັນທຶກ</button>
        </div>
      )}
    </div>
  )
}

// ─── ROOM DETAIL PANEL ───
function RoomDetail({ roomId, onClose, data }) {
  const room = ROOM_DEFS.find(r => r.id === roomId)
  if (!room) return null
  const { orders, menus, stockShop, stockOnline, settings, branches, msgCount,
    slipResults, slipLimit, slipTodayCount, onSlipResult, onSaveLimit,
    revenueToday, revenueMonth, doneToday, monthOrders, pendingOnline,
    walkinToday, preorderToday, lowStockMenus, branch, dayLabel, timeStr } = data

  const content = () => {
    if (roomId === 'walkin') return (
      <>
        <Row label="ວັນທີ" value={`${dayLabel} ${timeStr}`} />
        <Row label="ສາຂາສີເມືອງ" value={branch.simeuang ? 'ເປີດ ✓' : 'ປິດ'} sub="ຈ·ພ·ສ 15:00–19:30" />
        <Row label="ສາຂາຫວຍຫົງ" value={branch.houayhong ? 'ເປີດ ✓' : 'ປິດ'} sub="ຄ·ສກ·ອ 15:00–19:30" />
        {branches.map(b => b.phone1 && <Row key={b.id} label={b.name} value={'📞 '+b.phone1} />)}
      </>
    )
    if (roomId === 'pos') return (
      <>
        <Row label="Walk-in ວັນນີ້" value={walkinToday + ' ໃບ'} />
        <Row label="Preorder ວັນນີ້" value={preorderToday + ' ໃບ'} />
        <Row label="Pending" value={pendingOnline.length + ' ໃບ'} />
        <Row label="ຍອດ Done ວັນນີ້" value={fmtKip(revenueToday)} big />
        {lowStockMenus.length > 0 && (
          <div className="mt-2 px-2 py-1.5 rounded-lg text-xs font-bold" style={{ background:'rgba(251,191,36,0.15)', color:'#fcd34d', border:'1px solid rgba(251,191,36,0.2)' }}>
            ⚠ ສຕ໋ອກໃກ້ໝົດ: {lowStockMenus.map(m => m.lo||m).join(', ')}
          </div>
        )}
      </>
    )
    if (roomId === 'chatbot') return (
      <>
        <Row label="ສະຖານະ AI" value={settings.aiOn !== false ? 'Online ✓' : 'Offline'} />
        <Row label="ຂໍ້ຄວາມວັນນີ້" value={msgCount + ' ຂໍ້ຄວາມ'} />
        <Row label="ຮັບ Online" value={settings.onlineOn !== false ? 'ເປີດ ✓' : 'ປິດ'} />
        <Row label="ຮັບ Walk-in" value={settings.walkinOn !== false ? 'ເປີດ ✓' : 'ປິດ'} />
        {settings.aiOn === false && (
          <div className="mt-2 px-2 py-1.5 rounded-lg text-xs font-bold" style={{ background:'rgba(220,38,38,0.15)', color:'#fca5a5', border:'1px solid rgba(220,38,38,0.2)' }}>
            AI ຖືກປິດ — ຕ້ອງຕອບເອງ
          </div>
        )}
      </>
    )
    if (roomId === 'content') return (
      <>
        {branches.length > 0 ? branches.map(b => (
          <div key={b.id} className="mb-2">
            <div className="text-xs font-black mb-1" style={{ color:'rgba(253,246,238,0.5)' }}>{b.name}</div>
            <div className="flex gap-2 flex-wrap">
              {b.facebookUrl && <a href={b.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background:'rgba(37,99,235,0.25)', color:'#93c5fd' }}>Facebook →</a>}
              {b.tiktokUrl   && <a href={b.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background:'rgba(126,34,206,0.25)', color:'#d8b4fe' }}>TikTok →</a>}
            </div>
          </div>
        )) : <div className="text-xs font-bold py-2" style={{ color:'rgba(253,246,238,0.4)' }}>ຕັ້ງຄ່າ Branch ໃນ Staff → ⚙</div>}
        <div className="mt-1 px-2 py-2 rounded-lg text-xs font-bold text-center" style={{ background:'rgba(255,255,255,0.05)', color:'rgba(253,246,238,0.3)', border:'1px dashed rgba(255,255,255,0.1)' }}>
          📊 Engagement — ຈະເພີ່ມໃນພາຍຫຼັງ
        </div>
      </>
    )
    if (roomId === 'finance') return (
      <>
        <Row label="ຍອດ Done ວັນນີ້" value={fmtKip(revenueToday)} big />
        <Row label="ຍອດ Done ເດືອນ" value={fmtKip(revenueMonth)} />
        <Row label="Order Done ວັນ" value={doneToday.length + ' ໃບ'} />
        <Row label="Order Done ເດືອນ" value={monthOrders.length + ' ໃບ'} />
        {revenueToday > 0 && doneToday.length > 0 && (
          <Row label="ສະເລ່ຍ/ໃບ" value={fmtKip(Math.round(revenueToday/doneToday.length))} />
        )}
        <div className="mt-2 px-2 py-2 rounded-lg text-xs font-bold text-center" style={{ background:'rgba(22,163,74,0.1)', color:'rgba(134,239,172,0.5)', border:'1px dashed rgba(22,163,74,0.2)' }}>
          💳 ລາຍຈ່າຍ/ໃບບິນ — ຈະເພີ່ມໃນພາຍຫຼັງ
        </div>
      </>
    )
    if (roomId === 'slip') return (
      <SlipCard
        orders={orders}
        slipResults={slipResults}
        todayCount={slipTodayCount}
        limit={slipLimit}
        onResult={onSlipResult}
        onSaveLimit={onSaveLimit}
      />
    )
  }

  return (
    <div className="rounded-2xl p-5 mx-3 mb-4" style={{
      background:'linear-gradient(135deg, #1a0c06 0%, #0d0602 100%)',
      border:`1.5px solid ${room.rightC}`,
      boxShadow:`0 0 30px ${room.rightC}30`,
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{room.icon}</span>
          <span className="font-black text-base" style={{ color:'#fdf6ee' }}>{room.label}</span>
        </div>
        <button onClick={onClose}
          className="text-xs font-black px-3 py-1.5 rounded-xl transition-all active:scale-90"
          style={{ background:'rgba(255,255,255,0.08)', color:'rgba(253,246,238,0.6)' }}>
          ✕ ປິດ
        </button>
      </div>
      <div className="flex flex-col">{content()}</div>
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
    if (cfg.menus)       setMenus(JSON.parse(cfg.menus))
    if (cfg.stock_shop)  setStockShop(JSON.parse(cfg.stock_shop))
    if (cfg.stock_online)setStockOnline(JSON.parse(cfg.stock_online))
    if (cfg.settings)    setSettings(JSON.parse(cfg.settings))
    if (cfg.shop_info)   setShopInfo(JSON.parse(cfg.shop_info))
    if (cfg.branches)    setBranches(JSON.parse(cfg.branches))
    if (cfg.staff_pin)   setStaffPin(cfg.staff_pin)
    if (cfg.slip_verify_results) { try { setSlipResults(JSON.parse(cfg.slip_verify_results)) } catch {} }
    if (cfg.slip_verify_limit)   setSlipLimit(parseInt(cfg.slip_verify_limit) || 100)
    if (cfg.slip_verify_today) {
      try {
        const t = JSON.parse(cfg.slip_verify_today)
        const todayISO = new Date().toISOString().split('T')[0]
        setSlipTodayCount(t.date === todayISO ? (t.count || 0) : 0)
      } catch {}
    }
  }, [])

  const loadOrders = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('orders')
      .select('id,qnum,type,status,total,done,cancelled,created_at,done_at,slip_url,customer')
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
  }, [])

  const loadMessages = useCallback(async () => {
    if (!supabase) return
    const today = todayRange()
    const { count } = await supabase.from('messages').select('id', { count:'exact', head:true }).gte('created_at', today)
    setMsgCount(count || 0)
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([loadConfig(), loadOrders(), loadMessages()])
    setLastUpdate(new Date()); setLoading(false)
  }, [loadConfig, loadOrders, loadMessages])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 60000)
    return () => clearInterval(timer)
  }, [refresh])

  function tryPin(pin) {
    if (!staffPin || pin === staffPin) { setUnlocked(true); setPinError('') }
    else { setPinError('ລະຫັດຜິດ') }
  }

  if (!unlocked) return <PinPad onSubmit={tryPin} error={pinError} />

  // ─── Computed data ───
  const today      = todayRange()
  const monthStart = monthRange()
  const now        = new Date()
  const dayLabel   = DAY_LABELS[now.getDay()]
  const timeStr    = now.toLocaleTimeString('lo-LA', { hour:'2-digit', minute:'2-digit' })

  const todayOrders   = orders.filter(o => o.created_at >= today)
  const doneToday     = todayOrders.filter(o => o.done)
  const revenueToday  = doneToday.reduce((s, o) => s + (o.total || 0), 0)
  const pendingOnline = orders.filter(o => o.type === 'online' && o.status === 'pending' && !o.done && !o.cancelled)
  const walkinToday   = todayOrders.filter(o => o.type === 'walkin').length
  const preorderToday = todayOrders.filter(o => o.type === 'online').length
  const monthOrders   = orders.filter(o => o.created_at >= monthStart && o.done)
  const revenueMonth  = monthOrders.reduce((s, o) => s + (o.total || 0), 0)
  const LOW = 5
  const lowStockMenus = menus.filter((_, i) => (stockShop[i] || 0) <= LOW || (stockOnline[i] || 0) <= LOW)
  const branch        = branchStatus()

  // Room status for dots
  const slipOrders = orders.filter(o => o.type === 'online' && o.slip_url && !o.done && !o.cancelled)
  const slipWarned = slipOrders.filter(o => { const r = slipResults[o.id]; return r && (r.suspicious || !r.amount_matches || !r.date_is_today) })
  const roomStatus = {
    walkin:  branch.anyOpen ? 'ok' : 'idle',
    pos:     todayOrders.length > 0 ? 'ok' : 'idle',
    chatbot: settings.aiOn !== false ? 'ok' : 'warn',
    content: null,
    finance: revenueToday > 0 ? 'ok' : 'idle',
    slip:    slipWarned.length > 0 ? 'warn' : slipOrders.length > 0 ? 'ok' : 'idle',
  }

  const detailData = {
    orders, menus, stockShop, stockOnline, settings, branches, msgCount,
    slipResults, slipLimit, slipTodayCount, revenueToday, revenueMonth,
    doneToday, monthOrders, pendingOnline, walkinToday, preorderToday,
    lowStockMenus, branch, dayLabel, timeStr,
    onSlipResult: (orderId, result, newCount) => {
      setSlipResults(prev => ({ ...prev, [orderId]: result }))
      setSlipTodayCount(newCount)
    },
    onSaveLimit: async (val) => {
      setSlipLimit(val)
      await supabase.from('shop_config').upsert({ key:'slip_verify_limit', value:String(val) }, { onConflict:'key' })
    },
  }

  return (
    <div className="min-h-dvh" style={{ background:'#060201' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ background:'rgba(26,9,2,0.95)', borderBottom:'1px solid rgba(201,125,42,0.2)', backdropFilter:'blur(8px)' }}>
        <div>
          <div className="font-serif font-black text-lg" style={{ color:'#fdf6ee' }}>🏢 BCB Office</div>
          <div className="text-xs font-bold" style={{ color:'rgba(253,246,238,0.4)' }}>{dayLabel} · {timeStr}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95"
            style={{ background:'rgba(201,125,42,0.2)', color:'#fde68a', border:'1px solid rgba(201,125,42,0.3)' }}>
            {loading ? '...' : '↺'}
          </button>
          <button onClick={() => setUnlocked(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-black"
            style={{ background:'rgba(255,255,255,0.06)', color:'rgba(253,246,238,0.4)' }}>
            🔒
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 px-3 pt-3 pb-1">
        {[
          ['ວັນນີ້', todayOrders.length + ' ໃບ', '#fde68a'],
          ['ຍອດວັນ', fmtKip(revenueToday), '#86efac'],
          ['Pending', pendingOnline.length + ' ໃບ', pendingOnline.length > 0 ? '#fca5a5' : '#94a3b8'],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-xl p-2.5 text-center" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-sm font-black" style={{ color:c }}>{v}</div>
            <div className="text-xs font-bold mt-0.5" style={{ color:'rgba(253,246,238,0.35)' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tap hint */}
      <div className="text-center py-2 text-xs font-bold" style={{ color:'rgba(253,246,238,0.25)' }}>
        ແຕະຫ້ອງເພື່ອເບິ່ງລາຍລະອຽດ
      </div>

      {/* Isometric Building */}
      <div className="px-2">
        <IsoBuilding active={activeRoom} onSelect={setActiveRoom} roomStatus={roomStatus} />
      </div>

      {/* Detail Panel */}
      {activeRoom && (
        <RoomDetail
          roomId={activeRoom}
          onClose={() => setActiveRoom(null)}
          data={detailData}
        />
      )}

      {/* Footer */}
      <div className="text-center py-5 text-xs font-bold" style={{ color:'rgba(253,246,238,0.2)' }}>
        Basic Chinese Bun · Office
        {lastUpdate && <span> · {lastUpdate.toLocaleTimeString('lo-LA', { hour:'2-digit', minute:'2-digit' })}</span>}
      </div>
    </div>
  )
}
