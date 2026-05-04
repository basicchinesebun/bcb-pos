'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [liveStatus, setLiveStatus] = useState('connecting')

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
  }

  async function markDone(o) {
    await supabase.from('orders').update({ done: true, done_at: new Date().toISOString() }).eq('id', o.id)
    setOrders(prev => prev.filter(x => x.id !== o.id))
  }

  async function markCancel(o) {
    await supabase.from('orders').update({ cancelled: true }).eq('id', o.id)
    setOrders(prev => prev.filter(x => x.id !== o.id))
  }

  const confirmed = orders.filter(o => o.type === 'walkin' || o.status === 'confirmed')
  const pending = orders.filter(o => o.type === 'online' && o.status === 'pending')

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--brown)' }}>
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
              {pending.map(o => <OrderCard key={o.id} o={o} onDone={markDone} onCancel={markCancel} dimmed />)}
            </div>
          </div>
        )}

        {confirmed.length > 0 && (
          <div>
            <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#16a34a' }}>🔥 ກຳລັງເຮັດ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {confirmed.map(o => <OrderCard key={o.id} o={o} onDone={markDone} onCancel={markCancel} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ o, onDone, onCancel, dimmed }) {
  const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
  const cust = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
  const time = new Date(o.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
  const mins = Math.floor((Date.now() - new Date(o.created_at)) / 60000)
  const isUrgent = mins >= 10

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'var(--warm-white)', border: `2px solid ${isUrgent ? '#ef4444' : dimmed ? 'var(--cream3)' : 'var(--brown)'}`, opacity: dimmed ? 0.7 : 1 }}>

      {/* Queue number */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: dimmed ? 'var(--cream2)' : 'var(--brown)' }}>
        <div className="font-serif text-4xl font-black" style={{ color: dimmed ? 'var(--brown)' : 'var(--cream)' }}>
          #{String(o.qnum).padStart(3, '0')}
        </div>
        <div className="text-right">
          <div className="text-xs font-bold" style={{ color: dimmed ? 'var(--gray3)' : 'rgba(253,246,238,0.7)' }}>{time}</div>
          <div className="text-xs font-black mt-0.5" style={{ color: isUrgent ? '#ef4444' : dimmed ? 'var(--gray3)' : 'rgba(253,246,238,0.6)' }}>
            {mins} ນາທີ{isUrgent ? ' ⚠' : ''}
          </div>
          <div className="text-xs mt-0.5 font-bold" style={{ color: dimmed ? 'var(--brown3)' : 'rgba(253,246,238,0.8)' }}>
            {o.type === 'online' ? '🌐 Online' : '🏪 Walk-in'}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 p-3 flex flex-col gap-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="font-black text-base" style={{ color: 'var(--brown)' }}>{it.name}</span>
            <span className="font-black text-xl" style={{ color: 'var(--brown2)' }}>×{it.qty}</span>
          </div>
        ))}
        {cust && (
          <div className="mt-2 pt-2 border-t text-xs font-bold" style={{ borderColor: 'var(--cream3)', color: 'var(--gray3)' }}>
            👤 {cust.name} · 📅 {cust.date} {cust.time}
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
  )
}
