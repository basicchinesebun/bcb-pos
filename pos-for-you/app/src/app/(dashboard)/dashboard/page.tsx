'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Bell, ChevronDown, Search, Filter, Edit2, MoreVertical, Plus } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Language {
  flag: string
  name: string
  code: string
}

interface InventoryItem {
  id: string
  name: string
  unit: string
  stock: number
}

interface MenuItem {
  id: string
  name: string
  price: string
  category: string
  image: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const LANGUAGES: Language[] = [
  { flag: '🇱🇦', name: 'ລາວ',    code: 'lo' },
  { flag: '🇹🇭', name: 'ไทย',   code: 'th' },
  { flag: '🇬🇧', name: 'English', code: 'en' },
  { flag: '🇨🇳', name: '中文',   code: 'zh' },
]

const REVENUE_DATA = [
  { day: 'Mon', value: 45000 },
  { day: 'Tue', value: 62000 },
  { day: 'Wed', value: 38000 },
  { day: 'Thu', value: 95000 },
  { day: 'Fri', value: 168000 },
  { day: 'Sat', value: 142000 },
  { day: 'Sun', value: 78000 },
]

const INVENTORY_FINISHED: InventoryItem[] = [
  { id: 'i1', name: 'Product Name 1',   unit: '2.5 kg',   stock: 12 },
  { id: 'i2', name: 'Chicken Ranue 2',  unit: '5 piece',  stock: 7  },
  { id: 'i3', name: 'Product Vanue 3',  unit: '1 bag',    stock: 3  },
]

const INVENTORY_RAW: InventoryItem[] = [
  { id: 'r1', name: 'All-Purpose Flour', unit: '10 kg',  stock: 4  },
  { id: 'r2', name: 'Pork Filling',      unit: '5 kg',   stock: 2  },
  { id: 'r3', name: 'Sesame Seeds',      unit: '1 kg',   stock: 0  },
]

const MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Product Name',  price: '$12.00', category: 'Food', image: 'https://images.unsplash.com/photo-1563379091339-03246963c96a?w=200' },
  { id: 'm2', name: 'Fresh Drink',   price: '$3.00',  category: 'Food', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200' },
  { id: 'm3', name: 'Board Break',   price: '$7.00',  category: 'Food', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=200' },
  { id: 'm4', name: 'Chicken Pam...', price: '$16.00', category: 'Food', image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=200' },
  { id: 'm5', name: 'Product Name',  price: '$12.00', category: 'Food', image: 'https://images.unsplash.com/photo-1563379091339-03246963c96a?w=200' },
  { id: 'm6', name: 'Fresh Drink',   price: '$3.00',  category: 'Food', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200' },
  { id: 'm7', name: 'Board Break',   price: '$7.00',  category: 'Food', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=200' },
  { id: 'm8', name: 'Chicken Pam...', price: '$16.00', category: 'Food', image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=200' },
]

const MENU_CATEGORIES = ['All', 'Food', 'Drinks', 'Desserts']

// ── Revenue Chart (pure SVG) ───────────────────────────────────────────────────

function RevenueChart() {
  const width = 480
  const height = 200
  const paddingLeft = 50
  const paddingRight = 16
  const paddingTop = 16
  const paddingBottom = 32

  const chartW = width - paddingLeft - paddingRight
  const chartH = height - paddingTop - paddingBottom

  const maxVal = 200000
  const yTicks = [0, 50000, 100000, 150000, 200000]

  const points = REVENUE_DATA.map((d, i) => {
    const x = paddingLeft + (i / (REVENUE_DATA.length - 1)) * chartW
    const y = paddingTop + chartH - (d.value / maxVal) * chartH
    return { x, y, ...d }
  })

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaPath =
    `M ${points[0].x} ${paddingTop + chartH} ` +
    points.map(p => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x} ${paddingTop + chartH} Z`

  function formatY(val: number) {
    if (val === 0) return '0'
    return `${val / 1000}k`
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* Horizontal grid lines */}
      {yTicks.map(tick => {
        const y = paddingTop + chartH - (tick / maxVal) * chartH
        return (
          <line
            key={tick}
            x1={paddingLeft}
            y1={y}
            x2={paddingLeft + chartW}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 4"
          />
        )
      })}

      {/* Y-axis labels */}
      {yTicks.map(tick => {
        const y = paddingTop + chartH - (tick / maxVal) * chartH
        return (
          <text
            key={tick}
            x={paddingLeft - 6}
            y={y + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.4)"
            fontSize={10}
          >
            {formatY(tick)}
          </text>
        )
      })}

      {/* Fill area */}
      <path d={areaPath} fill="rgba(59,130,246,0.1)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map(p => (
        <circle key={p.day} cx={p.x} cy={p.y} r={4} fill="#3b82f6" stroke="#1e3a5f" strokeWidth={2} />
      ))}

      {/* X-axis labels */}
      {points.map(p => (
        <text
          key={p.day}
          x={p.x}
          y={height - 6}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={10}
        >
          {p.day}
        </text>
      ))}
    </svg>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeLang, setActiveLang] = useState<Language>(LANGUAGES[2])
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [activeInvTab, setActiveInvTab] = useState<'finished' | 'raw'>('finished')
  const [menuCategory, setMenuCategory] = useState('All')
  const [invSearch, setInvSearch] = useState('')
  const [menuSearch, setMenuSearch] = useState('')

  const inventoryItems = activeInvTab === 'finished' ? INVENTORY_FINISHED : INVENTORY_RAW

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    const matchCat = menuCategory === 'All' || item.category === menuCategory
    const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ background: 'var(--main-bg)', minHeight: '100vh', padding: '24px' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-col)', margin: 0 }}>
          Dashboard
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangMenu(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-col)',
                borderRadius: '8px',
                color: 'var(--text-col)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <span>{activeLang.flag}</span>
              <span>{activeLang.name}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted-col)' }} />
            </button>

            {showLangMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-col)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  zIndex: 100,
                  minWidth: '140px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setActiveLang(lang); setShowLangMenu(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 14px',
                      background: activeLang.code === lang.code ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-col)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bell icon with badge */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-col)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-col)',
              }}
            >
              <Bell size={18} />
            </button>
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '999px',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}
            >
              1
            </span>
          </div>
        </div>
      </div>

      {/* ── Top section: KPIs + Revenue Chart ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'stretch' }}>

        {/* KPI 2x2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: '0 0 auto', width: '420px' }}>

          {/* Today's Revenue */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-col)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>$34.60</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{"Today's Revenue"}</p>
          </div>

          {/* Orders */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-col)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>237</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Orders</p>
          </div>

          {/* Stock Alerts */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-col)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444', margin: '0 0 4px 0' }}>13</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Stock Alerts</p>
          </div>

          {/* Pre-order Count */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-col)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>20</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Pre-order Count</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-col)',
            borderRadius: '12px',
            padding: '20px',
            flex: 1,
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-col)', margin: 0 }}>
              Daily Revenue (Last 7 Days)
            </p>
            <button
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-col)',
                borderRadius: '6px',
                color: 'var(--text-muted-col)',
                cursor: 'pointer',
              }}
            >
              Jun 8 – Jun 14
            </button>
          </div>
          <RevenueChart />
        </div>
      </div>

      {/* ── Bottom section: Inventory + Menu ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* ── Left panel: Inventory Management ──────────────────────────────── */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-col)',
            borderRadius: '12px',
            flex: '0 0 55%',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 20px 0 20px' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-col)', margin: '0 0 16px 0' }}>
              Inventory Management
            </p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-col)' }}>
              {(['finished', 'raw'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveInvTab(tab)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeInvTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                    color: activeInvTab === tab ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: activeInvTab === tab ? 600 : 400,
                    marginBottom: '-1px',
                  }}
                >
                  {tab === 'finished' ? 'Finished Goods' : 'Raw Materials'}
                </button>
              ))}
            </div>
          </div>

          {/* Search + Filter */}
          <div style={{ padding: '16px 20px', display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
                placeholder="Search inventory..."
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 30px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-col)',
                  borderRadius: '8px',
                  color: 'var(--text-col)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-col)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <Filter size={13} />
              Filter
            </button>
          </div>

          {/* Table rows */}
          <div>
            {inventoryItems
              .filter(item => item.name.toLowerCase().includes(invSearch.toLowerCase()))
              .map((item, idx, arr) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    borderTop: '1px solid var(--border-col)',
                  }}
                >
                  {/* Thumbnail placeholder */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: '#1e3a5f',
                      flexShrink: 0,
                    }}
                  />

                  {/* Name + unit */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-col)', margin: '0 0 2px 0' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                      {item.unit}
                    </p>
                  </div>

                  {/* Stock value */}
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-col)', margin: 0, flexShrink: 0 }}>
                    {item.stock}
                  </p>

                  {/* Restock button */}
                  <button
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      border: '1px solid var(--border-col)',
                      borderRadius: '8px',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    Restock
                  </button>

                  {/* Edit icon */}
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                  >
                    <Edit2 size={15} />
                  </button>

                  {/* More icon */}
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                  >
                    <MoreVertical size={15} />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* ── Right panel: Menu Management ──────────────────────────────────── */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-col)',
            borderRadius: '12px',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 20px 16px 20px',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-col)', margin: 0 }}>
              Menu Management
            </p>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#e05a2b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <Plus size={14} />
              Add Menu Item
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '0 20px 14px 20px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                placeholder="Search menu..."
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 30px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-col)',
                  borderRadius: '8px',
                  color: 'var(--text-col)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '8px', padding: '0 20px 16px 20px', flexWrap: 'wrap' }}>
            {MENU_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setMenuCategory(cat)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  border: menuCategory === cat ? 'none' : '1px solid var(--border-col)',
                  background: menuCategory === cat ? '#3b82f6' : 'transparent',
                  color: menuCategory === cat ? '#fff' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: menuCategory === cat ? 600 : 400,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Food card grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '0 20px 20px 20px',
            }}
          >
            {filteredMenuItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-col)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {/* Food image */}
                <div style={{ position: 'relative', width: '100%', height: '120px', background: '#1e3a5f' }}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    unoptimized
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                {/* Info */}
                <div style={{ padding: '10px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-col)', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#f97316', margin: '0 0 8px 0' }}>
                    {item.price}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                        fontWeight: 500,
                      }}
                    >
                      {item.category}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(34,197,94,0.12)',
                        color: '#4ade80',
                        fontWeight: 500,
                      }}
                    >
                      Stock
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
