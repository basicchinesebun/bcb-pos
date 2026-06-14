'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  ShoppingCart, Plus, Minus, ChevronDown, CheckCircle,
  Upload, Phone, User, MessageSquare, X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string
  nameLo: string
  nameEn: string
  price: number
  image: string
  stock: number       // remaining units
  maxStock: number    // original max for display
  popular: boolean
  limited: boolean
}

interface RoundInfo {
  id: string
  label: string
  pickupTime: string
  deadline: string
  status: 'open' | 'closed'
}

interface CartItem extends MenuItem {
  qty: number
  notes: string
}

type Step = 'browse' | 'cart' | 'confirm'
type PayMethod = 'bcel' | 'later'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const SHOP_INFO = {
  name: 'Basic Chinese Bun',
  nameLo: 'ເບຊິກ ຈີນ ເຂົ້າໜົມ',
  tagline: 'ເຂົ້າໜົມຈີນແທ້ · Authentic Chinese Buns',
  coverGradient: 'from-orange-600 via-red-700 to-amber-800',
  isOpen: true,
  logoText: 'BCB',
}

const ROUNDS: RoundInfo[] = [
  { id: 'r1', label: 'ຮອບທ່ຽງ · Morning',   pickupTime: '08:00–10:00', deadline: 'Order by 22:00 tonight', status: 'open'   },
  { id: 'r2', label: 'ຮອບບ່າຍ · Afternoon', pickupTime: '13:00–15:00', deadline: 'Order by 10:00 tomorrow', status: 'open'   },
]

const MENU: MenuItem[] = [
  { id: 'm1', nameLo: 'ເຂົ້າໜົມຊີ້ນໝູ',  nameEn: 'BBQ Pork Bun',       price: 2.50, image: '', stock: 28, maxStock: 100, popular: true,  limited: false },
  { id: 'm2', nameLo: 'ເຂົ້າໜົມໄຂ່',      nameEn: 'Custard Bun',         price: 2.00, image: '', stock: 15, maxStock: 80,  popular: true,  limited: true  },
  { id: 'm3', nameLo: 'ເຂົ້າໜົມຖົ່ວ',      nameEn: 'Red Bean Bun',        price: 1.80, image: '', stock: 42, maxStock: 60,  popular: false, limited: false },
  { id: 'm4', nameLo: 'ເຂົ້າໜົມດອກບົວ',   nameEn: 'Lotus Paste Bun',     price: 2.20, image: '', stock: 0,  maxStock: 50,  popular: false, limited: false },
  { id: 'm5', nameLo: 'ລູກຊີ່ງ',           nameEn: 'Sesame Ball',         price: 1.50, image: '', stock: 8,  maxStock: 40,  popular: true,  limited: true  },
  { id: 'm6', nameLo: 'ຂ້າວໜົມຜັກກາດ',    nameEn: 'Pan-Fried Turnip Cake',price:2.80, image: '', stock: 22, maxStock: 30,  popular: false, limited: false },
]

// Pastel gradient backgrounds per item (used as image fallback)
const CARD_GRADIENTS = [
  'from-amber-100 to-orange-200',
  'from-yellow-100 to-amber-200',
  'from-orange-100 to-red-200',
  'from-rose-100 to-pink-200',
  'from-amber-200 to-yellow-100',
  'from-orange-200 to-amber-100',
]

// Food emojis for visual interest
const FOOD_EMOJIS = ['🥟', '🧆', '🍡', '🥮', '🍘', '🍱']

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtPrice(n: number) { return `$${n.toFixed(2)}` }

function StockIndicator({ stock, maxStock }: { stock: number; maxStock: number }) {
  if (stock === 0) return null
  const pct = stock / maxStock
  if (pct > 0.3) return null   // plenty in stock, don't show
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      {stock} left
    </span>
  )
}

// ── Food Card ─────────────────────────────────────────────────────────────────
function FoodCard({
  item,
  idx,
  qty,
  onAdd,
  onMinus,
}: {
  item: MenuItem
  idx: number
  qty: number
  onAdd: () => void
  onMinus: () => void
}) {
  const soldOut = item.stock === 0

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-md transition-transform ${
        soldOut ? 'opacity-60' : 'hover:shadow-xl hover:-translate-y-0.5'
      }`}
      style={{ background: 'white', border: '1px solid #fde8c8' }}
    >
      {/* Image / Gradient placeholder */}
      <div className={`relative h-44 w-full bg-gradient-to-br ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]} flex items-center justify-center`}>
        {item.image ? (
          <Image src={item.image} alt={item.nameEn} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
        ) : (
          <span className="text-6xl select-none" role="img" aria-label={item.nameEn}>
            {FOOD_EMOJIS[idx % FOOD_EMOJIS.length]}
          </span>
        )}

        {/* Sold out overlay */}
        {soldOut && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm px-3 py-1 rounded-full bg-gray-700">
              Sold Out
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.popular && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-sm">
              🔥 Popular
            </span>
          )}
          {item.limited && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
              ⚡ Limited
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        <p className="font-bold text-sm leading-tight text-gray-900">{item.nameLo}</p>
        <p className="text-xs text-gray-500 mb-2 leading-tight">{item.nameEn}</p>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-extrabold text-orange-500">{fmtPrice(item.price)}</p>
            <StockIndicator stock={item.stock} maxStock={item.maxStock} />
          </div>

          {/* Qty controls / Add button */}
          {!soldOut && (
            qty === 0 ? (
              <button
                onClick={onAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                style={{ background: '#f97316' }}
              >
                <Plus size={13} /> Add
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onMinus}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-orange-500 border-2 border-orange-300 transition-colors active:bg-orange-50"
                >
                  <Minus size={13} />
                </button>
                <span className="w-5 text-center text-sm font-bold text-gray-900">{qty}</span>
                <button
                  onClick={onAdd}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all active:scale-95"
                  style={{ background: '#f97316' }}
                >
                  <Plus size={13} />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Order Sheet (slides up from bottom) ──────────────────────────────────────
function OrderSheet({
  cart,
  roundLabel,
  onClose,
  onQtyChange,
  onNoteChange,
  onSubmit,
}: {
  cart: CartItem[]
  roundLabel: string
  onClose: () => void
  onQtyChange: (id: string, delta: number) => void
  onNoteChange: (id: string, note: string) => void
  onSubmit: (form: { name: string; phone: string; notes: string; payMethod: PayMethod; slip?: File }) => void
}) {
  const [name, setName]           = useState('')
  const [phone, setPhone]         = useState('')
  const [notes, setNotes]         = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('bcel')
  const [slip, setSlip]           = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  function handleSlip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSlip(file)
    setSlipPreview(URL.createObjectURL(file))
  }

  function handleSubmit() {
    onSubmit({ name, phone, notes, payMethod, slip: slip ?? undefined })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', background: 'white', maxWidth: 480, margin: '0 auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Your Order</h3>
            <p className="text-xs text-gray-500">{roundLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {/* Cart items */}
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-start gap-3">
                {/* Emoji thumb */}
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl shrink-0">
                  {FOOD_EMOJIS[MENU.findIndex(m => m.id === item.id) % FOOD_EMOJIS.length]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 leading-tight">{item.nameLo}</p>
                  <p className="text-xs text-gray-500 mb-1">{fmtPrice(item.price)} each</p>
                  <input
                    type="text"
                    placeholder="Special notes (optional)"
                    value={item.notes}
                    onChange={e => onNoteChange(item.id, e.target.value)}
                    className="w-full text-xs px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-700 placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onQtyChange(item.id, -1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-orange-500 border-2 border-orange-200"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                  <button
                    onClick={() => onQtyChange(item.id, 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                    style={{ background: '#f97316' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Customer info */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-gray-800">Your Details</h4>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="relative">
              <MessageSquare size={14} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                placeholder="Order notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 placeholder-gray-400 resize-none"
              />
            </div>
          </div>

          {/* Payment */}
          <div>
            <h4 className="font-bold text-sm text-gray-800 mb-3">Payment</h4>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'bcel' as PayMethod, label: 'BCEL OnePay', icon: '🏦', sub: 'Upload slip' },
                { key: 'later' as PayMethod, label: 'Pay at Pickup', icon: '💵', sub: 'Cash / Transfer' },
              ]).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setPayMethod(opt.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                    payMethod === opt.key
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className={`text-xs font-bold ${payMethod === opt.key ? 'text-orange-600' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-400">{opt.sub}</span>
                </button>
              ))}
            </div>

            {/* Slip upload */}
            {payMethod === 'bcel' && (
              <div className="mt-3">
                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-orange-300 rounded-2xl cursor-pointer hover:bg-orange-50 transition-colors">
                  {slipPreview ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slipPreview} alt="Payment slip" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="text-orange-400" />
                      <span className="text-xs text-orange-500 font-semibold">Upload Payment Slip</span>
                      <span className="text-[10px] text-gray-400">PNG, JPG up to 10MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleSlip} />
                </label>
              </div>
            )}
          </div>

          {/* Order total */}
          <div className="rounded-2xl p-4 bg-orange-50 border border-orange-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {cart.reduce((s, i) => s + i.qty, 0)} items
              </span>
              <span className="text-xl font-extrabold text-orange-600">{fmtPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !phone.trim() || (payMethod === 'bcel' && !slip)}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            Place Order · {fmtPrice(total)}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Confirmation Screen ────────────────────────────────────────────────────────
function ConfirmScreen({
  queueNum,
  cart,
  total,
  customer,
  onDone,
}: {
  queueNum: string
  cart: CartItem[]
  total: number
  customer: string
  onDone: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: '#fef9f0' }}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
      >
        {/* Check animation */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          <CheckCircle size={48} className="text-white" strokeWidth={2.5} />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Order Placed!</h2>
        <p className="text-gray-500 text-sm mb-6">ສັ່ງຊື້ສຳເລັດ · Thank you, {customer}!</p>

        {/* Queue number */}
        <div
          className="rounded-3xl px-10 py-6 mb-6 shadow-lg w-full"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          <p className="text-sm font-semibold text-orange-100 mb-1">Queue Number / ໝາຍເລກຄິວ</p>
          <p className="text-6xl font-black text-white tracking-tight">{queueNum}</p>
          <p className="text-xs text-orange-200 mt-2">Please arrive during your pickup window</p>
        </div>

        {/* Order summary */}
        <div className="w-full bg-white rounded-2xl p-4 mb-5 shadow-sm border border-orange-100 text-left">
          <p className="font-bold text-sm text-gray-800 mb-3">Order Summary</p>
          <div className="space-y-1 mb-3">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.qty}× {item.nameEn}</span>
                <span className="text-gray-800 font-semibold">{fmtPrice(item.qty * item.price)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-extrabold text-base pt-2 border-t border-gray-100">
            <span className="text-gray-900">Total</span>
            <span className="text-orange-500">{fmtPrice(total)}</span>
          </div>
        </div>

        {/* Track message */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <span className="text-lg">📲</span>
          We&apos;ll notify you when your order is ready.
        </div>

        <button
          onClick={onDone}
          className="w-full py-3 rounded-2xl font-bold text-orange-600 border-2 border-orange-400 transition-all active:scale-95 hover:bg-orange-50"
        >
          Order More
        </button>
      </div>
    </div>
  )
}

// ── Main Public Shop Page ──────────────────────────────────────────────────────
export default function ShopPage({ params }: { params: { shop: string } }) {
  const [selectedRound, setSelectedRound]   = useState(ROUNDS[0])
  const [showRoundPicker, setShowRoundPicker] = useState(false)
  const [cart, setCart]                     = useState<CartItem[]>([])
  const [step, setStep]                     = useState<Step>('browse')
  const [queueNum, setQueueNum]             = useState('')
  const [confirmedCart, setConfirmedCart]   = useState<CartItem[]>([])
  const [confirmedCustomer, setConfirmedCustomer] = useState('')

  // Suppress unused param lint — slug will be used for real API calls
  void params.shop

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  function getQty(id: string) {
    return cart.find(i => i.id === id)?.qty ?? 0
  }

  function handleAdd(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1, notes: '' }]
    })
  }

  function handleMinus(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (!existing) return prev
      if (existing.qty === 1) return prev.filter(i => i.id !== item.id)
      return prev.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  function handleQtyChange(id: string, delta: number) {
    setCart(prev => {
      const existing = prev.find(i => i.id === id)
      if (!existing) return prev
      const newQty = existing.qty + delta
      if (newQty <= 0) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, qty: newQty } : i)
    })
  }

  function handleNoteChange(id: string, note: string) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, notes: note } : i))
  }

  function handleSubmit(form: { name: string; phone: string; notes: string; payMethod: PayMethod; slip?: File }) {
    // In production: POST to API with form data
    void form
    const num = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')
    setQueueNum(`#${num}`)
    setConfirmedCart([...cart])
    setConfirmedCustomer(form.name)
    setStep('confirm')
    setCart([])
  }

  function handleDone() {
    setStep('browse')
    setConfirmedCart([])
    setConfirmedCustomer('')
    setQueueNum('')
  }

  if (step === 'confirm') {
    return (
      <ConfirmScreen
        queueNum={queueNum}
        cart={confirmedCart}
        total={confirmedCart.reduce((s, i) => s + i.qty * i.price, 0)}
        customer={confirmedCustomer}
        onDone={handleDone}
      />
    )
  }

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: '#fef9f0', fontFamily: "'Noto Sans Lao', sans-serif" }}
    >
      {/* Max width container — mobile-first centered */}
      <div className="max-w-md mx-auto relative">

        {/* ── Hero Header ──────────────────────────────────────────────── */}
        <div className={`relative h-52 bg-gradient-to-br ${SHOP_INFO.coverGradient} flex flex-col items-center justify-center overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full bg-white/5" />

          {/* Logo badge */}
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-3 relative z-10">
            <span className="text-xl font-black text-orange-500">{SHOP_INFO.logoText}</span>
          </div>

          <h1 className="text-xl font-extrabold text-white relative z-10 text-center px-4 leading-tight">
            {SHOP_INFO.name}
          </h1>
          <p className="text-sm text-white/80 mt-0.5 relative z-10">{SHOP_INFO.tagline}</p>

          {/* Status badge */}
          <div className="mt-3 relative z-10">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full shadow ${
                SHOP_INFO.isOpen
                  ? 'bg-green-400 text-green-900'
                  : 'bg-red-400 text-red-900'
              }`}
            >
              {SHOP_INFO.isOpen ? '● Open Now' : '● Closed'}
            </span>
          </div>
        </div>

        {/* ── Round Selector ────────────────────────────────────────────── */}
        <div className="px-4 py-3 bg-white border-b border-orange-100 sticky top-0 z-20 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">Select pickup round / ເລືອກຮອບ</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ROUNDS.map(round => (
              <button
                key={round.id}
                onClick={() => setSelectedRound(round)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border-2 text-left transition-all ${
                  selectedRound.id === round.id
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <p className={`text-xs font-bold ${selectedRound.id === round.id ? 'text-orange-600' : 'text-gray-700'}`}>
                  {round.label}
                </p>
                <p className="text-[10px] text-gray-400">⏱ {round.pickupTime}</p>
                <p className="text-[10px] text-gray-400">{round.deadline}</p>
              </button>
            ))}
          </div>
          {/* Dropdown toggle (for mobile with many rounds) */}
          <button
            className="hidden items-center gap-1 text-xs text-orange-500 font-semibold mt-1"
            onClick={() => setShowRoundPicker(v => !v)}
          >
            Change round <ChevronDown size={12} />
          </button>
          {showRoundPicker && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl shadow-lg border border-orange-100 z-30 overflow-hidden">
              {ROUNDS.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setSelectedRound(r); setShowRoundPicker(false) }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-orange-50 border-b border-gray-100 last:border-0"
                >
                  <span className="font-semibold text-gray-800">{r.label}</span>
                  <span className="ml-2 text-gray-400 text-xs">{r.pickupTime}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Menu Grid ─────────────────────────────────────────────────── */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900 text-base">ລາຍການ <span className="text-gray-400 font-normal text-sm">Menu</span></h2>
            <span className="text-xs text-gray-400">{MENU.filter(m => m.stock > 0).length} available</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MENU.map((item, idx) => (
              <FoodCard
                key={item.id}
                item={item}
                idx={idx}
                qty={getQty(item.id)}
                onAdd={() => handleAdd(item)}
                onMinus={() => handleMinus(item)}
              />
            ))}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-12" />
      </div>

      {/* ── Floating Cart Bar ─────────────────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
          <button
            onClick={() => setStep('cart')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl shadow-2xl text-white font-bold transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center relative">
                <ShoppingCart size={16} />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-orange-500 text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{fmtPrice(cartTotal)}</span>
              <span className="text-white/70 text-sm">View Order →</span>
            </div>
          </button>
        </div>
      )}

      {/* ── Order Sheet ───────────────────────────────────────────────── */}
      {step === 'cart' && (
        <OrderSheet
          cart={cart}
          roundLabel={`${selectedRound.label} · ${selectedRound.pickupTime}`}
          onClose={() => setStep('browse')}
          onQtyChange={handleQtyChange}
          onNoteChange={handleNoteChange}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
