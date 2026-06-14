'use client'
import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Plus, Minus, Trash2, Printer, CreditCard, Search, Languages, X } from 'lucide-react'
import { CartItem, MenuItem, Category, Lang, I18nText, t, LANGS } from '@/types/app'

// ── Mock data (replace with Supabase later) ──────────────────────────────────
const MOCK_CATEGORIES: Category[] = [
  { id: 'all', name: { en: 'All', lo: 'ທັງໝົດ', th: 'ทั้งหมด', zh: '全部' }, sort_order: 0 },
  { id: 'food', name: { en: 'Food', lo: 'ອາຫານ', th: 'อาหาร', zh: '食物' }, sort_order: 1 },
  { id: 'drinks', name: { en: 'Drinks', lo: 'ເຄື່ອງດື່ມ', th: 'เครื่องดื่ม', zh: '饮料' }, sort_order: 2 },
  { id: 'desserts', name: { en: 'Desserts', lo: 'ຂອງຫວານ', th: 'ของหวาน', zh: '甜点' }, sort_order: 3 },
]

const MOCK_ITEMS: MenuItem[] = [
  { id: '1', category_id: 'food', name: { en: 'Mango Sticky Rice', lo: 'ເຂົ້າໜຽວມະມ່ວງ', th: 'ข้าวเหนียวมะม่วง', zh: '芒果糯米饭' }, image_urls: ['https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=300'], base_price: 12, is_available_walkin: true, is_available_preorder: true, is_bestseller: true, tags: [], is_active: true },
  { id: '2', category_id: 'drinks', name: { en: 'Fresh Orange Juice', lo: 'ນ້ຳໝາກກ້ຽງສົດ', th: 'น้ำส้มคั้นสด', zh: '鲜榨橙汁' }, image_urls: ['https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300'], base_price: 13, is_available_walkin: true, is_available_preorder: false, is_bestseller: false, tags: [], is_active: true },
  { id: '3', category_id: 'food', name: { en: 'French Baguette', lo: 'ເຂົ້າຈີ່ຝຣັ່ງ', th: 'ขนมปังฝรั่งเศส', zh: '法式长棍' }, image_urls: ['https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=300'], base_price: 77, is_available_walkin: true, is_available_preorder: true, is_bestseller: false, tags: ['limited'], is_active: true },
  { id: '4', category_id: 'food', name: { en: 'Chicken Pasta', lo: 'ພາສຕ້າໄກ່', th: 'พาสต้าไก่', zh: '鸡肉意面' }, image_urls: ['https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=300'], base_price: 16, is_available_walkin: true, is_available_preorder: false, is_bestseller: false, tags: [], is_active: true },
  { id: '5', category_id: 'food', name: { en: 'Fried Rice', lo: 'ເຂົ້າຜັດ', th: 'ข้าวผัด', zh: '炒饭' }, image_urls: ['https://images.unsplash.com/photo-1516901121982-4ba8a7c68534?w=300'], base_price: 12, is_available_walkin: true, is_available_preorder: false, is_bestseller: false, tags: [], is_active: true },
  { id: '6', category_id: 'drinks', name: { en: 'Iced Latte', lo: 'ລາເຕເຢັນ', th: 'ลาเต้เย็น', zh: '冰拿铁' }, image_urls: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300'], base_price: 5, is_available_walkin: true, is_available_preorder: false, is_bestseller: false, tags: [], is_active: true },
  { id: '7', category_id: 'food', name: { en: 'Chicken Nuggets', lo: 'ນັກເກັດໄກ່', th: 'ชิ้นไก่ทอด', zh: '鸡块' }, image_urls: ['https://images.unsplash.com/photo-1562802378-063ec186a863?w=300'], base_price: 16, is_available_walkin: true, is_available_preorder: false, is_bestseller: false, tags: [], is_active: true },
  { id: '8', category_id: 'food', name: { en: 'Honeydew Melon Tea', lo: 'ຊາໝາກມ', th: 'ชาแตงไทย', zh: '哈密瓜奶茶' }, image_urls: [], base_price: 73, is_available_walkin: false, is_available_preorder: false, is_bestseller: false, tags: [], is_active: false },
  { id: '9', category_id: 'desserts', name: { en: 'Chocolate Cake', lo: 'ເຄັກຊັອກໂກແລັດ', th: 'เค้กช็อกโกแลต', zh: '巧克力蛋糕' }, image_urls: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300'], base_price: 18, is_available_walkin: true, is_available_preorder: true, is_bestseller: true, tags: ['popular'], is_active: true },
  { id: '10', category_id: 'drinks', name: { en: 'Bubble Tea', lo: 'ຊານົມໄຂ່ມຸກ', th: 'ชานมไข่มุก', zh: '珍珠奶茶' }, image_urls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300'], base_price: 9, is_available_walkin: true, is_available_preorder: false, is_bestseller: false, tags: [], is_active: true },
  { id: '11', category_id: 'food', name: { en: 'Steamed Bun', lo: 'ຊາລາເປົ່າ', th: 'ซาลาเปา', zh: '馒头' }, image_urls: ['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=300'], base_price: 10, is_available_walkin: true, is_available_preorder: true, is_bestseller: false, tags: [], is_active: true },
  { id: '12', category_id: 'food', name: { en: 'Beef Noodle', lo: 'ເຝີ', th: 'เฝอ', zh: '牛肉河粉' }, image_urls: ['https://images.unsplash.com/photo-1563379091339-03246963c96a?w=300'], base_price: 15, is_available_walkin: true, is_available_preorder: false, is_bestseller: false, tags: [], is_active: true },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(amount: number, currency = 'USD') {
  if (currency === 'LAK') return `${(amount * 8300).toLocaleString()} ₭`
  return `$${amount.toFixed(2)}`
}

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ item, lang, onAdd }: { item: MenuItem; lang: Lang; onAdd: () => void }) {
  const name = t(item.name, lang)
  const nameSub = item.name.lo && lang !== 'lo' ? item.name.lo : undefined
  const outOfStock = !item.is_active || !item.is_available_walkin
  const img = item.image_urls[0]

  return (
    <div
      className={`product-card relative flex flex-col ${outOfStock ? 'opacity-70' : ''}`}
      onClick={() => !outOfStock && onAdd()}
    >
      {/* Image */}
      <div className="relative h-28 bg-slate-800 overflow-hidden">
        {img
          ? <Image src={img} alt={name} fill className="object-cover" unoptimized />
          : <div className="w-full h-full flex items-center justify-center">
              <span className="text-slate-600 text-xs">No image</span>
            </div>
        }
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {item.is_bestseller && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">🔥</span>
          )}
          {item.tags.includes('limited') && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">⚡</span>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Out of Stock</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-2 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[var(--text-col)] text-xs font-semibold leading-tight line-clamp-1">{name}</p>
          {nameSub && <p className="text-[var(--text-muted-col)] text-[10px] leading-tight">{nameSub}</p>}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-orange-400 text-sm font-bold">{formatPrice(item.base_price)}</span>
          {!outOfStock && (
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-2 py-0.5 text-xs font-bold transition-colors"
              onClick={(e) => { e.stopPropagation(); onAdd() }}
            >+ Add</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Cart ─────────────────────────────────────────────────────────────────────
function CartSidebar({
  cart, lang, onUpdate, onRemove, onClear, currency
}: {
  cart: CartItem[]
  lang: Lang
  onUpdate: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onClear: () => void
  currency: string
}) {
  const [discount, setDiscount] = useState('')
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountAmt = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmt)

  return (
    <div className="card-bg flex flex-col h-full border-l" style={{ borderColor: 'var(--border-col)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-theme">
        <h3 className="text-[var(--text-col)] font-semibold text-sm">
          {lang === 'lo' ? 'ສັ່ງໃນປັດຈຸບັນ' : lang === 'th' ? 'รายการปัจจุบัน' : lang === 'zh' ? '当前订单' : 'Current order'}
        </h3>
        {cart.length > 0 && (
          <button onClick={onClear} className="text-slate-500 hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <ShoppingCartEmpty />
            <p className="text-xs mt-2">
              {lang === 'lo' ? 'ກະຕ່າຍວ່າງ' : lang === 'th' ? 'ตะกร้าว่าง' : 'Cart is empty'}
            </p>
          </div>
        ) : cart.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-700 shrink-0">
              {item.image_url
                ? <Image src={item.image_url} alt={t(item.name, lang)} fill className="object-cover" unoptimized />
                : <div className="w-full h-full bg-slate-700" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-col)] text-xs font-medium leading-tight line-clamp-1">
                {t(item.name, lang)}
              </p>
              <p className="text-orange-400 text-xs font-semibold">{formatPrice(item.price * item.quantity, currency)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => item.quantity > 1 ? onUpdate(item.id, item.quantity - 1) : onRemove(item.id)}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
              >
                {item.quantity === 1 ? <Trash2 size={10} /> : <Minus size={10} />}
              </button>
              <span className="text-[var(--text-col)] text-xs w-5 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdate(item.id, item.quantity + 1)}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {cart.length > 0 && (
        <div className="px-3 py-3 border-t-theme space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted-col)]">Order Total</span>
            <span className="text-[var(--text-col)] font-bold">{formatPrice(total, currency)}</span>
          </div>

          {/* Discount */}
          <input
            type="number"
            placeholder="Discount"
            value={discount}
            onChange={e => setDiscount(e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded-lg border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-col)', color: 'var(--text-col)' }}
          />

          {/* BCEL OnePay */}
          <button className="w-full py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: 'var(--cta-primary)' }}>
            <CreditCard size={15} />
            Charge (BCEL OnePay)
          </button>

          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all active:scale-95">
              Cash
            </button>
            <button className="flex-1 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95">
              <Printer size={12} /> Print
            </button>
          </div>

          <button onClick={onClear} className="w-full text-center text-xs text-slate-500 hover:text-red-400 transition-colors">
            Clear Order
          </button>
        </div>
      )}
    </div>
  )
}

function ShoppingCartEmpty() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

// ── Language Switcher ─────────────────────────────────────────────────────────
function LanguageSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const [open, setOpen] = useState(false)
  const current = LANGS.find(l => l.code === lang)!
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: 'var(--active-bg)', color: 'var(--text-col)' }}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <Languages size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl border"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-col)' }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { onChange(l.code); setOpen(false) }}
              className={`flex items-center gap-2 px-4 py-2.5 w-full text-left text-xs hover:bg-white/10 transition-colors ${lang === l.code ? 'text-orange-400 font-semibold' : ''}`}
              style={{ color: lang === l.code ? '#f97316' : 'var(--text-col)' }}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main POS Page ─────────────────────────────────────────────────────────────
export default function POSPage() {
  const [lang, setLang] = useState<Lang>('en')
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  const filteredItems = useMemo(() => {
    return MOCK_ITEMS.filter(item => {
      const matchCat = selectedCat === 'all' || item.category_id === selectedCat
      const matchSearch = !search || Object.values(item.name).some(v =>
        v?.toLowerCase().includes(search.toLowerCase())
      )
      return matchCat && matchSearch
    })
  }, [selectedCat, search])

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === item.id)
      if (existing) return prev.map(c => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, {
        id: `${item.id}-${Date.now()}`,
        menu_item_id: item.id,
        name: item.name,
        price: item.base_price,
        quantity: 1,
        image_url: item.image_urls[0],
      }]
    })
  }

  function updateQty(id: string, qty: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: qty } : c))
  }

  function removeItem(id: string) {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Menu area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b-theme">
          <h1 className="text-[var(--text-col)] font-bold text-lg flex-1">
            {lang === 'lo' ? 'ເມນູ' : lang === 'th' ? 'เมนู' : lang === 'zh' ? '菜单' : 'Menu'}
          </h1>
          {totalItems > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20">
              <span className="text-orange-400 text-xs font-bold">🛒 {totalItems}</span>
            </div>
          )}
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 rounded-lg text-xs w-36 border"
              style={{ background: 'var(--active-bg)', borderColor: 'var(--border-col)', color: 'var(--text-col)' }}
            />
          </div>
          <LanguageSwitcher lang={lang} onChange={setLang} />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 py-2.5 border-b-theme overflow-x-auto">
          {MOCK_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCat === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'text-[var(--text-muted-col)] hover:text-[var(--text-col)]'
              }`}
              style={selectedCat !== cat.id ? { background: 'var(--active-bg)' } : {}}
            >
              {t(cat.name, lang)}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredItems.map(item => (
              <ProductCard
                key={item.id}
                item={item}
                lang={lang}
                onAdd={() => addToCart(item)}
              />
            ))}
          </div>
          {filteredItems.length === 0 && (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              No items found
            </div>
          )}
        </div>
      </div>

      {/* ── Cart sidebar ──────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col" style={{ borderLeft: '1px solid var(--border-col)' }}>
        <CartSidebar
          cart={cart}
          lang={lang}
          onUpdate={updateQty}
          onRemove={removeItem}
          onClear={() => setCart([])}
          currency="USD"
        />
      </div>
    </div>
  )
}
