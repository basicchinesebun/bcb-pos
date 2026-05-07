'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const EMOJIS = ['🥟','🍫','🍵','🧁','🍞','🥐','🍮']

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [menus, setMenus] = useState([])
  const [images, setImages] = useState({})
  const [liveStatus, setLiveStatus] = useState('connecting')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!supabase) return
    loadOrders()
    loadConfig()
    const channel = supabase
      .channel('kitchen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe(status => setLiveStatus(status === 'SUBSCRIBED' ? 'live' : 'connecting'))
    const fallback = setInterval(loadOrders, 15000)
    return () => { supabase.removeChannel(channel); clearInterval(fallback) }
  }, [])

  async function loadOrders() {
    const { data } = await supabase.from('orders')
      .select('*').eq('done', false).eq('cancelled', false).neq('status', 'rejected')
      .order('created_at', { ascending: true })
    if (data) setOrders(data)
  }

  async function loadConfig() {
    const { data } = await supabase.from('shop_config').select('*')
    if (!data) return
    const cfg = {}
    data.forEach(r => { cfg[r.key] = r.value })
    if (cfg.shop_info) setShopInfo(JSON.parse(cfg.shop_info))
    if (cfg.menus) setMenus(JSON.parse(cfg.menus))
    if (cfg.menu_images) setImages(JSON.parse(cfg.menu_images))
  }

  async function markDone(o) {
    await supabase.from('orders').update({ done: true, done_at: new Date().toISOString() }).eq('id', o.id)
    setOrders(prev => prev.filter(x => x.id !== o.id))
  }

  async function markCancel(o) {
    await supabase.from('orders').update({ cancelled: true }).eq('id', o.id)
    setOrders(prev => prev.filter(x => x.id !== o.id))
  }

  const allConfirmed = orders.filter(o => o.status === 'confirmed')
  const allPending = orders.filter(o => o.type === 'online' && o.status === 'pending')

  function applyFilter(list) {
    if (filter === 'all') return list
    return list.filter(o => o.type === filter)
  }

  const confirmed = applyFilter(allConfirmed)
  const pending = applyFilter(allPending)

  const TABS = [
    { key: 'all', label: 'ທັງໝົດ' },
    { key: 'online', label: '🌐 Online' },
    { key: 'walkin', label: '🏪 Walk-in' },
  ]

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'var(--brown)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-serif text-lg font-black" style={{ color: 'var(--cream)' }}>🍳 Kitchen Display</div>
            <div className="text-xs" style={{ color: 'rgba(253,246,238,0.6)' }}>{shopInfo.name}</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
            style={{ background: liveStatus === 'live' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)', color: liveStatus === 'live' ? '#16a34a' : '#92400e' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: liveStatus === 'live' ? '#22c55e' : '#f59e0b' }} />
            {liveStatus === 'live' ? 'LIVE' : '...'}
          </div>
        </div>
        {/* Filter tabs */}
        <div className="flex px-4 pb-2 gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="px-3 py-1 rounded-full text-xs font-black transition-colors"
              style={{
                background: filter === t.key ? 'var(--cream)' : 'rgba(253,246,238,0.15)',
                color: filter === t.key ? 'var(--brown)' : 'rgba(253,246,238,0.8)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {confirmed.length === 0 && pending.length === 0 && (
          <div className="flex items-center justify-center h-64 text-xl font-black" style={{ color: 'var(--cream3)' }}>
            ຍັງບໍ່ມີອໍເດີ
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#92400e' }}>⏳ ລໍຖ້າຢືນຢັນ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pending.map(o => <OrderCard key={o.id} o={o} onDone={markDone} onCancel={markCancel} menus={menus} images={images} />)}
            </div>
          </div>
        )}

        {confirmed.length > 0 && (
          <div>
            <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#16a34a' }}>🔥 ກຳລັງເຮັດ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {confirmed.map(o => <OrderCard key={o.id} o={o} onDone={markDone} onCancel={markCancel} menus={menus} images={images} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function parseBagLabel(bagLabel) {
  if (!bagLabel) return []
  return bagLabel.split(' | ').map(part => {
    const colonIdx = part.indexOf(': ')
    const header = colonIdx >= 0 ? part.slice(0, colonIdx) : part
    const contents = colonIdx >= 0 ? part.slice(colonIdx + 2) : ''
    const itemList = contents.split(', ').map(s => {
      const m = s.match(/^(.+)\s×(\d+)$/)
      return m ? { name: m[1].trim(), qty: parseInt(m[2]) } : { name: s, qty: 1 }
    }).filter(it => it.name)
    return { header, items: itemList }
  }).filter(b => b.items.length > 0)
}

function OrderCard({ o, onDone, onCancel, menus, images }) {
  const [slipOpen, setSlipOpen] = useState(false)
  const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
  const cust = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
  const time = new Date(o.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
  const mins = Math.floor((Date.now() - new Date(o.created_at)) / 60000)
  const isUrgent = mins >= 10
  const bags = parseBagLabel(o.bag_label)
  const hasBags = bags.length > 0

  function getItemImage(name) {
    const idx = menus.findIndex(m => (m.lo || m) === name)
    if (idx >= 0 && images[idx]) return { img: images[idx], emoji: EMOJIS[idx] || '🍱', idx }
    return { img: null, emoji: '🍱', idx }
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--warm-white)', border: `2px solid ${isUrgent ? '#ef4444' : 'var(--brown)'}` }}>

        {/* Queue number header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--brown)' }}>
          <div className="font-serif text-4xl font-black" style={{ color: 'var(--cream)' }}>
            #{String(o.qnum).padStart(4, '0')}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.7)' }}>{time}</div>
            <div className="text-xs font-black mt-0.5" style={{ color: isUrgent ? '#ef4444' : 'rgba(253,246,238,0.6)' }}>
              {mins} ນາທີ{isUrgent ? ' ⚠' : ''}
            </div>
            <div className="text-xs mt-0.5 font-bold" style={{ color: 'rgba(253,246,238,0.8)' }}>
              {o.type === 'online' ? '🌐 Online' : '🏪 Walk-in'}
            </div>
          </div>
        </div>

        <div className="flex-1 p-3 flex flex-col gap-3">

          {/* ── Items summary (always shown) ── */}
          <div className="flex flex-col gap-1">
            {items.map((it, i) => {
              const { img, emoji, idx } = getItemImage(it.name)
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'var(--cream2)' }}>
                    {img
                      ? <img src={img} className="w-full h-full object-cover" alt={it.name} />
                      : <span className="text-lg">{emoji}</span>}
                  </div>
                  <span className="font-black text-base flex-1" style={{ color: 'var(--brown)' }}>{it.name}</span>
                  <span className="font-black text-2xl" style={{ color: 'var(--brown2)' }}>×{it.qty}</span>
                </div>
              )
            })}
          </div>

          {/* ── Total price ── */}
          {o.total > 0 && (
            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--cream3)' }}>
              <span className="text-sm font-black" style={{ color: 'var(--brown3)' }}>ລວມ</span>
              <span className="text-lg font-black" style={{ color: 'var(--brown)' }}>{o.total.toLocaleString()} ກີບ</span>
            </div>
          )}

          {/* ── Payment slip (online orders) ── */}
          {o.slip_url && (
            <button onClick={() => setSlipOpen(true)}
              className="flex items-center gap-2 rounded-xl overflow-hidden w-full text-left"
              style={{ border: '2px solid var(--cream3)', background: 'var(--cream2)' }}>
              <img src={o.slip_url} className="w-16 h-16 object-cover flex-shrink-0" alt="slip" />
              <div className="px-2 flex-1">
                <div className="text-xs font-black" style={{ color: 'var(--brown)' }}>🧾 ສລິບໂອນເງິນ</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>ກົດເພື່ອຂະຫຍາຍ</div>
              </div>
            </button>
          )}

          {/* ── Bag breakdown (big display) ── */}
          {hasBags && (
            <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--cream3)' }}>
              <div className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--brown3)' }}>🛍 ແຍກຖົງ</div>
              {bags.map((bag, bi) => (
                <div key={bi} className="rounded-xl overflow-hidden" style={{ border: '2px solid var(--cream3)' }}>
                  <div className="px-3 py-2 font-black text-sm" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                    🛍 {bag.header}
                  </div>
                  <div className="p-2 flex flex-col gap-2">
                    {bag.items.map((it, ii) => {
                      const { img, emoji } = getItemImage(it.name)
                      return (
                        <div key={ii} className="flex items-center gap-3">
                          <div className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                            style={{ width: 64, height: 64, background: 'var(--cream2)' }}>
                            {img
                              ? <img src={img} className="w-full h-full object-cover" alt={it.name} />
                              : <span style={{ fontSize: 32 }}>{emoji}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black leading-tight" style={{ fontSize: 18, color: 'var(--brown)' }}>{it.name}</div>
                          </div>
                          <div className="font-black flex-shrink-0" style={{ fontSize: 40, color: 'var(--brown)', lineHeight: 1 }}>
                            {it.qty}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer info */}
          {cust && (
            <div className="pt-2 border-t text-xs font-bold leading-5" style={{ borderColor: 'var(--cream3)', color: 'var(--gray3)' }}>
              👤 {cust.name}{cust.phone ? ` · 📞 ${cust.phone}` : ''}{cust.time ? ` · ⏰ ${cust.time}` : (cust.date ? ` · 📅 ${cust.date}` : '')}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 p-3 border-t" style={{ borderColor: 'var(--cream3)' }}>
          <button onClick={() => onCancel(o)} className="py-3 rounded-xl text-sm font-black bg-red-50 text-red-600" style={{ border: '1.5px solid #fca5a5' }}>
            ✕ ຍົກເລີກ
          </button>
          <button onClick={() => onDone(o)} className="py-3 rounded-xl text-sm font-black bg-green-50 text-green-700" style={{ border: '1.5px solid #86efac' }}>
            ✓ ສຳເລັດ
          </button>
        </div>
      </div>

      {/* Slip full-screen viewer */}
      {slipOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => setSlipOpen(false)}>
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
            <button className="text-white text-xl font-black">← ປິດ</button>
            <span className="text-white text-sm font-black">🧾 ສລິບ #{String(o.qnum).padStart(4,'0')}</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={o.slip_url} className="max-w-full max-h-full object-contain rounded-xl" alt="payment slip" />
          </div>
        </div>
      )}
    </>
  )
}
