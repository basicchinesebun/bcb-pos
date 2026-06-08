'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// ─── helpers ───
function fmt(n) { return (n || 0).toLocaleString() }
function fmtKip(n) { return fmt(n) + ' ກີບ' }

function todayRange() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
function monthRange() {
  const d = new Date()
  d.setDate(1); d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// Check if a branch is open right now (Mon=1…Sun=0)
function branchStatus() {
  const now = new Date()
  const day = now.getDay() // 0=Sun,1=Mon,...,6=Sat
  const hour = now.getHours() + now.getMinutes() / 60
  const open = hour >= 15 && hour < 19.5
  // Si Meuang: Mon/Wed/Fri (1,3,5), Houay Hong: Tue/Thu/Sat (2,4,6)
  const simeuang  = open && [1, 3, 5].includes(day)
  const houayhong = open && [2, 4, 6].includes(day)
  const anyOpen   = simeuang || houayhong
  return { simeuang, houayhong, anyOpen }
}

const DAY_LABELS = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ']

// ─── PIN PAD ───
function PinPad({ onSubmit, error }) {
  const [pin, setPin] = useState('')
  function press(v) {
    if (v === '⌫') { setPin(p => p.slice(0, -1)); return }
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
          <div key={i} className="w-3.5 h-3.5 rounded-full transition-all" style={{ background: pin.length > i ? '#fdf6ee' : 'rgba(253,246,238,0.2)' }} />
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

// ─── STATUS DOT ───
function Dot({ on, label }) {
  const color = on === true ? '#22c55e' : on === false ? '#ef4444' : '#f59e0b'
  const text  = on === true ? (label || 'ເປີດ') : on === false ? (label || 'ປິດ') : (label || '...')
  return (
    <span className="flex items-center gap-1.5 text-xs font-black" style={{ color }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
      {text}
    </span>
  )
}

// ─── STAT ROW ───
function Row({ label, value, sub, big }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #f0e6d8' }}>
      <span className="text-xs font-bold" style={{ color: '#8a6a55' }}>{label}</span>
      <div className="text-right">
        <div className={`font-black ${big ? 'text-xl' : 'text-sm'}`} style={{ color: '#3d1f0a' }}>{value}</div>
        {sub && <div className="text-xs font-bold" style={{ color: '#a0522d' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── DEPT CARD ───
function Card({ icon, title, accent = '#3d1f0a', status, children }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: '#fffbf6',
        border: `1.5px solid #e8d5c0`,
        borderLeft: `4px solid ${accent}`,
        boxShadow: '3px 5px 18px rgba(61,31,10,0.07)',
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-black text-sm" style={{ color: '#3d1f0a' }}>{title}</span>
        </div>
        {status !== undefined && <Dot on={status} />}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

// ─── SLIP CHECKER CARD ───
function SlipCard({ accent }) {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setResult(null); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/slip-check', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'ຜິດພາດ')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // 3 states: 'ok' | 'suspicious' | 'duplicate'
  const status = result
    ? result.duplicate   ? 'duplicate'
    : result.suspicious  ? 'suspicious'
    : 'ok'
    : null

  const statusCfg = {
    ok:         { bg: '#f0fdf4', border: '#86efac', color: '#16a34a', icon: '✅', label: 'ສລິບປົກກະຕິ' },
    suspicious: { bg: '#fffbeb', border: '#fcd34d', color: '#d97706', icon: '⚠️', label: 'ໜ້າສົງໄສ' },
    duplicate:  { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', icon: '❌', label: 'ສລິບຊ້ຳ!' },
  }
  const cfg = status ? statusCfg[status] : null

  return (
    <Card icon="🧾" title="Slip Checker" accent={accent} status={result ? status === 'ok' : undefined}>
      <div className="flex flex-col gap-3">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full py-3 rounded-xl font-black text-sm transition-all active:scale-95"
          style={{ background: loading ? '#e8d5c0' : '#3d1f0a', color: loading ? '#8a6a55' : '#fdf6ee' }}>
          {loading ? '🔍 ກຳລັງກວດ...' : '📤 ອັບໂຫຼດສລິບ'}
        </button>

        {error && (
          <div className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
            ❌ {error}
          </div>
        )}

        {result && cfg && (
          <div className="px-3 py-3 rounded-xl flex flex-col gap-2"
            style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>

            {/* Status header */}
            <div className="flex items-center justify-between">
              <div className="font-black text-sm" style={{ color: cfg.color }}>
                {cfg.icon} {cfg.label}
              </div>
              {result.slipInfo?.confidence && (
                <div className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: result.slipInfo.confidence === 'high'   ? '#dcfce7'
                              : result.slipInfo.confidence === 'medium' ? '#fef9c3' : '#fee2e2',
                    color:      result.slipInfo.confidence === 'high'   ? '#15803d'
                              : result.slipInfo.confidence === 'medium' ? '#a16207' : '#b91c1c',
                  }}>
                  {result.slipInfo.confidence === 'high'   ? 'ຄວາມໝັ້ນໃຈ: ສູງ'
                 : result.slipInfo.confidence === 'medium' ? 'ຄວາມໝັ້ນໃຈ: ກາງ'
                 :                                           'ຄວາມໝັ້ນໃຈ: ຕ່ຳ'}
                </div>
              )}
            </div>

            {/* Suspicious reason box */}
            {status === 'suspicious' && result.slipInfo?.reason && (
              <div className="px-2 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>
                ⚠ {result.slipInfo.reason}
              </div>
            )}

            {/* Duplicate: when first seen */}
            {status === 'duplicate' && result.first_seen && (
              <div className="px-2 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                ໃຊ້ແລ້ວເມື່ອ: {new Date(result.first_seen).toLocaleString('lo-LA')}
                {result.first_sender && ` · ${result.first_sender}`}
              </div>
            )}

            {/* Slip details */}
            <div className="flex flex-col gap-1 pt-1" style={{ borderTop: `1px solid ${cfg.border}` }}>
              {result.slipInfo?.transaction_id && (
                <div className="text-xs font-bold" style={{ color: '#8a6a55' }}>
                  Ref: {result.slipInfo.transaction_id}
                </div>
              )}
              {result.slipInfo?.amount && (
                <div className="text-xs font-bold" style={{ color: '#3d1f0a' }}>
                  ຈຳນວນ: {fmt(result.slipInfo.amount)} LAK
                </div>
              )}
              {result.slipInfo?.sender_name && (
                <div className="text-xs font-bold" style={{ color: '#3d1f0a' }}>
                  ຜູ້ໂອນ: {result.slipInfo.sender_name}
                </div>
              )}
              {result.slipInfo?.transfer_date && (
                <div className="text-xs" style={{ color: '#8a6a55' }}>
                  ວັນທີ: {result.slipInfo.transfer_date}
                </div>
              )}
            </div>

            {result.warning && (
              <div className="text-xs" style={{ color: '#f59e0b' }}>⚠ {result.warning}</div>
            )}
          </div>
        )}

        <div className="text-xs font-bold text-center" style={{ color: '#a0522d' }}>
          AI ອ່ານ · ກວດຊ້ຳ · ກວດຄວາມໜ້າສົງໄສ
        </div>
      </div>
    </Card>
  )
}

// ─── MAIN PAGE ───
export default function OfficePage() {
  const [unlocked,   setUnlocked]   = useState(false)
  const [staffPin,   setStaffPin]   = useState('')
  const [pinError,   setPinError]   = useState('')
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Data
  const [orders,     setOrders]     = useState([])
  const [menus,      setMenus]      = useState([])
  const [stockShop,  setStockShop]  = useState([])
  const [stockOnline,setStockOnline]= useState([])
  const [settings,   setSettings]   = useState({})
  const [shopInfo,   setShopInfo]   = useState({ name: 'Basic Chinese Bun' })
  const [branches,   setBranches]   = useState([])
  const [msgCount,   setMsgCount]   = useState(0)

  // ─── Load config (same pattern as staff page) ───
  const loadConfig = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('shop_config').select('*')
    if (!data) return
    const cfg = {}
    data.forEach(r => { cfg[r.key] = r.value })
    if (cfg.menus)      setMenus(JSON.parse(cfg.menus))
    if (cfg.stock_shop) setStockShop(JSON.parse(cfg.stock_shop))
    if (cfg.stock_online) setStockOnline(JSON.parse(cfg.stock_online))
    if (cfg.settings)   setSettings(JSON.parse(cfg.settings))
    if (cfg.shop_info)  setShopInfo(JSON.parse(cfg.shop_info))
    if (cfg.branches)   setBranches(JSON.parse(cfg.branches))
    if (cfg.staff_pin)  setStaffPin(cfg.staff_pin)
  }, [])

  // ─── Load orders ───
  const loadOrders = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('orders').select('id,type,status,total,done,cancelled,created_at,done_at').order('created_at', { ascending: false })
    if (data) setOrders(data)
  }, [])

  // ─── Load message count ───
  const loadMessages = useCallback(async () => {
    if (!supabase) return
    const today = todayRange()
    const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', today)
    setMsgCount(count || 0)
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([loadConfig(), loadOrders(), loadMessages()])
    setLastUpdate(new Date())
    setLoading(false)
  }, [loadConfig, loadOrders, loadMessages])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 60000)
    return () => clearInterval(timer)
  }, [refresh])

  function tryPin(pin) {
    if (!staffPin || pin === staffPin) {
      setUnlocked(true); setPinError('')
    } else {
      setPinError('ລະຫັດຜິດ')
    }
  }

  if (!unlocked) return <PinPad onSubmit={tryPin} error={pinError} />

  // ─── Computed data ───
  const today     = todayRange()
  const monthStart= monthRange()
  const now       = new Date()
  const dayLabel  = DAY_LABELS[now.getDay()]
  const timeStr   = now.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })

  const todayOrders  = orders.filter(o => o.created_at >= today)
  const doneToday    = todayOrders.filter(o => o.done)
  const revenueToday = doneToday.reduce((s, o) => s + (o.total || 0), 0)
  const pendingOnline= orders.filter(o => o.type === 'online' && o.status === 'pending' && !o.done && !o.cancelled)
  const walkinToday  = todayOrders.filter(o => o.type === 'walkin').length
  const preorderToday= todayOrders.filter(o => o.type === 'online').length

  const monthOrders  = orders.filter(o => o.created_at >= monthStart && o.done)
  const revenueMonth = monthOrders.reduce((s, o) => s + (o.total || 0), 0)

  const LOW = 5
  const lowStockMenus = menus.filter((_, i) => (stockShop[i] || 0) <= LOW || (stockOnline[i] || 0) <= LOW)

  const branch = branchStatus()

  return (
    <div className="min-h-dvh" style={{ background: '#f5ebe0' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: '#3d1f0a' }}>
        <div>
          <div className="font-serif font-black text-lg" style={{ color: '#fdf6ee' }}>🏢 BCB Office</div>
          <div className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.5)' }}>{dayLabel} · {timeStr}</div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <div className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.4)' }}>
              ອັດຕາໂນມັດ 60s
            </div>
          )}
          <button onClick={refresh} disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95"
            style={{ background: 'rgba(253,246,238,0.15)', color: '#fdf6ee' }}>
            {loading ? '...' : '↺ Refresh'}
          </button>
          <button onClick={() => setUnlocked(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-black"
            style={{ background: 'rgba(253,246,238,0.1)', color: 'rgba(253,246,238,0.5)' }}>
            🔒
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          ['ວັນນີ້', todayOrders.length + ' ໃບ', '#3d1f0a'],
          ['ຍອດວັນນີ້', fmtKip(revenueToday), '#1a3d1f'],
          ['Pending', pendingOnline.length + ' ໃບ', pendingOnline.length > 0 ? '#c2410c' : '#3d1f0a'],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-xl p-3 text-center" style={{ background: '#fffbf6', border: '1px solid #e8d5c0' }}>
            <div className="text-lg font-black" style={{ color: c }}>{v}</div>
            <div className="text-xs font-bold mt-0.5" style={{ color: '#8a6a55' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* 6 Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-3 pb-8">

        {/* 1. หน้าร้าน Walk-in */}
        <Card icon="🏪" title="ໜ້າຮ້ານ · Walk-in" accent="#7c3aed" status={branch.anyOpen}>
          <Row label="ວັນທີ" value={`${dayLabel} ${timeStr}`} />
          <Row label="ສາຂາສີເມືອງ" value={branch.simeuang ? 'ເປີດ ✓' : 'ປິດ'} sub="ຈ · ພ · ສ  15:00–19:30" />
          <Row label="ສາຂາຫວຍຫົງ" value={branch.houayhong ? 'ເປີດ ✓' : 'ປິດ'} sub="ຄ · ສກ · ອ  15:00–19:30" />
          {branches.map(b => b.phone1 && (
            <Row key={b.id} label={b.name} value={'📞 ' + b.phone1} />
          ))}
        </Card>

        {/* 2. POS & Preorder */}
        <Card icon="💻" title="POS & Preorder" accent="#2563eb" status={todayOrders.length > 0}>
          <Row label="Walk-in ວັນນີ້" value={walkinToday + ' ໃບ'} />
          <Row label="Preorder ວັນນີ້" value={preorderToday + ' ໃບ'} />
          <Row label="Pending Preorder" value={pendingOnline.length + ' ໃບ'} />
          <Row label="ຍອດ Done ວັນນີ້" value={fmtKip(revenueToday)} big />
          {lowStockMenus.length > 0 && (
            <div className="mt-1 px-2 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#fef3c7', color: '#92400e' }}>
              ⚠ ສຕ໋ອກໃກ້ໝົດ: {lowStockMenus.map(m => m.lo || m).join(', ')}
            </div>
          )}
        </Card>

        {/* 3. AI Chatbot */}
        <Card icon="🤖" title="AI Chatbot" accent="#0891b2" status={settings.aiOn !== false}>
          <Row label="ສະຖານະ AI" value={settings.aiOn !== false ? 'Online' : 'Offline'} />
          <Row label="ຂໍ້ຄວາມວັນນີ້" value={msgCount + ' ຂໍ້ຄວາມ'} />
          <Row label="ຮັບ Online" value={settings.onlineOn !== false ? 'ເປີດ ✓' : 'ປິດ'} />
          <Row label="ຮັບ Walk-in" value={settings.walkinOn !== false ? 'ເປີດ ✓' : 'ປິດ'} />
          {settings.aiOn === false && (
            <div className="mt-1 px-2 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#fef2f2', color: '#dc2626' }}>
              AI ຖືກປິດຢູ່ — ຈະຕ້ອງຕອບເອງ
            </div>
          )}
        </Card>

        {/* 4. Content & Facebook */}
        <Card icon="📱" title="Content & Facebook" accent="#db2777" status={null}>
          {branches.length > 0 ? branches.map(b => (
            <div key={b.id}>
              <div className="text-xs font-black mb-1" style={{ color: '#8a6a55' }}>{b.name}</div>
              <div className="flex gap-2 mb-2 flex-wrap">
                {b.facebookUrl && <a href={b.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Facebook →</a>}
                {b.tiktokUrl   && <a href={b.tiktokUrl}   target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: '#fdf4ff', color: '#7e22ce' }}>TikTok →</a>}
              </div>
            </div>
          )) : (
            <div className="text-xs font-bold text-center py-2" style={{ color: '#a0522d' }}>ຕັ້ງຄ່າ Branch ໃນ Staff → ⚙</div>
          )}
          <div className="mt-1 px-2 py-2 rounded-lg text-xs font-bold text-center" style={{ background: '#fdf6ee', color: '#a0522d', border: '1px dashed #e8d5c0' }}>
            📊 Engagement ສຳລັບຕໍ່ໄປ
          </div>
        </Card>

        {/* 5. Finance */}
        <Card icon="💰" title="ການເງິນ · Finance" accent="#16a34a" status={revenueToday > 0}>
          <Row label="ຍອດ Done ວັນນີ້" value={fmtKip(revenueToday)} big />
          <Row label="ຍອດ Done ເດືອນນີ້" value={fmtKip(revenueMonth)} />
          <Row label="ຈຳນວນ Order Done ວັນນີ້" value={doneToday.length + ' ໃບ'} />
          <Row label="Order Done ເດືອນ" value={monthOrders.length + ' ໃບ'} />
          {revenueToday > 0 && doneToday.length > 0 && (
            <Row label="ສະເລ່ຍ / ໃບ" value={fmtKip(Math.round(revenueToday / doneToday.length))} />
          )}
        </Card>

        {/* 6. Slip Checker */}
        <SlipCard accent="#c2410c" />

      </div>

      {/* Footer */}
      <div className="text-center pb-6 text-xs font-bold" style={{ color: '#a0522d' }}>
        Basic Chinese Bun · Office Dashboard
        {lastUpdate && <span> · ອັດຕາໂນມັດ: {lastUpdate.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
    </div>
  )
}
