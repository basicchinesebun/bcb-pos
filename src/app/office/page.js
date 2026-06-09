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
  { id:'walkin',  icon:'🏪', label:'Walk-in', hairC:'#c4b5fd', shirtC:'#7c3aed', monC:'#8b5cf6', skinC:'#f5c8a0', rightC:'rgba(124,58,237,0.45)' },
  { id:'pos',     icon:'💻', label:'POS',     hairC:'#93c5fd', shirtC:'#1d4ed8', monC:'#60a5fa', skinC:'#f5c8a0', rightC:'rgba(29,78,216,0.45)' },
  { id:'chatbot', icon:'🤖', label:'AI Chat', hairC:'#67e8f9', shirtC:'#0891b2', monC:'#22d3ee', skinC:'#e8b88a', rightC:'rgba(8,145,178,0.45)' },
  { id:'content', icon:'📱', label:'Content', hairC:'#f9a8d4', shirtC:'#be185d', monC:'#f472b6', skinC:'#f5c8a0', rightC:'rgba(190,24,93,0.45)' },
  { id:'finance', icon:'💰', label:'Finance', hairC:'#86efac', shirtC:'#15803d', monC:'#4ade80', skinC:'#e8b88a', rightC:'rgba(21,128,61,0.45)' },
  { id:'slip',    icon:'🧾', label:'Slip',    hairC:'#fdba74', shirtC:'#b45309', monC:'#fbbf24', skinC:'#f5c8a0', rightC:'rgba(180,83,9,0.45)' },
]

// desk layout: 3 back (far), 3 front (near)
const DESK_LAYOUT = [
  { id:'walkin',  fx:0.13, fy:0.82, s:0.68 },
  { id:'pos',     fx:0.50, fy:0.82, s:0.68 },
  { id:'chatbot', fx:0.87, fy:0.82, s:0.68 },
  { id:'content', fx:0.14, fy:0.28, s:0.90 },
  { id:'finance', fx:0.50, fy:0.28, s:0.90 },
  { id:'slip',    fx:0.87, fy:0.28, s:0.90 },
]

// ─── PIXEL ROOM ───
function IsoBuilding({ active, onSelect, roomStatus }) {
  // ── Floor perspective ──
  // fy=1 = far (back wall), fy=0 = near (bottom of screen)
  function fp(fx, fy) {
    const y  = 440 + fy * (182 - 440)
    const x1 =   0 + fy * 100
    const x2 = 640 + fy * (540 - 640)
    return [x1 + fx * (x2 - x1), y]
  }

  // City buildings on back wall windows (fixed positions)
  const CITY = [[0,.60,.12],[.10,.40,.14],[.22,.55,.10],[.30,.25,.12],
                [.40,.50,.08],[.46,.30,.13],[.57,.45,.10],[.65,.35,.09],
                [.73,.52,.11],[.82,.20,.10],[.90,.42,.10]]
  const WIN_LIGHTS = [[.05,.45],[.18,.35],[.32,.50],[.48,.28],[.62,.42],[.78,.55],[.92,.35],
                      [.12,.65],[.28,.55],[.44,.70],[.60,.62],[.75,.67],[.88,.72]]

  // Sort desks: far first (fy desc), so near desks render on top
  const sortedDesks = [...DESK_LAYOUT].sort((a,b) => b.fy - a.fy)

  return (
    <svg viewBox="0 0 640 440" className="w-full select-none" style={{ maxHeight:'420px' }}>
      <defs>
        <style>{`
          @keyframes neonPulse {
            0%,100%{opacity:1;filter:drop-shadow(0 0 8px #fde68a)drop-shadow(0 0 16px #f59e0b)}
            50%{opacity:0.75;filter:drop-shadow(0 0 3px #fde68a)}
          }
          @keyframes screenFlicker {
            0%,100%{opacity:0.55} 45%{opacity:0.72} 55%{opacity:0.60}
          }
          @keyframes charBob {
            0%,100%{transform:translateY(0px)} 50%{transform:translateY(-2.5px)}
          }
          @keyframes charIdle {
            0%,100%{transform:translateY(0px)} 50%{transform:translateY(-1px)}
          }
          @keyframes warnShake {
            0%,100%{transform:translateX(0)} 20%{transform:translateX(-2px)} 40%{transform:translateX(2px)} 60%{transform:translateX(-2px)} 80%{transform:translateX(2px)}
          }
          .neon-sign{animation:neonPulse 3s ease-in-out infinite}
          .mon-screen{animation:screenFlicker 3.5s ease-in-out infinite}
          .char-work{animation:charBob 1.8s ease-in-out infinite}
          .char-idle{animation:charIdle 3.5s ease-in-out infinite}
          .char-warn{animation:warnShake 0.6s ease-in-out infinite}
        `}</style>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lampGlow">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sm">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── CEILING ── */}
      <rect x="0" y="0" width="640" height="80" fill="#160a03"/>
      {[60,160,260,360,460,560].map((x,i) => (
        <rect key={i} x={x} y="0" width="2" height="80" fill="rgba(160,90,30,0.08)"/>
      ))}
      {/* Ceiling trim */}
      <rect x="0" y="76" width="640" height="4" fill="#2a1408"/>

      {/* ── SIDE WALLS ── */}
      <polygon points="0,78 100,182 0,182" fill="#3d1e08"/>
      <polygon points="640,78 540,182 640,182" fill="#2d1608"/>
      {/* Wall wood lines */}
      <line x1="0" y1="108" x2="62" y2="148" stroke="rgba(160,90,30,0.12)" strokeWidth="1"/>
      <line x1="0" y1="138" x2="40" y2="160" stroke="rgba(160,90,30,0.10)" strokeWidth="1"/>
      <line x1="640" y1="108" x2="578" y2="148" stroke="rgba(160,90,30,0.10)" strokeWidth="1"/>

      {/* ── BACK WALL ── */}
      <rect x="100" y="78" width="440" height="104" fill="#e8d0a8"/>
      {/* Wall texture lines */}
      {[0.25,0.5,0.75].map((f,i) => (
        <line key={i} x1={100+f*440} y1="78" x2={100+f*440} y2="182"
          stroke="rgba(160,100,40,0.08)" strokeWidth="0.8"/>
      ))}
      {/* Wainscot rail */}
      <rect x="100" y="170" width="440" height="5" fill="#c8a070" opacity="0.7"/>
      <rect x="100" y="174" width="440" height="2" fill="#b08050" opacity="0.5"/>

      {/* ── LEFT WINDOW ── */}
      <rect x="112" y="88" width="108" height="80" rx="3" fill="#6b3d14" stroke="#4a2a0a" strokeWidth="2"/>
      <rect x="117" y="93" width="98" height="70" fill="#1a2f50"/>
      {/* Sky */}
      <rect x="117" y="93" width="98" height="38" fill="#1e3a5f"/>
      <rect x="117" y="131" width="98" height="32" fill="#0f1f3d"/>
      {/* City silhouette */}
      {CITY.map(([bx,bh,bw],i) => (
        <rect key={i} x={117+bx*98} y={93+70*(1-bh-0.02)} width={bw*98} height={70*bh} fill="#08111e"/>
      ))}
      {/* Building lights */}
      {WIN_LIGHTS.slice(0,7).map(([lx,ly],i) => (
        <rect key={i} x={117+lx*98-1} y={93+ly*70} width="2.5" height="3" fill="#fde68a" opacity="0.75"/>
      ))}
      <circle cx="164" cy="103" r="7" fill="#fef9e7" opacity="0.85"/>
      <circle cx="169" cy="99" r="5.5" fill="#1e3a5f"/>
      {/* Window frame dividers */}
      <line x1="164" y1="93" x2="164" y2="163" stroke="#6b3d14" strokeWidth="2"/>
      <line x1="117" y1="131" x2="215" y2="131" stroke="#6b3d14" strokeWidth="2"/>
      <rect x="108" y="163" width="116" height="6" rx="1" fill="#7c4a1e"/>

      {/* ── RIGHT WINDOW ── */}
      <rect x="420" y="88" width="108" height="80" rx="3" fill="#6b3d14" stroke="#4a2a0a" strokeWidth="2"/>
      <rect x="425" y="93" width="98" height="70" fill="#1a2f50"/>
      <rect x="425" y="93" width="98" height="38" fill="#1e3a5f"/>
      <rect x="425" y="131" width="98" height="32" fill="#0f1f3d"/>
      {CITY.map(([bx,bh,bw],i) => (
        <rect key={i} x={425+bx*98} y={93+70*(1-bh-0.02)} width={bw*98} height={70*bh} fill="#08111e"/>
      ))}
      {WIN_LIGHTS.slice(7).map(([lx,ly],i) => (
        <rect key={i} x={425+lx*98-1} y={93+ly*70} width="2.5" height="3" fill="#fde68a" opacity="0.75"/>
      ))}
      <circle cx="472" cy="103" r="7" fill="#fef9e7" opacity="0.85"/>
      <circle cx="477" cy="99" r="5.5" fill="#1e3a5f"/>
      <line x1="472" y1="93" x2="472" y2="163" stroke="#6b3d14" strokeWidth="2"/>
      <line x1="425" y1="131" x2="523" y2="131" stroke="#6b3d14" strokeWidth="2"/>
      <rect x="416" y="163" width="116" height="6" rx="1" fill="#7c4a1e"/>

      {/* ── COMPANY SIGN (center back wall) ── */}
      <g className="neon-sign">
        <rect x="236" y="93" width="168" height="52" rx="4" fill="#120801" stroke="#c97d2a" strokeWidth="1.5"/>
        <rect x="239" y="96" width="162" height="46" rx="3" fill="rgba(253,214,42,0.04)"/>
        {/* Logo circle */}
        <circle cx="262" cy="119" r="14" fill="#3d1f0a" stroke="#c97d2a" strokeWidth="1.2"/>
        <text x="262" y="123" textAnchor="middle" fontSize="11" fill="#fde68a" style={{userSelect:'none'}}>☕</text>
        {/* Text */}
        <text x="330" y="112" textAnchor="middle" fontSize="8.5" fontWeight="900"
          fill="#fde68a" style={{userSelect:'none',letterSpacing:'1.2px',fontFamily:'monospace'}}>
          BASIC CHINESE BUN
        </text>
        <text x="330" y="124" textAnchor="middle" fontSize="7"
          fill="#fdba74" opacity="0.7" style={{userSelect:'none',fontFamily:'monospace'}}>
          ◇ Restaurant Office ◇
        </text>
        <text x="330" y="135" textAnchor="middle" fontSize="6.5"
          fill="#fde68a" opacity="0.5" style={{userSelect:'none',fontFamily:'monospace'}}>
          ● ONLINE ●
        </text>
      </g>

      {/* ── BACK WALL PLANTS ── */}
      <g><rect x="105" y="162" width="11" height="18" rx="2" fill="#5c3317"/>
        <ellipse cx="111" cy="155" rx="13" ry="15" fill="#1a4d1f"/>
        <ellipse cx="104" cy="148" rx="7" ry="9" fill="#1e5922"/>
        <ellipse cx="118" cy="150" rx="6" ry="8" fill="#163d1a"/>
      </g>
      <g><rect x="524" y="162" width="11" height="18" rx="2" fill="#5c3317"/>
        <ellipse cx="529" cy="155" rx="13" ry="15" fill="#1a4d1f"/>
        <ellipse cx="522" cy="148" rx="7" ry="9" fill="#163d1a"/>
        <ellipse cx="536" cy="150" rx="6" ry="8" fill="#1e5922"/>
      </g>

      {/* ── FLOOR ── */}
      <polygon points="100,182 540,182 640,440 0,440" fill="#3d2009"/>
      {/* Plank lines (horizontal, perspective) */}
      {[.12,.24,.36,.48,.60,.72,.84,.95].map((f,i) => {
        const y  = 182 + f*(440-182)
        const xl = 100 - f*100
        const xr = 540 + f*(640-540)
        return <line key={i} x1={xl} y1={y} x2={xr} y2={y} stroke="#4e2c0f" strokeWidth={0.7+f*2}/>
      })}
      {/* Vertical plank dividers (converging) */}
      {[.1,.2,.3,.4,.5,.6,.7,.8,.9].map((fx,i) => {
        const [tx1] = fp(fx, 1.0); const [tx2] = fp(fx, 0.0)
        return <line key={i} x1={tx1} y1={182} x2={Math.max(0,Math.min(640,tx2))} y2={440}
          stroke="#4a2a0e" strokeWidth="0.6" opacity="0.4"/>
      })}
      {/* Floor light strip near back wall */}
      <rect x="100" y="182" width="440" height="5" fill="rgba(255,200,100,0.12)"/>
      {/* Floor rug */}
      <ellipse cx="320" cy="310" rx="120" ry="60"
        fill="none" stroke="#5c3317" strokeWidth="2" opacity="0.3"/>
      <ellipse cx="320" cy="310" rx="100" ry="50"
        fill="#2a1408" opacity="0.15"/>

      {/* ── CEILING LAMPS ── */}
      {[160, 320, 480].map((lx,i) => (
        <g key={i}>
          <line x1={lx} y1="0" x2={lx} y2="74" stroke="#5a3412" strokeWidth="2"/>
          {/* Shade */}
          <polygon points={`${lx-20},74 ${lx+20},74 ${lx+13},90 ${lx-13},90`}
            fill="#7c4a1e" stroke="#4a2a0a" strokeWidth="1"/>
          {/* Bulb glow */}
          <circle cx={lx} cy={88} r={5} fill="#fef3c7" filter="url(#lampGlow)"/>
          {/* Light cone */}
          <polygon points={`${lx-13},90 ${lx+13},90 ${lx+70},320 ${lx-70},320`}
            fill="rgba(253,243,199,0.04)"/>
          {/* Lamp bottom circle */}
          <ellipse cx={lx} cy={90} rx={13} ry={4} fill="#6b3d14" opacity="0.6"/>
        </g>
      ))}

      {/* ── DESKS + CHARACTERS ── */}
      {sortedDesks.map(({ id, fx, fy, s }, deskIdx) => {
        const room = ROOM_DEFS.find(r => r.id === id)
        if (!room) return null
        const { icon, label, hairC, shirtC, monC, skinC } = room
        const [cx, cy] = fp(fx, fy)
        const isActive = active === id
        const status = roomStatus?.[id]
        const isWorking = status === 'ok'
        const isWarn = status === 'warn'
        const dotC = isWorking ? '#4ade80' : isWarn ? '#fb923c' : '#475569'
        const charClass = isWorking ? 'char-work' : isWarn ? 'char-warn' : 'char-idle'
        const delay = `${deskIdx * 0.38}s`

        // Sizes (scaled by s)
        const dw=50*s, dh=6*s, df=14*s
        const mw=32*s, mh=18*s
        const hw=12*s, hh=7*s
        const cw=10*s, ch=9*s
        const bw=12*s, bh=11*s

        const bodyTop = cy - bh
        const headTop = bodyTop - ch
        const hairTop = headTop - hh

        // Activity label per department
        const actMap = { walkin:'ຮ້ານ Open', pos:'ຮັບ Order', chatbot:'AI Reply',
                         content:'Post…', finance:'Count ₭', slip:'Check Slip' }
        const actText = isWarn ? '⚠ Alert!' : isWorking ? (actMap[id]||'Working') : 'Idle…'
        const bubW = Math.max(38, actText.length * 5.5 * s)

        return (
          <g key={id} onClick={() => onSelect(id===active?null:id)} style={{cursor:'pointer'}}>

            {/* ── CHARACTER (animated) ── */}
            <g className={charClass} style={{animationDelay: delay}}>
              {/* Hair */}
              <rect x={cx-hw/2} y={hairTop} width={hw} height={hh} fill={hairC}/>
              {/* Head */}
              <rect x={cx-cw/2} y={headTop} width={cw} height={ch} fill={skinC}/>
              {/* Eyes — blink when idle */}
              <rect x={cx-cw*0.30} y={headTop+ch*0.35} width={cw*0.18} height={ch*0.28} fill="#2d1a08"/>
              <rect x={cx+cw*0.09} y={headTop+ch*0.35} width={cw*0.18} height={ch*0.28} fill="#2d1a08"/>
              {/* Smile */}
              <rect x={cx-cw*0.22} y={headTop+ch*0.72} width={cw*0.44} height={ch*0.12} rx="1" fill="#8b4513" opacity="0.4"/>
              {/* Body */}
              <rect x={cx-bw/2} y={bodyTop} width={bw} height={bh} fill={shirtC}/>
              {/* Collar */}
              <rect x={cx-bw*0.12} y={bodyTop} width={bw*0.24} height={bh*0.35} rx="1" fill="rgba(255,255,255,0.18)"/>
            </g>

            {/* ── ARMS (typing animation when working) ── */}
            <g style={{animationDelay: delay}}>
              {/* Left arm */}
              <g>
                {isWorking && <animateTransform attributeName="transform" type="translate"
                  values={`0,0; 0,${2*s}; 0,0`} dur="0.38s" begin={delay} repeatCount="indefinite"/>}
                <rect x={cx-bw/2-4*s} y={bodyTop} width={4*s} height={8*s} fill={shirtC}/>
                {/* Hand */}
                <rect x={cx-bw/2-4*s} y={bodyTop+7*s} width={4*s} height={2.5*s} rx="1" fill={skinC}/>
              </g>
              {/* Right arm (opposite phase) */}
              <g>
                {isWorking && <animateTransform attributeName="transform" type="translate"
                  values={`0,${2*s}; 0,0; 0,${2*s}`} dur="0.38s" begin={delay} repeatCount="indefinite"/>}
                <rect x={cx+bw/2} y={bodyTop} width={4*s} height={8*s} fill={shirtC}/>
                <rect x={cx+bw/2} y={bodyTop+7*s} width={4*s} height={2.5*s} rx="1" fill={skinC}/>
              </g>
            </g>

            {/* ── SPEECH BUBBLE ── */}
            <g>
              <animateTransform attributeName="transform" type="translate"
                values="0,0;0,-1.5;0,0" dur="2s" begin={delay} repeatCount="indefinite"/>
              {/* Bubble */}
              <rect x={cx-bubW/2} y={hairTop-22} width={bubW} height={15}
                rx="5" fill="#120801"
                stroke={isWarn?'#fb923c':isWorking?shirtC:'#475569'}
                strokeWidth="1" opacity="0.95"/>
              {/* Bubble tail */}
              <polygon points={`${cx-4},${hairTop-7} ${cx+4},${hairTop-7} ${cx},${hairTop-1}`}
                fill="#120801"/>
              {/* Working dots */}
              {isWorking && [0,1,2].map(i => (
                <circle key={i} cx={cx-5+i*5} cy={hairTop-14} r="0" fill={shirtC}>
                  <animate attributeName="r" values="1;2.5;1" dur="1.1s"
                    begin={`${parseFloat(delay)+i*0.28}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.1s"
                    begin={`${parseFloat(delay)+i*0.28}s`} repeatCount="indefinite"/>
                </circle>
              ))}
              {/* Warning/idle text */}
              {!isWorking && (
                <text x={cx} y={hairTop-11} textAnchor="middle"
                  fontSize={6.5*s} fontWeight="bold"
                  fill={isWarn?'#fb923c':'#475569'}
                  style={{userSelect:'none',fontFamily:'monospace'}}>
                  {actText}
                </text>
              )}
            </g>

            {/* ── MONITOR ── */}
            <rect x={cx-2*s} y={cy-mh} width={4*s} height={mh} fill="#2a2a2a"/>
            <rect x={cx-7*s} y={cy-3*s} width={14*s} height={3*s} rx="0.5" fill="#2a2a2a"/>
            <rect x={cx-mw/2} y={cy-mh-2*s} width={mw} height={mh} rx="1" fill="#1c1c1c" stroke="#333" strokeWidth="0.8"/>
            <rect x={cx-mw/2+2*s} y={cy-mh} width={mw-4*s} height={mh-4*s}
              rx="0.5" fill={monC} opacity="0.55" className="mon-screen" filter="url(#sm)"/>
            {/* Scrolling screen lines */}
            {[0,1,2,3].map(li => (
              <rect key={li} x={cx-mw/2+4*s} y={cy-mh+3*s+li*(mh-6*s)/4} width={mw*(0.3+li*0.12)} height={s*1.8}
                fill="rgba(255,255,255,0.25)" rx="0.3">
                {isWorking && <animate attributeName="width" values={`${mw*(0.3+li*0.12)};${mw*0.85};${mw*(0.3+li*0.12)}`}
                  dur={`${1.8+li*0.4}s`} begin={`${parseFloat(delay)+li*0.2}s`} repeatCount="indefinite"/>}
              </rect>
            ))}
            <circle cx={cx+mw/2-3*s} cy={cy-mh-s} r={2.5*s} fill={dotC} filter="url(#glow)"/>

            {/* ── DESK ── */}
            <rect x={cx-dw/2} y={cy-dh} width={dw} height={dh} fill="#7c4a1e" stroke="#5a3412" strokeWidth="0.8"/>
            <rect x={cx-dw*0.28} y={cy-dh+s} width={dw*0.5} height={3.5*s}
              rx="0.3" fill="#252525" stroke="#444" strokeWidth="0.4">
              {/* Keyboard typing flicker */}
              {isWorking && <animate attributeName="fill" values="#252525;#333;#252525"
                dur="0.3s" begin={delay} repeatCount="indefinite"/>}
            </rect>
            <rect x={cx-dw/2} y={cy} width={dw} height={df} fill="#6b3d16" stroke="#4a2a0d" strokeWidth="0.8"/>
            <rect x={cx-dw*0.18} y={cy+df*0.25} width={dw*0.36} height={df*0.5}
              rx="0.5" fill="rgba(0,0,0,0.12)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5"/>
            <circle cx={cx} cy={cy+df*0.5} r={1.6*s} fill="#c97d2a"/>
            <rect x={cx-dw/2+2*s} y={cy+df} width={4*s} height={8*s} fill="#5a3412"/>
            <rect x={cx+dw/2-6*s} y={cy+df} width={4*s} height={8*s} fill="#5a3412"/>

            {/* Active highlight */}
            {isActive && (
              <rect x={cx-dw/2-2} y={hairTop-2} width={dw+4} height={cy+df-hairTop+4}
                fill="none" stroke="#fde68a" strokeWidth="1.5" strokeDasharray="4,2" rx="2"/>
            )}

            {/* Label */}
            <text x={cx} y={cy+df+13*s} textAnchor="middle"
              fontSize={9*s} fontWeight="bold"
              fill={isActive?'#fde68a':'rgba(253,246,238,0.55)'}
              style={{userSelect:'none',fontFamily:'monospace,sans-serif'}}>
              {icon} {label}
            </text>
          </g>
        )
      })}

      {/* ── FRONT CORNER PLANTS ── */}
      <g>
        <rect x="14" y="368" width="18" height="28" rx="3" fill="#5c3317"/>
        <ellipse cx="23" cy="355" rx="22" ry="26" fill="#1a4d1f"/>
        <ellipse cx="13" cy="344" rx="11" ry="13" fill="#163d1a"/>
        <ellipse cx="34" cy="347" rx="10" ry="12" fill="#1e5922"/>
        <ellipse cx="23" cy="336" rx="8" ry="10" fill="#2d7a35"/>
      </g>
      <g>
        <rect x="608" y="368" width="18" height="28" rx="3" fill="#5c3317"/>
        <ellipse cx="617" cy="355" rx="22" ry="26" fill="#1a4d1f"/>
        <ellipse cx="607" cy="344" rx="11" ry="13" fill="#1e5922"/>
        <ellipse cx="628" cy="347" rx="10" ry="12" fill="#163d1a"/>
        <ellipse cx="617" cy="336" rx="8" ry="10" fill="#2d7a35"/>
      </g>

      {/* ── WALL CLOCK ── */}
      <circle cx="320" cy="92" r="10" fill="#1a0c04" stroke="#c97d2a" strokeWidth="1.2"/>
      <circle cx="320" cy="92" r="8" fill="#0d0602"/>
      <line x1="320" y1="92" x2="320" y2="86" stroke="#fde68a" strokeWidth="1.2"/>
      <line x1="320" y1="92" x2="324" y2="94" stroke="#fde68a" strokeWidth="1"/>
    </svg>
  )
}


// ─── SLIP CHECKER ───
function SlipCard({ orders, slipResults, todayCount, limit, onResult, onSaveLimit, onConfirm, onReject }) {
  const [checking,     setChecking]     = useState({})
  const [acting,       setActing]       = useState({})
  const [localResults, setLocalResults] = useState({})
  const [limitInput,   setLimitInput]   = useState(String(limit || 100))
  const [showSettings, setShowSettings] = useState(false)
  const [error,        setError]        = useState(null)
  const [bigImg,       setBigImg]       = useState(null)

  const allResults = { ...slipResults, ...localResults }
  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString()
  const slipOrders = (orders || []).filter(o => o.type==='online' && o.slip_url && o.status==='pending' && !o.done && !o.cancelled && o.created_at >= sevenDaysAgo)
  const oldSlipOrders = (orders || []).filter(o => o.type==='online' && o.slip_url && o.status==='pending' && !o.done && !o.cancelled && o.created_at < sevenDaysAgo)
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

  async function handleConfirm(o) {
    if (acting[o.id]) return
    setActing(p => ({...p,[o.id]:'confirm'}))
    try { await onConfirm?.(o.id) } finally { setActing(p => ({...p,[o.id]:null})) }
  }
  async function handleReject(o) {
    if (acting[o.id]) return
    setActing(p => ({...p,[o.id]:'reject'}))
    try { await onReject?.(o.id) } finally { setActing(p => ({...p,[o.id]:null})) }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Slip image lightbox */}
      {bigImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.92)'}} onClick={()=>setBigImg(null)}>
          <img src={bigImg} className="rounded-xl object-contain" style={{maxWidth:'90vw',maxHeight:'85vh'}}/>
          <button className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center font-black text-lg"
            style={{background:'rgba(255,255,255,0.15)',color:'#fff'}}>✕</button>
        </div>
      )}

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
        : <div className="flex flex-col gap-2">
            {slipOrders.map(o => {
              const r = allResults[o.id]
              const sc = r ? (r.suspicious||!r.amount_matches||!r.date_is_today?'warn':'ok') : null
              const isChecking = checking[o.id]
              const isActing = acting[o.id]
              const cust = o.customer ? (typeof o.customer==='string' ? (()=>{ try{return JSON.parse(o.customer)}catch{return null} })() : o.customer) : null
              return (
                <div key={o.id} className="rounded-xl p-2.5"
                  style={{background:sc==='warn'?'rgba(127,29,29,0.35)':sc==='ok'?'rgba(20,83,45,0.35)':'rgba(255,255,255,0.05)', border:`1px solid ${sc==='warn'?'#991b1b':sc==='ok'?'#166534':'rgba(255,255,255,0.08)'}`}}>
                  <div className="flex items-center gap-2">
                    {/* Tap image to zoom */}
                    <button onClick={()=>setBigImg(o.slip_url)} className="flex-shrink-0">
                      <img src={o.slip_url} className="w-12 h-12 rounded-lg object-cover" alt="slip" style={{border:'1px solid rgba(255,255,255,0.1)'}}/>
                    </button>
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
                  {/* Confirm / Reject after verification */}
                  {r && (
                    <div className="flex gap-1.5 mt-2">
                      <button onClick={()=>handleConfirm(o)} disabled={!!isActing}
                        className="flex-1 py-1.5 rounded-lg text-xs font-black active:scale-95 transition-transform"
                        style={{background:isActing==='confirm'?'rgba(22,163,74,0.5)':'#16a34a',color:'#fff'}}>
                        {isActing==='confirm'?'...':'✓ ຢືນຢັນ'}
                      </button>
                      <button onClick={()=>handleReject(o)} disabled={!!isActing}
                        className="flex-1 py-1.5 rounded-lg text-xs font-black active:scale-95 transition-transform"
                        style={{background:isActing==='reject'?'rgba(220,38,38,0.5)':'#dc2626',color:'#fff'}}>
                        {isActing==='reject'?'...':'✗ ປະຕິເສດ'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      }
      {oldSlipOrders.length > 0 && (
        <button onClick={async () => {
          if (!window.confirm(`ລ້າງ ${oldSlipOrders.length} Order ເກົ່າ (>7 ວັນ)?`)) return
          for (const o of oldSlipOrders) await onReject?.(o.id)
        }} className="w-full py-1.5 rounded-xl text-xs font-bold"
          style={{background:'rgba(255,255,255,0.06)',color:'rgba(253,246,238,0.35)',border:'1px dashed rgba(255,255,255,0.1)'}}>
          🗑 ມີ {oldSlipOrders.length} Order ເກົ່າ — ກົດລ້າງ
        </button>
      )}
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
    onSlipResult, onSaveLimit, onConfirm, onReject, revenueToday, revenueMonth, doneToday, monthOrders,
    pendingOnline, walkinToday, preorderToday, lowStockMenus, branch, simeuangOpen, houayhongOpen, dayLabel, timeStr } = data

  const panelContent = () => {
    if (roomId==='walkin') return <>
      <Row label="ວັນທີ" value={`${dayLabel} ${timeStr}`}/>
      <Row label="ສາຂາສີເມືອງ" value={simeuangOpen?'ເປີດ ✓': branch.simeuang?'ປິດ (ພັກ)':'ປິດ'} sub="ຈ·ພ·ສ 15:00–19:30"/>
      <Row label="ສາຂາຫວຍຫົງ" value={houayhongOpen?'ເປີດ ✓': branch.houayhong?'ປິດ (ພັກ)':'ປິດ'} sub="ຄ·ສກ·ອ 15:00–19:30"/>
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
    if (roomId==='slip') return <SlipCard orders={orders} slipResults={slipResults} todayCount={slipTodayCount} limit={slipLimit} onResult={onSlipResult} onSaveLimit={onSaveLimit} onConfirm={onConfirm} onReject={onReject}/>
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

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 60000)
    if (!supabase) return () => clearInterval(t)
    const ch = supabase.channel('office-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config' }, () => {
        loadConfig()
      })
      .subscribe()
    return () => { clearInterval(t); supabase.removeChannel(ch) }
  }, [refresh, loadOrders, loadConfig])

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
  const simeuangOn    = branches.find(b => b.id === 'simeuang')?.visible !== false
  const houayhongOn   = branches.find(b => b.id === 'houayhong')?.visible !== false
  const simeuangOpen  = branch.simeuang && simeuangOn
  const houayhongOpen = branch.houayhong && houayhongOn

  const slipOrders = orders.filter(o => o.type==='online' && o.slip_url && !o.done && !o.cancelled)
  const slipWarned = slipOrders.filter(o => { const r=slipResults[o.id]; return r&&(r.suspicious||!r.amount_matches||!r.date_is_today) })
  const roomStatus = {
    walkin:  simeuangOpen || houayhongOpen ? 'ok' : 'idle',
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
    lowStockMenus, branch, simeuangOpen, houayhongOpen, dayLabel, timeStr,
    onSlipResult: (id, result, cnt) => { setSlipResults(p => ({...p,[id]:result})); setSlipTodayCount(cnt) },
    onSaveLimit: async val => {
      setSlipLimit(val)
      await supabase.from('shop_config').upsert({key:'slip_verify_limit',value:String(val)},{onConflict:'key'})
    },
    onConfirm: async (orderId) => {
      await supabase.from('orders').update({ status:'confirmed' }).eq('id', orderId)
      setOrders(prev => prev.map(o => o.id===orderId ? {...o, status:'confirmed'} : o))
    },
    onReject: async (orderId) => {
      await supabase.from('orders').update({ status:'rejected', cancelled:true }).eq('id', orderId)
      setOrders(prev => prev.map(o => o.id===orderId ? {...o, status:'rejected', cancelled:true} : o))
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
