'use client'

import { useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2, Image as ImageIcon, ChevronDown, X, Check } from 'lucide-react'
import { MenuItem, Category, Lang, I18nText, t, LANGS } from '@/types/app'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_CATEGORIES: Category[] = [
  { id: 'food',     name: { en: 'Food',     lo: 'ອາຫານ',      th: 'อาหาร',      zh: '食物' }, sort_order: 1 },
  { id: 'drinks',   name: { en: 'Drinks',   lo: 'ເຄື່ອງດື່ມ', th: 'เครื่องดื่ม', zh: '饮料' }, sort_order: 2 },
  { id: 'desserts', name: { en: 'Desserts', lo: 'ຂອງຫວານ',    th: 'ของหวาน',    zh: '甜点' }, sort_order: 3 },
]

const INITIAL_ITEMS: MenuItem[] = [
  {
    id: '1', category_id: 'food',
    name: { en: 'Steamed Bun', lo: 'ຊາລາເປົ່າ', th: 'ซาลาเปา', zh: '馒头' },
    image_urls: ['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400'],
    base_price: 10, is_available_walkin: true, is_available_preorder: true,
    is_bestseller: true, tags: [], is_active: true,
  },
  {
    id: '2', category_id: 'food',
    name: { en: 'Beef Noodle', lo: 'ເຝີ', th: 'เฝอ', zh: '牛肉河粉' },
    image_urls: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400'],
    base_price: 15, is_available_walkin: true, is_available_preorder: false,
    is_bestseller: false, tags: ['limited'], is_active: true,
  },
  {
    id: '3', category_id: 'food',
    name: { en: 'Chicken Pasta', lo: 'ພາສຕ້າໄກ່', th: 'พาสต้าไก่', zh: '鸡肉意面' },
    image_urls: ['https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400'],
    base_price: 16, is_available_walkin: true, is_available_preorder: false,
    is_bestseller: false, tags: [], is_active: true,
  },
  {
    id: '4', category_id: 'food',
    name: { en: 'Fried Rice', lo: 'ເຂົ້າຜັດ', th: 'ข้าวผัด', zh: '炒饭' },
    image_urls: ['https://images.unsplash.com/photo-1516901121982-4ba8a7c68534?w=400'],
    base_price: 12, is_available_walkin: true, is_available_preorder: false,
    is_bestseller: false, tags: [], is_active: false,
  },
  {
    id: '5', category_id: 'drinks',
    name: { en: 'Iced Latte', lo: 'ລາເຕເຢັນ', th: 'ลาเต้เย็น', zh: '冰拿铁' },
    image_urls: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'],
    base_price: 5, is_available_walkin: true, is_available_preorder: false,
    is_bestseller: false, tags: [], is_active: true,
  },
  {
    id: '6', category_id: 'drinks',
    name: { en: 'Bubble Tea', lo: 'ຊານົມໄຂ່ມຸກ', th: 'ชานมไข่มุก', zh: '珍珠奶茶' },
    image_urls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    base_price: 9, is_available_walkin: true, is_available_preorder: true,
    is_bestseller: true, tags: [], is_active: true,
  },
  {
    id: '7', category_id: 'desserts',
    name: { en: 'Chocolate Cake', lo: 'ເຄັກຊັອກໂກແລັດ', th: 'เค้กช็อกโกแลต', zh: '巧克力蛋糕' },
    image_urls: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'],
    base_price: 18, is_available_walkin: true, is_available_preorder: true,
    is_bestseller: true, tags: [], is_active: true,
  },
  {
    id: '8', category_id: 'desserts',
    name: { en: 'Mango Sticky Rice', lo: 'ເຂົ້າໜຽວມະມ່ວງ', th: 'ข้าวเหนียวมะม่วง', zh: '芒果糯米饭' },
    image_urls: ['https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400'],
    base_price: 12, is_available_walkin: true, is_available_preorder: true,
    is_bestseller: false, tags: ['limited'], is_active: true,
  },
]

// ── Types ──────────────────────────────────────────────────────────────────────
type TabId = 'all' | string

interface FormState {
  name: I18nText
  category_id: string
  base_price: string
  is_available_walkin: boolean
  is_available_preorder: boolean
  is_bestseller: boolean
  is_active: boolean
  image_preview: string
}

const EMPTY_FORM: FormState = {
  name: { lo: '', th: '', en: '', zh: '' },
  category_id: 'food',
  base_price: '',
  is_available_walkin: true,
  is_available_preorder: false,
  is_bestseller: false,
  is_active: true,
  image_preview: '',
}

// ── Toggle Switch ──────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  size = 'md',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  size?: 'sm' | 'md'
}) {
  const w = size === 'sm' ? 32 : 40
  const h = size === 'sm' ? 18 : 22
  const dot = size === 'sm' ? 12 : 16
  const offset = size === 'sm' ? 3 : 3

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: w,
        height: h,
        borderRadius: h,
        background: checked ? 'var(--cta-primary)' : 'var(--border-col)',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
      aria-checked={checked}
      role="switch"
    >
      <span
        style={{
          position: 'absolute',
          top: offset,
          left: checked ? w - dot - offset : offset,
          width: dot,
          height: dot,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          display: 'block',
        }}
      />
    </button>
  )
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────────
function DeleteDialog({
  item,
  onConfirm,
  onCancel,
}: {
  item: MenuItem
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(220,38,38,0.15)' }}
          >
            <Trash2 size={18} style={{ color: 'var(--cta-danger)' }} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-col)' }}>
              Delete Item
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
              This action cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted-col)' }}>
          Are you sure you want to delete{' '}
          <span className="font-semibold" style={{ color: 'var(--text-col)' }}>
            {item.name.en || item.name.lo}
          </span>
          ?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'var(--active-bg)',
              color: 'var(--text-muted-col)',
              border: '1px solid var(--border-col)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'var(--cta-danger)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add / Edit Modal ───────────────────────────────────────────────────────────
function ItemModal({
  editItem,
  categories,
  onSave,
  onClose,
}: {
  editItem: MenuItem | null
  categories: Category[]
  onSave: (form: FormState, id?: string) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!editItem) return EMPTY_FORM
    return {
      name: { ...editItem.name },
      category_id: editItem.category_id ?? 'food',
      base_price: String(editItem.base_price),
      is_available_walkin: editItem.is_available_walkin,
      is_available_preorder: editItem.is_available_preorder,
      is_bestseller: editItem.is_bestseller,
      is_active: editItem.is_active,
      image_preview: editItem.image_urls[0] ?? '',
    }
  })
  const [nameLang, setNameLang] = useState<Lang>('lo')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, image_preview: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  function setName(lang: Lang, val: string) {
    setForm((f) => ({ ...f, name: { ...f.name, [lang]: val } }))
  }

  function handleSave() {
    onSave(form, editItem?.id)
  }

  const isEdit = !!editItem

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-col)' }}
        >
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-col)' }}>
            {isEdit ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--active-bg)', color: 'var(--text-muted-col)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted-col)' }}>
              ITEM IMAGE
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative rounded-xl overflow-hidden cursor-pointer flex items-center justify-center transition-all"
              style={{
                height: 160,
                border: '2px dashed var(--border-col)',
                background: 'var(--main-bg)',
              }}
            >
              {form.image_preview ? (
                <>
                  <Image
                    src={form.image_preview}
                    alt="preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-muted-col)' }}>
                  <ImageIcon size={28} />
                  <span className="text-xs">Click to upload image</span>
                  <span className="text-[10px]" style={{ color: 'var(--border-col)' }}>PNG, JPG up to 5MB</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {form.image_preview && (
              <button
                type="button"
                className="mt-1.5 text-xs"
                style={{ color: 'var(--cta-danger)' }}
                onClick={() => setForm((f) => ({ ...f, image_preview: '' }))}
              >
                Remove image
              </button>
            )}
          </div>

          {/* Name (multilingual tabs) */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted-col)' }}>
              ITEM NAME
            </label>
            {/* Lang tabs */}
            <div className="flex mb-2" style={{ borderBottom: '1px solid var(--border-col)' }}>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setNameLang(l.code)}
                  className="px-3 py-1.5 text-xs font-semibold transition-all relative"
                  style={{
                    color: nameLang === l.code ? 'var(--cta-primary)' : 'var(--text-muted-col)',
                    borderBottom: nameLang === l.code ? '2px solid var(--cta-primary)' : '2px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.name[nameLang] ?? ''}
              onChange={(e) => setName(nameLang, e.target.value)}
              placeholder={`Name in ${LANGS.find((l) => l.code === nameLang)?.label}...`}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--main-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
              }}
            />
            {/* Inline indicators */}
            <div className="flex gap-3 mt-1.5">
              {LANGS.map((l) => (
                <span
                  key={l.code}
                  className="text-[10px] flex items-center gap-0.5"
                  style={{ color: form.name[l.code] ? 'var(--cta-success)' : 'var(--text-muted-col)' }}
                >
                  {form.name[l.code] ? <Check size={10} /> : null}
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {/* Category + Price row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted-col)' }}>
                CATEGORY
              </label>
              <div className="relative">
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                  style={{
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-col)',
                    color: 'var(--text-col)',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} style={{ background: 'var(--card-bg)' }}>
                      {cat.name.en}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted-col)' }}
                />
              </div>
            </div>

            {/* Base price */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted-col)' }}>
                BASE PRICE (USD)
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: 'var(--text-muted-col)' }}
                >
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.base_price}
                  onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-col)',
                    color: 'var(--text-col)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)' }}
          >
            {(
              [
                { key: 'is_available_walkin',   label: 'Walk-in Available',    sub: 'Show on counter POS' },
                { key: 'is_available_preorder',  label: 'Pre-order Available',  sub: 'Show in online pre-order' },
                { key: 'is_bestseller',          label: 'Bestseller',           sub: 'Shows 🔥 badge on card' },
                { key: 'is_active',              label: 'Active',               sub: 'Hidden from all menus if off' },
              ] as { key: keyof FormState; label: string; sub: string }[]
            ).map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-col)' }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted-col)' }}>
                    {sub}
                  </p>
                </div>
                <Toggle
                  checked={form[key] as boolean}
                  onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-col)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'var(--active-bg)',
              color: 'var(--text-muted-col)',
              border: '1px solid var(--border-col)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'var(--cta-primary)' }}
          >
            {isEdit ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Menu Item Card ─────────────────────────────────────────────────────────────
function MenuItemCard({
  item,
  categories,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: MenuItem
  categories: Category[]
  onEdit: () => void
  onDelete: () => void
  onToggle: (field: 'is_available_walkin' | 'is_available_preorder' | 'is_active', val: boolean) => void
}) {
  const img = item.image_urls[0]
  const catName = categories.find((c) => c.id === item.category_id)?.name.en ?? ''

  // Category pill colors
  const catColor =
    item.category_id === 'food'
      ? { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' }
      : item.category_id === 'drinks'
      ? { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' }
      : { bg: 'rgba(167,139,250,0.15)', color: '#c4b5fd' }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col transition-all"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-col)',
        opacity: item.is_active ? 1 : 0.65,
      }}
    >
      {/* Image */}
      <div className="relative h-36 flex-shrink-0" style={{ background: 'var(--main-bg)' }}>
        {img ? (
          <Image src={img} alt={item.name.en ?? ''} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <ImageIcon size={22} style={{ color: 'var(--border-col)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted-col)' }}>
              No image
            </span>
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-2 left-2 flex gap-1">
          {item.is_bestseller && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
            >
              🔥 Best
            </span>
          )}
          {item.tags.includes('limited') && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}
            >
              ⚡ Limited
            </span>
          )}
        </div>

        {/* Inactive overlay */}
        {!item.is_active && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#94a3b8' }}
            >
              Inactive
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Name + category */}
        <div>
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <p className="text-sm font-bold leading-tight line-clamp-1" style={{ color: 'var(--text-col)' }}>
              {item.name.en || item.name.lo}
            </p>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: catColor.bg, color: catColor.color }}
            >
              {catName}
            </span>
          </div>
          {item.name.lo && item.name.lo !== item.name.en && (
            <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted-col)' }}>
              {item.name.lo}
            </p>
          )}
        </div>

        {/* Price */}
        <p className="text-base font-bold" style={{ color: 'var(--cta-primary)' }}>
          ${item.base_price.toFixed(2)}
        </p>

        {/* Availability toggles */}
        <div
          className="rounded-lg px-2.5 py-2 space-y-1.5"
          style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px]" style={{ color: 'var(--text-muted-col)' }}>
              Walk-in
            </span>
            <Toggle
              size="sm"
              checked={item.is_available_walkin}
              onChange={(v) => onToggle('is_available_walkin', v)}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px]" style={{ color: 'var(--text-muted-col)' }}>
              Pre-order
            </span>
            <Toggle
              size="sm"
              checked={item.is_available_preorder}
              onChange={(v) => onToggle('is_available_preorder', v)}
            />
          </div>
        </div>

        {/* Active toggle + actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {/* Active status toggle */}
          <button
            type="button"
            onClick={() => onToggle('is_active', !item.is_active)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex-1"
            style={{
              background: item.is_active ? 'rgba(22,163,74,0.12)' : 'rgba(100,116,139,0.12)',
              color: item.is_active ? 'var(--cta-success)' : 'var(--text-muted-col)',
              border: `1px solid ${item.is_active ? 'rgba(22,163,74,0.3)' : 'var(--border-col)'}`,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: item.is_active ? 'var(--cta-success)' : 'var(--text-muted-col)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {item.is_active ? 'Active' : 'Inactive'}
          </button>

          {/* Edit */}
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--cta-primary)' }}
            title="Edit"
          >
            <Edit2 size={14} />
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--cta-danger)' }}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(INITIAL_ITEMS)
  const [categories] = useState<Category[]>(MOCK_CATEGORIES)
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)

  // Item counts per category
  const countFor = (catId: string) =>
    catId === 'all' ? items.length : items.filter((i) => i.category_id === catId).length

  // Filtered list
  const filtered = useMemo(
    () => (activeTab === 'all' ? items : items.filter((i) => i.category_id === activeTab)),
    [items, activeTab]
  )

  // Save (add or update)
  function handleSave(form: FormState, id?: string) {
    if (id) {
      // Edit
      setItems((prev) =>
        prev.map((item) =>
          item.id !== id
            ? item
            : {
                ...item,
                name: form.name,
                category_id: form.category_id,
                base_price: parseFloat(form.base_price) || 0,
                is_available_walkin: form.is_available_walkin,
                is_available_preorder: form.is_available_preorder,
                is_bestseller: form.is_bestseller,
                is_active: form.is_active,
                image_urls: form.image_preview ? [form.image_preview] : item.image_urls,
              }
        )
      )
    } else {
      // Add
      const newItem: MenuItem = {
        id: String(Date.now()),
        category_id: form.category_id,
        name: form.name,
        image_urls: form.image_preview ? [form.image_preview] : [],
        base_price: parseFloat(form.base_price) || 0,
        is_available_walkin: form.is_available_walkin,
        is_available_preorder: form.is_available_preorder,
        is_bestseller: form.is_bestseller,
        tags: [],
        is_active: form.is_active,
      }
      setItems((prev) => [...prev, newItem])
    }
    setModalOpen(false)
    setEditItem(null)
  }

  function handleToggle(
    itemId: string,
    field: 'is_available_walkin' | 'is_available_preorder' | 'is_active',
    val: boolean
  ) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, [field]: val } : i)))
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleteTarget(null)
  }

  function openAdd() {
    setEditItem(null)
    setModalOpen(true)
  }

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditItem(null)
  }

  const allTabs: { id: TabId; label: string; labelLo: string }[] = [
    { id: 'all', label: 'All', labelLo: 'ທັງໝົດ' },
    ...categories.map((c) => ({ id: c.id, label: c.name.en ?? '', labelLo: c.name.lo ?? '' })),
  ]

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: 'var(--main-bg)', color: 'var(--text-col)' }}
    >
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              ເມນູ /{' '}
              <span style={{ color: 'var(--cta-primary)' }}>Menu</span>
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
              ຈັດການລາຍການອາຫານ — Manage your menu items
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Category button */}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
              }}
            >
              <Plus size={15} />
              Add Category
            </button>

            {/* Add Item button (primary) */}
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: 'var(--cta-primary)' }}
            >
              <Plus size={15} />
              Add Item
            </button>
          </div>
        </div>

        {/* ── Category Tabs ── */}
        <div
          className="flex gap-0 mb-6 overflow-x-auto"
          style={{ borderBottom: '1px solid var(--border-col)' }}
        >
          {allTabs.map((tab) => {
            const isActive = activeTab === tab.id
            const count = countFor(tab.id)
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all relative flex-shrink-0"
                style={{
                  color: isActive ? 'var(--cta-primary)' : 'var(--text-muted-col)',
                  borderBottom: isActive ? '2px solid var(--cta-primary)' : '2px solid transparent',
                  marginBottom: -1,
                  background: 'transparent',
                }}
              >
                {tab.label}
                <span
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={{
                    background: isActive ? 'rgba(249,115,22,0.18)' : 'var(--active-bg)',
                    color: isActive ? 'var(--cta-primary)' : 'var(--text-muted-col)',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Grid ── */}
        {filtered.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {filtered.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                categories={categories}
                onEdit={() => openEdit(item)}
                onDelete={() => setDeleteTarget(item)}
                onToggle={(field, val) => handleToggle(item.id, field, val)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
            >
              <ImageIcon size={28} style={{ color: 'var(--text-muted-col)' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text-col)' }}>
                No items yet
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
                Add your first menu item to get started.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'var(--cta-primary)' }}
            >
              <Plus size={15} />
              Add Item
            </button>
          </div>
        )}

        {/* Bottom spacer */}
        <div style={{ height: 32 }} />
      </div>

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <ItemModal
          editItem={editItem}
          categories={categories}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <DeleteDialog
          item={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
