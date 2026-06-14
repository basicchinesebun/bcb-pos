'use client'

import { useState } from 'react'
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Users,
  Calendar,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type DateRange = 'today' | '7days' | '30days' | 'custom'

// ── Mock Data ─────────────────────────────────────────────────────────────────
const TOP_ITEMS = [
  { id: 1, name: 'Steamed Bun', nameLo: 'ຊາລາເປົ່າ', category: 'Food', qty: 184, revenue: 1840 },
  { id: 2, name: 'Mango Sticky Rice', nameLo: 'ເຂົ້າໜຽວມະມ່ວງ', category: 'Desserts', qty: 142, revenue: 1704 },
  { id: 3, name: 'Chocolate Cake', nameLo: 'ເຄັກຊັອກໂກແລັດ', category: 'Desserts', qty: 118, revenue: 2124 },
  { id: 4, name: 'Iced Latte', nameLo: 'ລາເຕເຢັນ', category: 'Drinks', qty: 97, revenue: 485 },
  { id: 5, name: 'Bubble Tea', nameLo: 'ຊານົມໄຂ່ມຸກ', category: 'Drinks', qty: 89, revenue: 801 },
  { id: 6, name: 'Beef Noodle', nameLo: 'ເຝີ', category: 'Food', qty: 76, revenue: 1140 },
  { id: 7, name: 'Chicken Pasta', nameLo: 'ພາສຕ້າໄກ່', category: 'Food', qty: 63, revenue: 1008 },
  { id: 8, name: 'Fried Rice', nameLo: 'ເຂົ້າຜັດ', category: 'Food', qty: 58, revenue: 696 },
  { id: 9, name: 'Fresh Orange Juice', nameLo: 'ນ້ຳໝາກກ້ຽງສົດ', category: 'Drinks', qty: 52, revenue: 676 },
  { id: 10, name: 'Chicken Nuggets', nameLo: 'ນັກເກັດໄກ່', category: 'Food', qty: 44, revenue: 704 },
]

const DAILY_REVENUE = [
  { day: 'Mon', date: 'Jun 8', revenue: 1240 },
  { day: 'Tue', date: 'Jun 9', revenue: 1580 },
  { day: 'Wed', date: 'Jun 10', revenue: 1420 },
  { day: 'Thu', date: 'Jun 11', revenue: 1890 },
  { day: 'Fri', date: 'Jun 12', revenue: 2140 },
  { day: 'Sat', date: 'Jun 13', revenue: 1960 },
  { day: 'Sun', date: 'Jun 14', revenue: 1234 },
]

const ORDER_STATUS = [
  { label: 'Done', labelLo: 'ສຳເລັດ', count: 38, color: '#16a34a' },
  { label: 'Confirmed', labelLo: 'ຢືນຢັນ', count: 5, color: '#3b82f6' },
  { label: 'Pending', labelLo: 'ລໍຖ້າ', count: 4, color: '#eab308' },
  { label: 'Rejected', labelLo: 'ປະຕິເສດ', count: 1, color: '#dc2626' },
]

const PAYMENT_METHODS = [
  { label: 'Cash', labelLo: 'ເງິນສົດ', pct: 58, color: '#16a34a' },
  { label: 'BCEL OnePay', labelLo: 'ບີຊີແອລ', pct: 34, color: '#3b82f6' },
  { label: 'Other', labelLo: 'ອື່ນໆ', pct: 8, color: '#a855f7' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtK(n: number) {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k'
  return '$' + n
}

const totalRevenue = TOP_ITEMS.reduce((s, i) => s + i.revenue, 0)
const maxDayRevenue = Math.max(...DAILY_REVENUE.map((d) => d.revenue))
const totalStatusCount = ORDER_STATUS.reduce((s, o) => s + o.count, 0)

// ── Rank badge ────────────────────────────────────────────────────────────────
function Rank({ rank }: { rank: number }) {
  let bg = 'var(--card-bg)'
  let color = 'var(--text-muted-col)'
  let border = '1px solid var(--border-col)'
  if (rank === 1) { bg = 'linear-gradient(135deg,#fbbf24,#f59e0b)'; color = '#1c1100'; border = 'none' }
  if (rank === 2) { bg = 'linear-gradient(135deg,#cbd5e1,#94a3b8)'; color = '#1e293b'; border = 'none' }
  if (rank === 3) { bg = 'linear-gradient(135deg,#fb923c,#c2410c)'; color = '#fff'; border = 'none' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700,
      background: bg, color, border, flexShrink: 0,
    }}>
      {rank}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [range, setRange] = useState<DateRange>('today')
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  const rangeLabels: Record<DateRange, string> = {
    today: 'ມື້ນີ້ / Today',
    '7days': '7 ມື້ / 7 Days',
    '30days': '30 ມື້ / 30 Days',
    custom: 'ກຳນົດເອງ / Custom',
  }

  return (
    <div
      className="min-h-screen p-6 overflow-y-auto"
      style={{ background: 'var(--main-bg)', color: 'var(--text-col)' }}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-col)' }}>
            ລາຍງານ / <span style={{ color: 'var(--cta-primary)' }}>Reports</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
            ພາບລວມການຂາຍ — Sales overview
          </p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={15} style={{ color: 'var(--text-muted-col)' }} />
          {(['today', '7days', '30days', 'custom'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid var(--border-col)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: range === r ? 'var(--cta-primary)' : 'var(--card-bg)',
                color: range === r ? '#fff' : 'var(--text-muted-col)',
              }}
            >
              {r === 'today' ? 'Today' : r === '7days' ? '7 Days' : r === '30days' ? '30 Days' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* Total Revenue */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted-col)' }}>
                ລາຍຮັບທັງໝົດ / Total Revenue
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-col)' }}>$1,234.50</p>
              <span
                className="inline-flex items-center gap-1 text-xs mt-1.5 px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(22,163,74,0.15)', color: '#4ade80' }}
              >
                <TrendingUp size={11} /> +12% vs yesterday
              </span>
            </div>
            <div
              className="rounded-lg p-2.5 flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.15)' }}
            >
              <DollarSign size={20} style={{ color: 'var(--cta-primary)' }} />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted-col)' }}>
                ຄຳສັ່ງທັງໝົດ / Total Orders
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-col)' }}>48</p>
              <span
                className="inline-flex items-center gap-1 text-xs mt-1.5 px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
              >
                <TrendingUp size={11} /> +5% vs yesterday
              </span>
            </div>
            <div
              className="rounded-lg p-2.5 flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.15)' }}
            >
              <ShoppingBag size={20} style={{ color: '#60a5fa' }} />
            </div>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted-col)' }}>
                ສະເລ່ຍຕໍ່ຄຳສັ່ງ / Avg Order Value
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-col)' }}>$25.72</p>
              <span
                className="inline-flex items-center gap-1 text-xs mt-1.5 px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}
              >
                <TrendingUp size={11} /> +7% vs yesterday
              </span>
            </div>
            <div
              className="rounded-lg p-2.5 flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.15)' }}
            >
              <BarChart3 size={20} style={{ color: 'var(--cta-primary)' }} />
            </div>
          </div>
        </div>

        {/* Walk-in vs Pre-order */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted-col)' }}>
                ໜ້າຮ້ານ vs ສັ່ງລ່ວງໜ້າ / Walk-in vs Pre-order
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-col)' }}>35</span>
                <span style={{ color: 'var(--text-muted-col)' }}>/</span>
                <span className="text-2xl font-bold" style={{ color: '#a78bfa' }}>13</span>
              </div>
              {/* mini split bar */}
              <div className="flex mt-3 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--border-col)' }}>
                <div style={{ width: `${(35 / 48) * 100}%`, background: 'var(--cta-primary)', borderRadius: '9999px 0 0 9999px' }} />
                <div style={{ width: `${(13 / 48) * 100}%`, background: '#a78bfa', borderRadius: '0 9999px 9999px 0' }} />
              </div>
              <div className="flex gap-3 mt-1.5">
                <span className="text-xs" style={{ color: 'var(--text-muted-col)' }}>
                  <span style={{ color: 'var(--cta-primary)' }}>●</span> Walk-in 73%
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted-col)' }}>
                  <span style={{ color: '#a78bfa' }}>●</span> Pre-order 27%
                </span>
              </div>
            </div>
            <div
              className="rounded-lg p-2.5 flex items-center justify-center ml-3"
              style={{ background: 'rgba(167,139,250,0.15)' }}
            >
              <Users size={20} style={{ color: '#a78bfa' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Chart + Status + Payment ── */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

        {/* Revenue by Day Bar Chart */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)', gridColumn: 'span 2' }}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} style={{ color: 'var(--cta-primary)' }} />
            <h2 className="text-sm font-semibold">ລາຍຮັບລາຍວັນ / Revenue by Day</h2>
          </div>

          <div className="flex items-end gap-2 h-44" style={{ paddingBottom: 4 }}>
            {DAILY_REVENUE.map((d, i) => {
              const barPct = (d.revenue / maxDayRevenue) * 100
              const isHovered = hoveredBar === i
              const isToday = i === DAILY_REVENUE.length - 1
              return (
                <div
                  key={d.day}
                  className="flex flex-col items-center flex-1 h-full cursor-pointer select-none"
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#0f172a',
                        border: '1px solid var(--border-col)',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        color: 'var(--text-col)',
                        zIndex: 10,
                        marginBottom: 4,
                        pointerEvents: 'none',
                      }}
                    >
                      {d.date}: {fmt(d.revenue)}
                    </div>
                  )}

                  {/* Amount label */}
                  <span
                    className="text-xs font-semibold mb-1"
                    style={{ color: isToday ? 'var(--cta-primary)' : 'var(--text-muted-col)', fontSize: 10 }}
                  >
                    {fmtK(d.revenue)}
                  </span>

                  {/* Bar wrapper */}
                  <div className="flex-1 w-full flex items-end" style={{ minHeight: 0 }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${barPct}%`,
                        borderRadius: '6px 6px 2px 2px',
                        background: isToday
                          ? 'var(--cta-primary)'
                          : isHovered
                          ? 'rgba(249,115,22,0.6)'
                          : 'var(--active-bg)',
                        transition: 'background 0.15s, height 0.2s',
                        minHeight: 4,
                      }}
                    />
                  </div>

                  {/* Day label */}
                  <span
                    className="mt-1.5 text-xs font-medium"
                    style={{ color: isToday ? 'var(--cta-primary)' : 'var(--text-muted-col)', fontSize: 11 }}
                  >
                    {d.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={16} style={{ color: '#60a5fa' }} />
            <h2 className="text-sm font-semibold">ສະຖານະຄຳສັ່ງ / Orders by Status</h2>
          </div>

          {/* Donut visualization using stacked arcs via conic-gradient */}
          <div className="flex items-center gap-5 mb-4">
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                flexShrink: 0,
                background: `conic-gradient(
                  #16a34a 0% ${(38 / 48) * 100}%,
                  #3b82f6 ${(38 / 48) * 100}% ${((38 + 5) / 48) * 100}%,
                  #eab308 ${((38 + 5) / 48) * 100}% ${((38 + 5 + 4) / 48) * 100}%,
                  #dc2626 ${((38 + 5 + 4) / 48) * 100}% 100%
                )`,
                position: 'relative',
              }}
            >
              {/* Inner circle cutout */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'var(--card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-col)', lineHeight: 1 }}>48</span>
                <span style={{ fontSize: 8, color: 'var(--text-muted-col)' }}>orders</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2 flex-1">
              {ORDER_STATUS.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted-col)' }}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-col)', minWidth: 20, textAlign: 'right' }}>{s.count}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted-col)', minWidth: 34, textAlign: 'right' }}>
                      {Math.round((s.count / totalStatusCount) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden" style={{ height: 6 }}>
            {ORDER_STATUS.map((s) => (
              <div
                key={s.label}
                style={{ width: `${(s.count / totalStatusCount) * 100}%`, background: s.color }}
              />
            ))}
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} style={{ color: '#4ade80' }} />
            <h2 className="text-sm font-semibold">ການຊຳລະ / Payment Methods</h2>
          </div>

          <div className="flex flex-col gap-4">
            {PAYMENT_METHODS.map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-col)' }}>{p.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted-col)', marginLeft: 6 }}>{p.labelLo}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.pct}%</span>
                </div>
                {/* Bar track */}
                <div style={{ height: 8, borderRadius: 4, background: 'var(--border-col)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${p.pct}%`,
                      background: p.color,
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted-col)', marginTop: 4 }}>
                  {Math.round(1234.5 * p.pct / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of $1,234.50
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Selling Items Table ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border-col)' }}>
          <TrendingUp size={16} style={{ color: 'var(--cta-primary)' }} />
          <h2 className="text-sm font-semibold">ສິ່ງທີ່ຂາຍດີທີ່ສຸດ / Top Selling Items</h2>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--cta-primary)', fontWeight: 600 }}
          >
            Top 10
          </span>
        </div>

        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-col)' }}>
                {['#', 'Item / ລາຍການ', 'Category', 'Qty Sold', 'Revenue', '% of Total'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: h === '#' ? 'center' : 'left',
                      color: 'var(--text-muted-col)',
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_ITEMS.map((item, idx) => {
                const pct = (item.revenue / totalRevenue) * 100
                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: idx < TOP_ITEMS.length - 1 ? '1px solid var(--border-col)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Rank */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Rank rank={idx + 1} />
                    </td>

                    {/* Item name */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-col)' }}>{item.name}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted-col)', marginTop: 1 }}>{item.nameLo}</span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          background:
                            item.category === 'Food'
                              ? 'rgba(249,115,22,0.15)'
                              : item.category === 'Drinks'
                              ? 'rgba(59,130,246,0.15)'
                              : 'rgba(167,139,250,0.15)',
                          color:
                            item.category === 'Food'
                              ? '#fb923c'
                              : item.category === 'Drinks'
                              ? '#60a5fa'
                              : '#c4b5fd',
                        }}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Qty */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-col)' }}>
                      {item.qty}
                    </td>

                    {/* Revenue */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4ade80' }}>
                      {fmt(item.revenue)}
                    </td>

                    {/* % of Total */}
                    <td style={{ padding: '12px 16px', minWidth: 120 }}>
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border-col)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: idx < 3 ? 'var(--cta-primary)' : 'var(--active-bg)',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted-col)', minWidth: 32 }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ height: 24 }} />
    </div>
  )
}
