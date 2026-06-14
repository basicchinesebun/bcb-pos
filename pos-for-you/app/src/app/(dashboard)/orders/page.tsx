'use client'
import { useState, useMemo } from 'react'
import {
  Package, Search, Filter, Eye, CheckCircle, XCircle,
  Printer, Clock, User, ChevronRight, X, ShoppingBag,
  Phone, CreditCard, Banknote, AlertCircle,
} from 'lucide-react'
import { Order } from '@/types/app'

// ── Extended order type with items for detail panel ───────────────────────────
interface OrderItem {
  id: string
  name: string
  qty: number
  price: number
}

interface OrderDetail extends Order {
  items: OrderItem[]
  discount: number
  notes?: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ORDERS: OrderDetail[] = [
  {
    id: 'o1', queue_number: 'A001', order_type: 'walkin', status: 'pending',
    customer_name: 'Walk-in Customer', customer_phone: undefined,
    total: 37.00, currency: 'USD', payment_method: 'cash', payment_status: 'unpaid',
    created_at: '2026-06-14T08:05:00Z', discount: 0,
    items: [
      { id: 'i1', name: 'Mango Sticky Rice', qty: 2, price: 12 },
      { id: 'i2', name: 'Iced Latte', qty: 1, price: 5 },
      { id: 'i3', name: 'Chocolate Cake', qty: 1, price: 8 },
    ],
  },
  {
    id: 'o2', queue_number: 'B012', order_type: 'preorder', status: 'confirmed',
    customer_name: 'Somsak Phonexay', customer_phone: '+856 20 5551 0023',
    total: 54.00, currency: 'USD', payment_method: 'transfer', payment_status: 'paid',
    created_at: '2026-06-14T07:45:00Z', discount: 5,
    items: [
      { id: 'i4', name: 'French Baguette', qty: 1, price: 15 },
      { id: 'i5', name: 'Chicken Pasta', qty: 2, price: 16 },
      { id: 'i6', name: 'Fresh Orange Juice', qty: 2, price: 9 },
    ],
    notes: 'Extra spicy please',
  },
  {
    id: 'o3', queue_number: 'A002', order_type: 'walkin', status: 'preparing',
    customer_name: 'Walk-in Customer', customer_phone: undefined,
    total: 28.00, currency: 'USD', payment_method: 'card', payment_status: 'paid',
    created_at: '2026-06-14T08:20:00Z', discount: 0,
    items: [
      { id: 'i7', name: 'Beef Noodle', qty: 1, price: 15 },
      { id: 'i8', name: 'Bubble Tea', qty: 1, price: 9 },
      { id: 'i9', name: 'Steamed Bun', qty: 1, price: 4 },
    ],
  },
  {
    id: 'o4', queue_number: 'B013', order_type: 'preorder', status: 'ready',
    customer_name: 'Khamla Vongsa', customer_phone: '+856 20 9987 3312',
    total: 42.00, currency: 'USD', payment_method: 'bcel', payment_status: 'paid',
    created_at: '2026-06-14T07:30:00Z', discount: 8,
    items: [
      { id: 'i10', name: 'Fried Rice', qty: 2, price: 12 },
      { id: 'i11', name: 'Chicken Nuggets', qty: 1, price: 16 },
      { id: 'i12', name: 'Fresh Orange Juice', qty: 2, price: 10 },
    ],
  },
  {
    id: 'o5', queue_number: 'A003', order_type: 'walkin', status: 'done',
    customer_name: 'Walk-in Customer', customer_phone: undefined,
    total: 21.00, currency: 'USD', payment_method: 'cash', payment_status: 'paid',
    created_at: '2026-06-14T07:10:00Z', discount: 0,
    items: [
      { id: 'i13', name: 'Steamed Bun', qty: 2, price: 10 },
      { id: 'i14', name: 'Iced Latte', qty: 1, price: 5 },
      { id: 'i15', name: 'Mango Sticky Rice', qty: 1, price: 6 },
    ],
  },
  {
    id: 'o6', queue_number: 'B010', order_type: 'preorder', status: 'cancelled',
    customer_name: 'Bounsong Keola', customer_phone: '+856 20 2245 8891',
    total: 33.00, currency: 'USD', payment_method: 'transfer', payment_status: 'refunded',
    created_at: '2026-06-14T06:55:00Z', discount: 0,
    items: [
      { id: 'i16', name: 'Chicken Pasta', qty: 1, price: 16 },
      { id: 'i17', name: 'Chocolate Cake', qty: 1, price: 8 },
      { id: 'i18', name: 'Bubble Tea', qty: 1, price: 9 },
    ],
    notes: 'Customer cancelled',
  },
  {
    id: 'o7', queue_number: 'A004', order_type: 'walkin', status: 'confirmed',
    customer_name: 'Walk-in Customer', customer_phone: undefined,
    total: 45.00, currency: 'USD', payment_method: 'card', payment_status: 'paid',
    created_at: '2026-06-14T08:35:00Z', discount: 0,
    items: [
      { id: 'i19', name: 'French Baguette', qty: 2, price: 15 },
      { id: 'i20', name: 'Beef Noodle', qty: 1, price: 15 },
    ],
  },
  {
    id: 'o8', queue_number: 'B014', order_type: 'preorder', status: 'preparing',
    customer_name: 'Naly Douangmala', customer_phone: '+856 20 5500 6677',
    total: 67.00, currency: 'USD', payment_method: 'bcel', payment_status: 'paid',
    created_at: '2026-06-14T08:10:00Z', discount: 10,
    items: [
      { id: 'i21', name: 'Fried Rice', qty: 3, price: 12 },
      { id: 'i22', name: 'Chicken Nuggets', qty: 2, price: 16 },
      { id: 'i23', name: 'Fresh Orange Juice', qty: 3, price: 7 },
    ],
    notes: 'No onions',
  },
  {
    id: 'o9', queue_number: 'A005', order_type: 'walkin', status: 'done',
    customer_name: 'Walk-in Customer', customer_phone: undefined,
    total: 17.00, currency: 'USD', payment_method: 'cash', payment_status: 'paid',
    created_at: '2026-06-14T06:40:00Z', discount: 0,
    items: [
      { id: 'i24', name: 'Mango Sticky Rice', qty: 1, price: 12 },
      { id: 'i25', name: 'Iced Latte', qty: 1, price: 5 },
    ],
  },
  {
    id: 'o10', queue_number: 'B015', order_type: 'preorder', status: 'pending',
    customer_name: 'Phet Soulignavong', customer_phone: '+856 20 7723 4456',
    total: 29.00, currency: 'USD', payment_method: 'transfer', payment_status: 'unpaid',
    created_at: '2026-06-14T08:50:00Z', discount: 0,
    items: [
      { id: 'i26', name: 'Steamed Bun', qty: 2, price: 10 },
      { id: 'i27', name: 'Chocolate Cake', qty: 1, price: 9 },
      { id: 'i28', name: 'Bubble Tea', qty: 1, price: 10 },
    ],
  },
]

// ── Types ─────────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | Order['status']
type TypeFilter   = 'all' | 'walkin' | 'preorder'

const STATUS_TABS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'all',       label: 'All',       color: '' },
  { key: 'pending',   label: 'Pending',   color: 'text-yellow-300' },
  { key: 'confirmed', label: 'Confirmed', color: 'text-blue-300' },
  { key: 'preparing', label: 'Preparing', color: 'text-purple-300' },
  { key: 'ready',     label: 'Ready',     color: 'text-cyan-300' },
  { key: 'done',      label: 'Done',      color: 'text-green-300' },
  { key: 'cancelled', label: 'Cancelled', color: 'text-red-400' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(amount: number, currency = 'USD') {
  if (currency === 'LAK') return `${(amount * 8300).toLocaleString()} ₭`
  return `$${amount.toFixed(2)}`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function paymentIcon(method?: string) {
  if (method === 'card')     return <CreditCard size={12} className="inline mr-1 text-blue-400" />
  if (method === 'transfer') return <Banknote   size={12} className="inline mr-1 text-purple-400" />
  if (method === 'bcel')     return <CreditCard size={12} className="inline mr-1 text-cyan-400" />
  return <Banknote size={12} className="inline mr-1 text-slate-400" />
}

function paymentLabel(method?: string) {
  if (method === 'card')     return 'Card'
  if (method === 'transfer') return 'Transfer'
  if (method === 'bcel')     return 'BCEL'
  return 'Cash'
}

// ── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Order['status'] }) {
  return <span className={`status-badge status-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
}

// ── Order Detail Panel ────────────────────────────────────────────────────────
function OrderDetailPanel({
  order,
  onClose,
  onAction,
}: {
  order: OrderDetail
  onClose: () => void
  onAction: (id: string, action: 'confirm' | 'prepare' | 'ready' | 'done' | 'cancel') => void
}) {
  const subtotal = order.items.reduce((s, i) => s + i.qty * i.price, 0)

  const actions: {
    key: 'confirm' | 'prepare' | 'ready' | 'done' | 'cancel'
    label: string
    color: string
    show: boolean
  }[] = [
    {
      key: 'confirm',
      label: 'Confirm',
      color: 'bg-blue-600 hover:bg-blue-700',
      show: order.status === 'pending',
    },
    {
      key: 'prepare',
      label: 'Start Preparing',
      color: 'bg-purple-600 hover:bg-purple-700',
      show: order.status === 'confirmed',
    },
    {
      key: 'ready',
      label: 'Mark Ready',
      color: 'bg-cyan-600 hover:bg-cyan-700',
      show: order.status === 'preparing',
    },
    {
      key: 'done',
      label: 'Mark Done',
      color: 'bg-green-600 hover:bg-green-700',
      show: order.status === 'ready',
    },
    {
      key: 'cancel',
      label: 'Cancel',
      color: 'bg-red-600 hover:bg-red-700',
      show: !['done', 'cancelled'].includes(order.status),
    },
  ]

  return (
    <div
      className="h-full flex flex-col border-l overflow-hidden"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-col)', minWidth: 320, maxWidth: 380 }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-col)' }}>
        <div className="flex items-center gap-2">
          <Package size={16} className="text-orange-400" />
          <span className="font-bold text-sm" style={{ color: 'var(--text-col)' }}>
            #{order.queue_number}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-muted-col)' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Customer info */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-col)' }}>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted-col)' }}>
            Customer
          </p>
          <div className="flex items-center gap-2 mb-1">
            <User size={13} style={{ color: 'var(--text-muted-col)' }} />
            <span className="text-sm" style={{ color: 'var(--text-col)' }}>{order.customer_name || '—'}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-2">
              <Phone size={13} style={{ color: 'var(--text-muted-col)' }} />
              <span className="text-sm" style={{ color: 'var(--text-col)' }}>{order.customer_phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                order.order_type === 'walkin'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {order.order_type === 'walkin' ? 'Walk-in' : 'Pre-order'}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted-col)' }}>
              <Clock size={10} className="inline mr-1" />{formatTime(order.created_at)}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-col)' }}>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted-col)' }}>
            Items
          </p>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--active-bg)', color: 'var(--text-col)' }}
                  >
                    {item.qty}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-col)' }}>{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-orange-400">
                  {formatPrice(item.qty * item.price, order.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-col)' }}>
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: 'var(--text-muted-col)' }}>Subtotal</span>
            <span style={{ color: 'var(--text-col)' }}>{formatPrice(subtotal, order.currency)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-400">Discount</span>
              <span className="text-green-400">-{formatPrice(order.discount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t"
            style={{ borderColor: 'var(--border-col)' }}>
            <span style={{ color: 'var(--text-col)' }}>Total</span>
            <span className="text-orange-400">{formatPrice(order.total, order.currency)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-col)' }}>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted-col)' }}>
            Payment
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-col)' }}>
              {paymentIcon(order.payment_method)}
              {paymentLabel(order.payment_method)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              order.payment_status === 'paid'     ? 'bg-green-500/20 text-green-300' :
              order.payment_status === 'refunded' ? 'bg-gray-500/20 text-gray-300'  :
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-col)' }}>
            <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted-col)' }}>
              Notes
            </p>
            <div className="flex items-start gap-2">
              <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm" style={{ color: 'var(--text-col)' }}>{order.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: 'var(--border-col)' }}>
        {/* Print */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'var(--active-bg)', color: 'var(--text-col)' }}
        >
          <Printer size={14} /> Print Receipt
        </button>

        {/* Status actions */}
        <div className="flex flex-wrap gap-2">
          {actions.filter(a => a.show && a.key !== 'cancel').map(action => (
            <button
              key={action.key}
              onClick={() => onAction(order.id, action.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95 ${action.color}`}
            >
              <CheckCircle size={14} />
              {action.label}
            </button>
          ))}
          {actions.find(a => a.key === 'cancel' && a.show) && (
            <button
              onClick={() => onAction(order.id, 'cancel')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95"
            >
              <XCircle size={14} />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Orders Page ──────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders]           = useState<OrderDetail[]>(MOCK_ORDERS)
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  // Counts per status
  const counts = useMemo(() => {
    const base = orders.filter(o => {
      if (typeFilter !== 'all' && o.order_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          o.queue_number.toLowerCase().includes(q) ||
          (o.customer_name?.toLowerCase().includes(q)) ||
          o.items.some(i => i.name.toLowerCase().includes(q))
        )
      }
      return true
    })
    const result: Record<string, number> = { all: base.length }
    for (const o of base) {
      result[o.status] = (result[o.status] || 0) + 1
    }
    return result
  }, [orders, typeFilter, search])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (typeFilter !== 'all' && o.order_type !== typeFilter) return false
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          o.queue_number.toLowerCase().includes(q) ||
          (o.customer_name?.toLowerCase().includes(q)) ||
          o.items.some(i => i.name.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [orders, typeFilter, statusFilter, search])

  function handleAction(id: string, action: 'confirm' | 'prepare' | 'ready' | 'done' | 'cancel') {
    const nextStatus: Record<string, Order['status']> = {
      confirm: 'confirmed',
      prepare: 'preparing',
      ready:   'ready',
      done:    'done',
      cancel:  'cancelled',
    }
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: nextStatus[action] } : o
    ))
    setSelectedOrder(prev => prev?.id === id ? { ...prev, status: nextStatus[action] } : prev)
  }

  const typeOptions: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'All Types' },
    { key: 'walkin', label: 'Walk-in' },
    { key: 'preorder', label: 'Pre-order' },
  ]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--main-bg)' }}>
      {/* ── Left: table area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--border-col)' }}
        >
          <Package size={20} className="text-orange-400" />
          <div>
            <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--text-col)' }}>
              ออเดอร์ <span className="font-normal text-sm ml-1" style={{ color: 'var(--text-muted-col)' }}>Orders</span>
            </h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted-col)' }} />
            <input
              type="text"
              placeholder="Search queue, name, item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs w-48 border transition-colors focus:outline-none"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--border-col)',
                color: 'var(--text-col)',
              }}
            />
          </div>

          {/* Type filter */}
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border-col)', color: 'var(--text-col)' }}
            >
              <Filter size={13} style={{ color: 'var(--text-muted-col)' }} />
              {typeOptions.find(o => o.key === typeFilter)?.label}
              <ChevronRight size={12} className="rotate-90" style={{ color: 'var(--text-muted-col)' }} />
            </button>
            {showTypeDropdown && (
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl border w-36"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-col)' }}
              >
                {typeOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setTypeFilter(opt.key); setShowTypeDropdown(false) }}
                    className="flex items-center gap-2 px-4 py-2.5 w-full text-left text-xs hover:bg-white/10 transition-colors"
                    style={{ color: typeFilter === opt.key ? '#f97316' : 'var(--text-col)' }}
                  >
                    {typeFilter === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
                    {typeFilter !== opt.key && <span className="w-1.5 h-1.5 shrink-0" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status tabs */}
        <div
          className="flex items-center gap-0.5 px-4 pt-2 shrink-0 overflow-x-auto border-b"
          style={{ borderColor: 'var(--border-col)' }}
          onClick={() => setShowTypeDropdown(false)}
        >
          {STATUS_TABS.map(tab => {
            const isActive = statusFilter === tab.key
            const count = counts[tab.key] ?? 0
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isActive ? 'border-orange-500' : 'border-transparent'
                }`}
                style={{
                  color: isActive ? '#f97316' : 'var(--text-muted-col)',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : tab.key === 'all'
                          ? 'bg-white/10 text-slate-400'
                          : `status-badge status-${tab.key}`
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div
          className="flex-1 overflow-y-auto"
          onClick={() => setShowTypeDropdown(false)}
        >
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <ShoppingBag size={32} style={{ color: 'var(--text-muted-col)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted-col)' }}>No orders found</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-col)' }}>
                  {['Queue #', 'Type', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Time', ''].map(col => (
                    <th
                      key={col}
                      className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap sticky top-0"
                      style={{
                        color: 'var(--text-muted-col)',
                        background: 'var(--main-bg)',
                        borderBottom: '1px solid var(--border-col)',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => {
                  const isSelected = selectedOrder?.id === order.id
                  const itemSummary = order.items.length === 1
                    ? order.items[0].name
                    : `${order.items[0].name} +${order.items.length - 1} more`

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(isSelected ? null : order)}
                      className="cursor-pointer transition-colors"
                      style={{
                        background: isSelected
                          ? 'var(--active-bg)'
                          : idx % 2 === 0
                            ? 'transparent'
                            : 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid var(--border-col)',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      {/* Queue # */}
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-col)' }}>
                        #{order.queue_number}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          order.order_type === 'walkin'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {order.order_type === 'walkin' ? 'Walk-in' : 'Pre-order'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3" style={{ color: 'var(--text-col)' }}>
                        <div className="flex items-center gap-1.5">
                          <User size={12} style={{ color: 'var(--text-muted-col)' }} />
                          <span className="text-xs max-w-[110px] truncate">
                            {order.customer_name || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Items summary */}
                      <td className="px-4 py-3">
                        <span className="text-xs max-w-[140px] truncate block" style={{ color: 'var(--text-muted-col)' }}>
                          {itemSummary}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 font-semibold text-orange-400 whitespace-nowrap">
                        {formatPrice(order.total, order.currency)}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-col)' }}>
                          {paymentIcon(order.payment_method)}
                          {paymentLabel(order.payment_method)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3">
                        <span className="text-xs whitespace-nowrap flex items-center gap-1" style={{ color: 'var(--text-muted-col)' }}>
                          <Clock size={11} />
                          {formatTime(order.created_at)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <button
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                          style={{
                            background: isSelected ? '#f97316' : 'var(--active-bg)',
                            color: isSelected ? 'white' : 'var(--text-col)',
                          }}
                          onClick={e => { e.stopPropagation(); setSelectedOrder(isSelected ? null : order) }}
                        >
                          <Eye size={12} />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        <div
          className="px-5 py-2 border-t flex items-center gap-2 shrink-0"
          style={{ borderColor: 'var(--border-col)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted-col)' }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* ── Right: detail panel ───────────────────────────────────────────── */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={handleAction}
        />
      )}
    </div>
  )
}
