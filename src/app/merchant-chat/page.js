'use client'
import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingBag, Users, BarChart2,
  Search, Send, Paperclip, ArrowLeft, ChevronRight,
} from 'lucide-react'
import ChatMessage from '../../components/chat/ChatMessage'
import ChatList from '../../components/chat/ChatList'
import CustomerPanel from '../../components/chat/CustomerPanel'
import QuickReplyChip from '../../components/chat/QuickReplyChip'

/* ─── Mock Data ─────────────────────────────────────────── */
const MOCK_CONVOS = [
  {
    id: 'c1', name: 'ນາງສາວ ກອງແກ້ວ', phone: '020 5512 3456',
    status: 'unread', unread: 3, time: '10:42',
    lastMsg: 'ຢາກສັ່ງຊາລາເປົາ 5 ໂລ',
    orders: [
      { id: '0041', status: 'pending', items: 'ຊາລາເປົາໄສ້ຫົວໝູ x5', total: 90000 },
      { id: '0028', status: 'done', items: 'ຊາລາເປົາໄສ້ຫວານ x3', total: 54000 },
    ],
    messages: [
      { id: 1, role: 'shop', text: 'ສະບາຍດີ! ມີຫຍັງໃຫ້ຊ່ວຍໄດ້ແດ່?', ts: Date.now() - 200000 },
      { id: 2, role: 'customer', text: 'ຢາກສັ່ງຊາລາເປົາ 5 ໂລ', ts: Date.now() - 120000 },
      { id: 3, role: 'customer', text: 'ສົ່ງໄດ້ໄຫມ?', ts: Date.now() - 60000 },
      { id: 4, role: 'customer', text: 'ໂທລະໂທ ຕອບຫນ່ອຍ', ts: Date.now() - 30000 },
    ],
  },
  {
    id: 'c2', name: 'ທ້າວ ສົມຊາຍ', phone: '030 2234 5678',
    status: 'active', unread: 0, time: '09:15',
    lastMsg: 'ຂອບໃຈຫຼາຍໆ',
    orders: [{ id: '0039', status: 'done', items: 'ຊາລາເປົາໄສ້ຕ່າງໆ x10', total: 180000 }],
    messages: [
      { id: 1, role: 'shop', text: 'ສະບາຍດີ ທ້າວສົມຊາຍ!', ts: Date.now() - 3600000 },
      { id: 2, role: 'customer', text: 'ສັ່ງ 10 ໂລ ໄດ້ໄຫມ?', ts: Date.now() - 3500000 },
      { id: 3, role: 'shop', text: 'ໄດ້ຄ່ະ ຈ່ອງໄວ້ເລີຍ', ts: Date.now() - 3400000 },
      { id: 4, role: 'customer', text: 'ຂອບໃຈຫຼາຍໆ', ts: Date.now() - 3300000 },
    ],
  },
  {
    id: 'c3', name: 'ນາງ ພອນ', phone: '021 9876 5432',
    status: 'closed', unread: 0, time: 'ມື້ວານ',
    lastMsg: 'ໂອເຄ ຂອບໃຈ',
    orders: [],
    messages: [
      { id: 1, role: 'customer', text: 'ມື້ນີ້ເປີດໄຫມ?', ts: Date.now() - 86400000 },
      { id: 2, role: 'shop', text: 'ເປີດຄ່ະ 08:00–17:00', ts: Date.now() - 86000000 },
      { id: 3, role: 'customer', text: 'ໂອເຄ ຂອບໃຈ', ts: Date.now() - 85000000 },
    ],
  },
]

const QUICK_REPLIES = [
  'ສະບາຍດີ! ມີຫຍັງໃຫ້ຊ່ວຍ?',
  'ຈ່ອງໄວ້ໃຫ້ແລ້ວ ✅',
  'ສົ່ງໄດ້ໃນ 30 ນາທີ',
  'ສິນຄ້າໝົດຊົ່ວຄາວ ⚠️',
  'ຂໍໂທດ ຕອນຈ່ອນ 🙏',
]

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: ShoppingBag, label: 'ອໍເດີ' },
  { icon: Users, label: 'ແຊດ', active: true },
  { icon: BarChart2, label: 'ລາຍງານ' },
]

/* ─── Thread panel ──────────────────────────────────────── */
function ThreadPanel({ convo, onSend, onBack }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convo?.messages])

  if (!convo) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#FAF2E7' }}>
      <p className="text-sm" style={{ color: '#9E7B6A' }}>ເລືອກລາຍການແຊດ</p>
    </div>
  )

  const send = txt => {
    if (!txt.trim()) return
    onSend(convo.id, txt.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF2E7' }}>
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ background: '#fff', borderColor: '#E8D5C0' }}>
        {onBack && (
          <button onClick={onBack} className="p-1" style={{ color: '#2E1C12' }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
          style={{ background: '#2E1C12' }}
        >
          {convo.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate" style={{ color: '#2E1C12' }}>{convo.name}</p>
          <p className="text-xs" style={{ color: '#00A859' }}>● ອອນລາຍ</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {convo.messages.map(m => <ChatMessage key={m.id} msg={m} />)}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0" style={{ borderTop: '1px solid #E8D5C0' }}>
        {QUICK_REPLIES.map(q => <QuickReplyChip key={q} label={q} onClick={send} />)}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0" style={{ background: '#fff', borderTop: '1px solid #E8D5C0' }}>
        <button className="p-2" style={{ color: '#9E7B6A' }}>
          <Paperclip size={20} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="ພິມຂໍ້ຄວາມ..."
          className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
          style={{ background: '#FAF2E7', color: '#2E1C12', border: '1.5px solid #E8D5C0' }}
        />
        <button
          onClick={() => send(input)}
          className="p-2.5 rounded-full"
          style={{ background: '#2E1C12', color: '#fff', opacity: input.trim() ? 1 : 0.4 }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function MerchantChatPage() {
  const [convos, setConvos] = useState(MOCK_CONVOS)
  const [selectedId, setSelectedId] = useState('c1')
  const [filter, setFilter] = useState('all')
  const [aiOn, setAiOn] = useState(true)
  const [mobileView, setMobileView] = useState('list') // 'list' | 'thread'

  const selected = convos.find(c => c.id === selectedId)

  const handleSend = (convoId, text) => {
    setConvos(prev => prev.map(c =>
      c.id !== convoId ? c : {
        ...c,
        lastMsg: text,
        time: new Date().toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }),
        messages: [...c.messages, { id: Date.now(), role: 'shop', text, ts: Date.now() }],
      }
    ))
  }

  const handleSelect = id => {
    setSelectedId(id)
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
    setMobileView('thread')
  }

  return (
    <div className="h-dvh flex overflow-hidden" style={{ background: '#FAF2E7' }}>

      {/* ── Nav Sidebar (desktop only) ── */}
      <aside className="hidden lg:flex flex-col w-16 flex-shrink-0" style={{ background: '#2E1C12' }}>
        <div className="py-4 flex items-center justify-center border-b" style={{ borderColor: '#4a2e1a' }}>
          <span className="text-white font-black text-lg">B</span>
        </div>
        {NAV.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            title={label}
            className="flex flex-col items-center gap-1 py-4 transition-colors"
            style={{ color: active ? '#fff' : '#9E7B6A', background: active ? 'rgba(255,255,255,0.08)' : 'transparent' }}
          >
            <Icon size={20} />
            <span style={{ fontSize: 9 }}>{label}</span>
          </button>
        ))}
      </aside>

      {/* ── Mobile: List view ── */}
      <div
        className={`md:hidden flex-col flex-1 overflow-hidden ${mobileView === 'list' ? 'flex' : 'hidden'}`}
      >
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#2E1C12' }}>
          <span className="font-black text-white flex-1">ແຊດລູກຄ້າ</span>
          <span className="text-xs font-black rounded-full px-2 py-0.5" style={{ background: '#00A859', color: '#fff' }}>
            {convos.filter(c => c.unread > 0).length} ໃໝ່
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatList
            conversations={convos}
            selectedId={selectedId}
            onSelect={handleSelect}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>
      </div>

      <div className={`md:hidden flex-col flex-1 overflow-hidden ${mobileView === 'thread' ? 'flex' : 'hidden'}`}>
        <ThreadPanel convo={selected} onSend={handleSend} onBack={() => setMobileView('list')} />
      </div>

      {/* ── Tablet: 2-column ── */}
      <div className="hidden md:flex lg:hidden flex-1 overflow-hidden">
        <div className="w-72 flex-shrink-0 border-r overflow-hidden" style={{ borderColor: '#E8D5C0' }}>
          <div className="px-4 py-3 font-black text-sm" style={{ background: '#2E1C12', color: '#fff' }}>
            ແຊດລູກຄ້າ
          </div>
          <div style={{ height: 'calc(100% - 48px)' }}>
            <ChatList
              conversations={convos}
              selectedId={selectedId}
              onSelect={handleSelect}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <ThreadPanel convo={selected} onSend={handleSend} />
        </div>
      </div>

      {/* ── Desktop: 3-column ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Chat list */}
        <div className="w-72 flex-shrink-0 border-r overflow-hidden flex flex-col" style={{ borderColor: '#E8D5C0' }}>
          <div className="px-4 py-3 font-black text-sm border-b flex items-center justify-between" style={{ background: '#fff', borderColor: '#E8D5C0', color: '#2E1C12' }}>
            <span>ທຸກການສົນທະນາ</span>
            <span
              className="text-xs font-black rounded-full px-2 py-0.5"
              style={{ background: '#F59E0B', color: '#fff' }}
            >
              {convos.filter(c => c.unread > 0).length} ໃໝ່
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatList
              conversations={convos}
              selectedId={selectedId}
              onSelect={handleSelect}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-hidden flex flex-col border-r" style={{ borderColor: '#E8D5C0' }}>
          <ThreadPanel convo={selected} onSend={handleSend} />
        </div>

        {/* Right panel */}
        <div className="w-64 flex-shrink-0 overflow-hidden">
          <div className="px-4 py-3 font-black text-sm border-b" style={{ background: '#fff', borderColor: '#E8D5C0', color: '#2E1C12' }}>
            ຂໍ້ມູນລູກຄ້າ
          </div>
          <div style={{ height: 'calc(100% - 48px)', overflowY: 'auto' }}>
            <CustomerPanel
              customer={selected ? { name: selected.name, phone: selected.phone, orders: selected.orders } : null}
              aiOn={aiOn}
              onToggleAi={() => setAiOn(v => !v)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
