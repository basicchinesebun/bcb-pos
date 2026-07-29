'use client'
import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Paperclip, Send, MessageCircle, X } from 'lucide-react'
import ChatMessage from '../../components/chat/ChatMessage'

const MOCK_MESSAGES = [
  { id: 1, role: 'shop', text: 'ສະບາຍດີ! ຍິນດີຕ້ອນຮັບສູ່ Basic Chinese Bun 🥟 ມີຫຍັງໃຫ້ຊ່ວຍໄດ້ແດ່?', ts: Date.now() - 120000, orderId: null },
  { id: 2, role: 'customer', text: 'ສະບາຍດີ ຢາກຖາມວ່າຊາລາເປົາໄສ້ຫົວໝູຍັງມີໄຫມ?', ts: Date.now() - 90000 },
  { id: 3, role: 'shop', text: 'ມີຄ່ະ ຕອນນີ້ຍັງເຫຼືອ 8 ໂລ ✅ ຢາກສັ່ງເລີຍໄດ້ເລີຍ', ts: Date.now() - 60000, orderId: 'ORD-042' },
]

const STOCK_BANNER = 'ແຈ້ງເຕືອນ: ຊາລາເປົາໄສ້ຫວານເຫຼືອໜ້ອຍ — ສັ່ງດ່ວນກ່ອນໝົດ!'

function ChatCore({ messages, onSend, shopName = 'Basic Chinese Bun', onBack }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF2E7' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#2E1C12' }}>
        {onBack && (
          <button onClick={onBack} className="text-white p-1 rounded-lg">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-white truncate">{shopName}</p>
          <p className="text-xs" style={{ color: '#C4A882' }}>ຕອບໄວ ⚡</p>
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-black" style={{ background: '#00A859', color: '#fff' }}>
          AI ON
        </span>
      </div>

      {/* Announcement */}
      <div className="px-4 py-2 text-xs font-bold flex-shrink-0" style={{ background: '#FEF3C7', color: '#92400E', borderBottom: '1px solid #FCD34D' }}>
        📢 {STOCK_BANNER}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map(m => <ChatMessage key={m.id} msg={m} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0 border-t" style={{ background: '#fff', borderColor: '#E8D5C0' }}>
        <button className="p-2 rounded-full" style={{ color: '#9E7B6A' }}>
          <Paperclip size={20} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="ພິມຂໍ້ຄວາມ..."
          className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
          style={{ background: '#FAF2E7', color: '#2E1C12', border: '1.5px solid #E8D5C0' }}
        />
        <button
          onClick={send}
          className="p-2.5 rounded-full transition-opacity"
          style={{ background: '#2E1C12', color: '#fff', opacity: input.trim() ? 1 : 0.4 }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

/* Desktop floating widget */
function ChatWidget({ messages, onSend }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ width: 380, height: 600, border: '1px solid #E8D5C0' }}
        >
          <ChatCore messages={messages} onSend={onSend} onBack={() => setOpen(false)} />
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105"
        style={{ background: '#2E1C12', color: '#fff' }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  )
}

export default function CustomerChatPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES)

  const handleSend = text => {
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'customer', text, ts: Date.now() },
    ])
    // Mock AI reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'shop', text: 'ຂໍບໍລິຫານຊ່ວຍກ່ອນ ຈະຕອບກ່ອນຊ່ວໂມງໜ້ານີ້ 🙏', ts: Date.now(), orderId: null },
      ])
    }, 1200)
  }

  return (
    <>
      {/* Mobile: full-screen */}
      <div className="md:hidden h-dvh">
        <ChatCore messages={messages} onSend={handleSend} />
      </div>

      {/* Desktop: shop page + floating widget */}
      <div className="hidden md:flex flex-col min-h-dvh" style={{ background: '#FAF2E7' }}>
        <div className="flex items-center gap-4 px-8 py-4" style={{ background: '#2E1C12' }}>
          <img src="/logo.jpg" alt="logo" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-black text-xl text-white">Basic Chinese Bun</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg font-bold" style={{ color: '#9E7B6A' }}>
            ຄລິກປຸ່ມແຊດດ້ານລຸ່ມຂວາ ເພື່ອລົມກັບຮ້ານ 👇
          </p>
        </div>
        <ChatWidget messages={messages} onSend={handleSend} />
      </div>
    </>
  )
}
