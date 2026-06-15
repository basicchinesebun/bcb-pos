'use client'
import { useState } from 'react'
import { ShoppingCart, ArrowLeft, ChevronDown } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string
  name: string
  price: number
  image: string
  popular: boolean
  limited: boolean
  soldOut: boolean
}

interface CartItem {
  id: string
  name: string
  image: string
  price: number
  qty: number
}

type Step = 'browse' | 'checkout' | 'confirm'
type PayMethod = 'bcel' | 'cash'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'ກາເຟລາວ',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300',
    popular: true,
    limited: false,
    soldOut: false,
  },
  {
    id: 'm2',
    name: 'ກົ້ວຊາຍ',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=300',
    popular: false,
    limited: true,
    soldOut: false,
  },
  {
    id: 'm3',
    name: 'ຂອງຫວານ',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300',
    popular: true,
    limited: false,
    soldOut: false,
  },
  {
    id: 'm4',
    name: 'ອາຫານ',
    price: 4200,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963c96a?w=300',
    popular: false,
    limited: false,
    soldOut: false,
  },
  {
    id: 'm5',
    name: 'ເຂົ້າໜົມ',
    price: 2000,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300',
    popular: false,
    limited: true,
    soldOut: false,
  },
  {
    id: 'm6',
    name: 'ໝົດແລ້ວ',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300',
    popular: false,
    limited: false,
    soldOut: true,
  },
]

function fmtPrice(n: number) {
  return `${n.toLocaleString()} LAK`
}

// ── Screen 1: Browse ───────────────────────────────────────────────────────────
function BrowseScreen({
  cart,
  onAddToCart,
  onGoCheckout,
}: {
  cart: CartItem[]
  onAddToCart: (item: MenuItem) => void
  onGoCheckout: () => void
}) {
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const stock = 15
  const maxStock = 50
  const pct = (stock / maxStock) * 100

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        fontFamily: "'Noto Sans Lao', 'Noto Sans', sans-serif",
        maxWidth: 390,
        margin: '0 auto',
        position: 'relative',
        paddingBottom: 100,
      }}
    >
      {/* ── Top Header ── */}
      <div
        style={{
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {/* Left: logo + shop name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🍴
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888' }}>ຮ້ານອາຫານ</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Baguette Express</div>
          </div>
        </div>

        {/* Right: branch + language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              background: '#fff',
              fontSize: 12,
              color: '#444',
              cursor: 'pointer',
            }}
          >
            ສາຂາ <ChevronDown size={12} />
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              background: '#fff',
              fontSize: 12,
              color: '#444',
              cursor: 'pointer',
            }}
          >
            🇱🇦 ລາວ
          </button>
        </div>
      </div>

      {/* ── Round Banner ── */}
      <div style={{ padding: '12px 16px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            borderRadius: 16,
            padding: '14px 16px',
            color: '#fff',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
            ຮອນ Pre-order: Weekend Special
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
            <span>ປິດຮອນວັນທີ: ທ່ານມີ 15</span>
            <span>ເຫຼືອ {stock}/{maxStock} ຊິ້ນ</span>
          </div>
          {/* Progress bar */}
          <div
            style={{
              height: 6,
              background: 'rgba(255,255,255,0.3)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: '#fff',
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Menu Grid ── */}
      <div style={{ padding: '4px 16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {MENU_ITEMS.map((item) => (
            <FoodCard key={item.id} item={item} onAdd={() => onAddToCart(item)} />
          ))}
        </div>
      </div>

      {/* ── Floating Cart Button ── */}
      {cartCount > 0 && (
        <button
          onClick={onGoCheckout}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(249,115,22,0.5)',
            zIndex: 100,
          }}
        >
          <ShoppingCart size={22} color="#fff" />
          {/* badge */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#ef4444',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
            }}
          >
            {cartCount}
          </span>
        </button>
      )}
    </div>
  )
}

function FoodCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        opacity: item.soldOut ? 0.65 : 1,
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 160 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Sold out overlay */}
        {item.soldOut && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                background: '#9ca3af',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
              }}
            >
              ໝົດ
            </span>
          </div>
        )}

        {/* Badges */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {item.popular && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
              }}
            >
              🔥 ຂອດນິຍົມ
            </span>
          )}
          {item.limited && (
            <span
              style={{
                background: '#f97316',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
              }}
            >
              ⚡ ຈຳກັດ
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a', marginBottom: 4 }}>
          {item.name}
        </div>
        <div style={{ fontSize: 13, color: '#f97316', fontWeight: 700, marginBottom: 8 }}>
          {fmtPrice(item.price)}
        </div>
        <button
          disabled={item.soldOut}
          onClick={onAdd}
          style={{
            width: '100%',
            padding: '7px 0',
            borderRadius: 8,
            border: 'none',
            background: item.soldOut ? '#d1d5db' : '#f97316',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: item.soldOut ? 'not-allowed' : 'pointer',
          }}
        >
          {item.soldOut ? 'ໝົດ' : 'ເພີ່ມໃສ່ຕະກ້ອ'}
        </button>
      </div>
    </div>
  )
}

// ── Screen 2: Checkout ─────────────────────────────────────────────────────────
function CheckoutScreen({
  cart,
  onBack,
  onQtyChange,
  notes,
  setNotes,
  phone,
  setPhone,
  payMethod,
  setPayMethod,
  onConfirm,
}: {
  cart: CartItem[]
  onBack: () => void
  onQtyChange: (id: string, qty: number) => void
  notes: string
  setNotes: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  payMethod: PayMethod
  setPayMethod: (v: PayMethod) => void
  onConfirm: () => void
}) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        fontFamily: "'Noto Sans Lao', 'Noto Sans', sans-serif",
        maxWidth: 390,
        margin: '0 auto',
        paddingBottom: 32,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
        >
          <ArrowLeft size={22} color="#1a1a1a" />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>ໜ້າຊຳລະເງິນ</span>
        <span style={{ fontSize: 20 }}>🇱🇦</span>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Order items section */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#1a1a1a' }}>
            ສະຖານການສັ່ງຊື
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                />
                {/* Name */}
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{item.name}</div>
                {/* Qty dropdown */}
                <select
                  value={item.qty}
                  onChange={(e) => onQtyChange(item.id, Number(e.target.value))}
                  style={{
                    padding: '4px 6px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 13,
                    background: '#fff',
                    cursor: 'pointer',
                    color: '#1a1a1a',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {/* Price */}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f97316', minWidth: 70, textAlign: 'right' }}>
                  {fmtPrice(item.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <span style={{ fontSize: 14, color: '#555' }}>ລວມລາຄາ</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>{fmtPrice(total)}</span>
          </div>
        </div>

        {/* Input fields */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <input
            type="text"
            placeholder="ໂນດ"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              fontSize: 14,
              color: '#1a1a1a',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <input
            type="tel"
            placeholder="ເບີໂທລະສັບ"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              fontSize: 14,
              color: '#1a1a1a',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Payment method */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#1a1a1a' }}>
            ວິທີຊຳລະ
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* BCEL */}
            <button
              onClick={() => setPayMethod('bcel')}
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: 12,
                border: `2px solid ${payMethod === 'bcel' ? '#f43f5e' : '#e5e7eb'}`,
                background: payMethod === 'bcel' ? '#fff1f3' : '#fff',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>🏦</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: payMethod === 'bcel' ? '#f43f5e' : '#555',
                  lineHeight: 1.4,
                }}
              >
                ຊຳລະດ້ວຍນີ້ຜ່ານ BCEL OnePay
              </div>
            </button>

            {/* Cash */}
            <button
              onClick={() => setPayMethod('cash')}
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: 12,
                border: `2px solid ${payMethod === 'cash' ? '#f43f5e' : '#e5e7eb'}`,
                background: payMethod === 'cash' ? '#fff1f3' : '#fff',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>💵</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: payMethod === 'cash' ? '#f43f5e' : '#555',
                  lineHeight: 1.4,
                }}
              >
                ຊຳລະເມື່ອຮັບເຄື່ອງ (ເງິນສົດ)
              </div>
            </button>
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={onConfirm}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #f43f5e, #ef4444)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(244,63,94,0.35)',
          }}
        >
          ຢືນຢັນການສັ່ງຊື
        </button>
      </div>
    </div>
  )
}

// ── Screen 3: Confirm ──────────────────────────────────────────────────────────
function ConfirmScreen({
  cart,
  onBack,
}: {
  cart: CartItem[]
  onBack: () => void
}) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const queueCode = '#LAO789'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        fontFamily: "'Noto Sans Lao', 'Noto Sans', sans-serif",
        maxWidth: 390,
        margin: '0 auto',
        paddingBottom: 40,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
        >
          <ArrowLeft size={22} color="#1a1a1a" />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>ຢືນຢັນການສັ່ງຊື</span>
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        {/* Success title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>ສັ່ງຊື້ສຳເລັດແລ້ວ!</div>
        </div>

        {/* Queue number box */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '20px 16px',
            textAlign: 'center',
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>ລະຫັດການສັ່ງຊື</div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#1a1a1a',
              letterSpacing: 2,
            }}
          >
            {queueCode}
          </div>
        </div>

        {/* Order breakdown */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  color: '#444',
                }}
              >
                <span>
                  {item.qty} {item.name}
                </span>
                <span>{fmtPrice(item.price * item.qty)}</span>
              </div>
            ))}

            {/* Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15,
                fontWeight: 800,
                color: '#1a1a1a',
                paddingTop: 10,
                borderTop: '1px solid #f0f0f0',
                marginTop: 4,
              }}
            >
              <span>ລວມ</span>
              <span>{fmtPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#888',
            padding: '12px 0',
          }}
        >
          ກະລຸນາບັນທຶກ/ຖ່າຍຮູບໃຫ້ດ້ວຍ 📸
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ShopClient({ shop }: { shop: string }) {
  void shop

  const [step, setStep] = useState<Step>('browse')
  const [cart, setCart] = useState<CartItem[]>([])
  const [payMethod, setPayMethod] = useState<PayMethod>('bcel')
  const [notes, setNotes] = useState('')
  const [phone, setPhone] = useState('')

  function handleAddToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [
        ...prev,
        { id: item.id, name: item.name, image: item.image, price: item.price, qty: 1 },
      ]
    })
  }

  function handleQtyChange(id: string, qty: number) {
    if (qty === 0) {
      setCart((prev) => prev.filter((i) => i.id !== id))
    } else {
      setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)))
    }
  }

  function handleConfirm() {
    setStep('confirm')
  }

  function handleBack() {
    if (step === 'checkout') setStep('browse')
    else if (step === 'confirm') setStep('browse')
  }

  if (step === 'browse') {
    return (
      <BrowseScreen
        cart={cart}
        onAddToCart={handleAddToCart}
        onGoCheckout={() => setStep('checkout')}
      />
    )
  }

  if (step === 'checkout') {
    return (
      <CheckoutScreen
        cart={cart}
        onBack={handleBack}
        onQtyChange={handleQtyChange}
        notes={notes}
        setNotes={setNotes}
        phone={phone}
        setPhone={setPhone}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        onConfirm={handleConfirm}
      />
    )
  }

  return <ConfirmScreen cart={cart} onBack={handleBack} />
}
