'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const STATUS_MAP = {
  pending:   { label: '⏳ ລໍຖ້າຢືນຢັນ', cls: 'bg-orange-50 text-orange-700', icon: '⏳' },
  confirmed: { label: '✓ ຢືນຢັນແລ້ວ',   cls: 'bg-green-50 text-green-700',  icon: '✅' },
  rejected:  { label: '✕ ປະຕິເສດ',       cls: 'bg-red-50 text-red-700',       icon: '❌' },
  done:      { label: '✓ ສຳເລັດ',        cls: 'bg-green-100 text-green-800',  icon: '🎉' },
}

function StatusContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [order, setOrder] = useState(null)
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [notFound, setNotFound] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatVH, setChatVH] = useState(null)
  const chatBottomRef = useRef(null)

  useEffect(() => {
    if (!id || !supabase) { setNotFound(true); return }
    supabase.from('shop_config').select('key,value').then(({ data }) => {
      if (data) {
        const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
        if (cfg.shop_info) setShopInfo(JSON.parse(cfg.shop_info))
      }
    })
    supabase.from('orders').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setOrder(data)
      else setNotFound(true)
    })
    const ch = supabase.channel('status-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => setOrder(payload.new))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [id])

  useEffect(() => {
    if (!chatOpen || !order || !supabase) return
    const c = customer()
    if (!c?.phone) return
    supabase.from('messages').select('*').eq('phone', c.phone)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setChatMessages(data) })
    const ch = supabase.channel('chat-status-' + c.phone)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `phone=eq.${c.phone}` },
        payload => setChatMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [chatOpen, order?.id])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // iOS Safari keyboard: track visualViewport height so chat overlay resizes with keyboard
  useEffect(() => {
    if (!chatOpen) { setChatVH(null); return }
    function update() { setChatVH((window.visualViewport?.height ?? window.innerHeight) + 'px') }
    update()
    window.visualViewport?.addEventListener('resize', update)
    return () => window.visualViewport?.removeEventListener('resize', update)
  }, [chatOpen])

  function customer() {
    if (!order?.customer) return null
    return typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer
  }

  async function sendMsg() {
    if (!chatInput.trim() || chatSending || !order || !supabase) return
    const c = customer()
    setChatSending(true)
    await supabase.from('messages').insert({
      phone: c.phone, name: c.name, qnum: order.qnum,
      sender: 'customer', text: chatInput.trim(),
    })
    setChatInput('')
    setChatSending(false)
  }

  if (!id || notFound) return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-8" style={{ background: 'var(--cream)' }}>
      <div className="text-4xl mb-4">🔍</div>
      <div className="font-black text-lg mb-2" style={{ color: 'var(--brown)' }}>ບໍ່ພົບ Order</div>
      <div className="text-sm font-bold" style={{ color: 'var(--gray3)' }}>ລິ້ງນີ້ໝົດອາຍຸ ຫລື ບໍ່ຖືກຕ້ອງ</div>
    </div>
  )

  if (!order) return (
    <div className="min-h-dvh flex flex-col items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{ borderColor: 'rgba(61,31,10,0.15)', borderTopColor: 'var(--brown)' }} />
    </div>
  )

  const c = customer()
  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ background: 'var(--brown)' }}>
        <div className="font-serif font-black text-xl" style={{ color: 'var(--cream)' }}>{shopInfo.name}</div>
        <div className="text-xs font-bold mt-0.5" style={{ color: 'rgba(253,246,238,0.55)' }}>ຕິດຕາມ Order</div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 max-w-sm mx-auto w-full">
        {/* Queue number + status */}
        <div className="card text-center py-6">
          <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: 'var(--gray3)' }}>ເລກຄິວ · QUEUE</div>
          <div className="font-serif font-black leading-none mb-3" style={{ fontSize: 80, color: 'var(--brown)' }}>
            {String(order.qnum).padStart(4, '0')}
          </div>
          <span className={`inline-block px-5 py-2 rounded-full text-sm font-black ${statusInfo.cls}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Order details */}
        <div className="card">
          <div className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: 'var(--brown3)' }}>ລາຍລະອຽດ</div>
          {c && (
            <>
              <div className="flex justify-between py-1.5 border-b border-[#f5ebe0] text-sm font-bold" style={{ color: 'var(--brown2)' }}>
                <span>ຊື່</span><span>{c.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#f5ebe0] text-sm font-bold" style={{ color: 'var(--brown2)' }}>
                <span>ເວລາຮັບ</span><span>{c.time}</span>
              </div>
            </>
          )}
          {items.map((it, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-[#f5ebe0] text-sm font-bold" style={{ color: 'var(--brown2)' }}>
              <span>{it.name}</span><span>× {it.qty}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 text-base font-black" style={{ color: 'var(--brown)' }}>
            <span>ລວມ</span><span>{order.total?.toLocaleString()} ກີບ</span>
          </div>
        </div>

        {/* Share this link */}
        <button onClick={async () => {
          const url = window.location.href
          if (navigator.share) {
            await navigator.share({ title: `Order #${String(order.qnum).padStart(4,'0')} – ${shopInfo.name}`, url })
          } else {
            await navigator.clipboard.writeText(url)
            alert('ຄັດລອກລິ້ງແລ້ວ!')
          }
        }} className="card flex items-center justify-between py-3 cursor-pointer"
          style={{ border: '1.5px dashed var(--cream3)' }}>
          <div>
            <div className="text-sm font-black" style={{ color: 'var(--brown)' }}>🔗 ແຊລິ້ງໜ້ານີ້</div>
            <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>bookmark ໄວ້ ຫລື ສ່ງໃຫ້ຄົນໃນຄອບຄົວ</div>
          </div>
          <span className="text-xl">📤</span>
        </button>

        {/* Chat */}
        {c?.phone && (
          <button onClick={() => setChatOpen(true)}
            className="btn-primary py-3 text-sm">
            💬 ຕິດຕໍ່ຮ້ານ
          </button>
        )}
      </div>

      {/* Chat full-screen overlay */}
      {chatOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col" style={{ background: 'var(--cream)', height: chatVH ?? '100dvh' }}>
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'var(--brown)' }}>
            <button onClick={() => setChatOpen(false)} className="text-xl font-black" style={{ color: 'var(--cream)' }}>←</button>
            <div>
              <div className="font-black text-base" style={{ color: 'var(--cream)' }}>💬 ຕິດຕໍ່ຮ້ານ</div>
              <div className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.6)' }}>Order #{String(order.qnum).padStart(4, '0')}</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-sm font-bold py-8" style={{ color: 'var(--gray3)' }}>ສົ່ງຂໍ້ຄວາມຫາຮ້ານໄດ້ເລີຍ 👋</div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'staff' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 self-end mb-1"
                    style={{ background: 'var(--brown)', color: 'var(--cream)' }}>🥟</div>
                )}
                <div className="max-w-[75%]">
                  <div className="px-4 py-2.5 rounded-2xl text-sm font-bold leading-snug"
                    style={{
                      background: msg.sender === 'customer' ? 'var(--brown)' : 'white',
                      color: msg.sender === 'customer' ? 'var(--cream)' : 'var(--brown)',
                      border: msg.sender === 'staff' ? '1.5px solid var(--cream3)' : 'none',
                      borderBottomRightRadius: msg.sender === 'customer' ? 4 : undefined,
                      borderBottomLeftRadius: msg.sender === 'staff' ? 4 : undefined,
                    }}>
                    {msg.text}
                  </div>
                  <div className="text-[10px] font-bold mt-1 px-1"
                    style={{ color: 'var(--gray3)', textAlign: msg.sender === 'customer' ? 'right' : 'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
          <div className="p-3 flex gap-2 flex-shrink-0 border-t border-[#e8d5c0]" style={{ background: 'white' }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="ພິມຂໍ້ຄວາມ..." className="input-field flex-1 py-2.5 text-sm" />
            <button onClick={sendMsg} disabled={chatSending || !chatInput.trim()}
              className="px-5 py-2.5 rounded-xl font-black text-sm flex-shrink-0"
              style={{ background: chatInput.trim() ? 'var(--brown)' : 'var(--cream3)', color: chatInput.trim() ? 'var(--cream)' : 'var(--gray3)' }}>
              ສົ່ງ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: 'rgba(61,31,10,0.15)', borderTopColor: 'var(--brown)' }} />
      </div>
    }>
      <StatusContent />
    </Suspense>
  )
}
