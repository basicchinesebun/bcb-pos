'use client'
import { useState } from 'react'
import {
  Plus, X, ChevronDown, ChevronUp, Clock, Calendar,
  ShoppingBag, Users, ToggleLeft, ToggleRight, Eye,
  CheckCircle, XCircle, Package, AlertCircle, ClipboardList,
  Layers,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface RoundItem {
  id: string
  name: string
  nameLo: string
  maxQty: number
  reserved: number
}

interface PreorderRound {
  id: string
  name: string
  status: 'open' | 'closed' | 'upcoming'
  pickupDate: string
  pickupTime: string
  deadline: string
  totalOrders: number
  items: RoundItem[]
}

interface RoundOrder {
  id: string
  roundId: string
  queueNum: string
  customer: string
  phone: string
  items: { name: string; qty: number; price: number }[]
  total: number
  status: 'pending' | 'confirmed' | 'rejected'
  paymentStatus: 'unpaid' | 'paid'
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MENU_OPTIONS = [
  { id: 'm1', name: 'Steamed BBQ Pork Bun', nameLo: 'ເຂົ້າໜົມຊີ້ນໝູ' },
  { id: 'm2', name: 'Custard Bun',           nameLo: 'ເຂົ້າໜົມໄຂ່' },
  { id: 'm3', name: 'Red Bean Bun',          nameLo: 'ເຂົ້າໜົມຖົ່ວ' },
  { id: 'm4', name: 'Lotus Paste Bun',       nameLo: 'ເຂົ້າໜົມດອກບົວ' },
  { id: 'm5', name: 'Sesame Ball',           nameLo: 'ລູກຊີ່ງ' },
  { id: 'm6', name: 'Pan-Fried Turnip Cake', nameLo: 'ຂ້າວໜົມຜັກກາດ' },
]

const MOCK_ROUNDS: PreorderRound[] = [
  {
    id: 'r1',
    name: 'Round 1 – Morning Batch',
    status: 'open',
    pickupDate: '2026-06-15',
    pickupTime: '08:00–10:00',
    deadline: '2026-06-14 22:00',
    totalOrders: 18,
    items: [
      { id: 'm1', name: 'Steamed BBQ Pork Bun', nameLo: 'ເຂົ້າໜົມຊີ້ນໝູ', maxQty: 100, reserved: 72 },
      { id: 'm2', name: 'Custard Bun',           nameLo: 'ເຂົ້າໜົມໄຂ່',   maxQty: 80,  reserved: 55 },
      { id: 'm3', name: 'Red Bean Bun',          nameLo: 'ເຂົ້າໜົມຖົ່ວ',   maxQty: 60,  reserved: 18 },
    ],
  },
  {
    id: 'r2',
    name: 'Round 2 – Afternoon Batch',
    status: 'upcoming',
    pickupDate: '2026-06-15',
    pickupTime: '13:00–15:00',
    deadline: '2026-06-15 10:00',
    totalOrders: 5,
    items: [
      { id: 'm4', name: 'Lotus Paste Bun',       nameLo: 'ເຂົ້າໜົມດອກບົວ', maxQty: 50,  reserved: 12 },
      { id: 'm5', name: 'Sesame Ball',           nameLo: 'ລູກຊີ່ງ',         maxQty: 40,  reserved: 8  },
      { id: 'm6', name: 'Pan-Fried Turnip Cake', nameLo: 'ຂ້າວໜົມຜັກກາດ',  maxQty: 30,  reserved: 5  },
    ],
  },
  {
    id: 'r3',
    name: 'Round 3 – Weekend Special',
    status: 'closed',
    pickupDate: '2026-06-13',
    pickupTime: '09:00–11:00',
    deadline: '2026-06-12 20:00',
    totalOrders: 34,
    items: [
      { id: 'm1', name: 'Steamed BBQ Pork Bun', nameLo: 'ເຂົ້າໜົມຊີ້ນໝູ', maxQty: 120, reserved: 120 },
      { id: 'm2', name: 'Custard Bun',           nameLo: 'ເຂົ້າໜົມໄຂ່',   maxQty: 80,  reserved: 79  },
    ],
  },
  {
    id: 'r4',
    name: 'Round 4 – Friday Lunch',
    status: 'closed',
    pickupDate: '2026-06-12',
    pickupTime: '11:30–13:30',
    deadline: '2026-06-11 21:00',
    totalOrders: 22,
    items: [
      { id: 'm3', name: 'Red Bean Bun',          nameLo: 'ເຂົ້າໜົມຖົ່ວ',   maxQty: 60, reserved: 60 },
      { id: 'm5', name: 'Sesame Ball',           nameLo: 'ລູກຊີ່ງ',         maxQty: 40, reserved: 37 },
    ],
  },
  {
    id: 'r5',
    name: 'Round 5 – Early Bird',
    status: 'closed',
    pickupDate: '2026-06-10',
    pickupTime: '07:30–09:00',
    deadline: '2026-06-09 22:00',
    totalOrders: 15,
    items: [
      { id: 'm6', name: 'Pan-Fried Turnip Cake', nameLo: 'ຂ້າວໜົມຜັກກາດ', maxQty: 30, reserved: 28 },
    ],
  },
]

const MOCK_ORDERS: RoundOrder[] = [
  {
    id: 'o1', roundId: 'r1', queueNum: 'P001', customer: 'Somsak Phonexay',
    phone: '+856 20 5551 0023',
    items: [{ name: 'Steamed BBQ Pork Bun', qty: 5, price: 2.5 }, { name: 'Custard Bun', qty: 3, price: 2.0 }],
    total: 18.5, status: 'confirmed', paymentStatus: 'paid',
  },
  {
    id: 'o2', roundId: 'r1', queueNum: 'P002', customer: 'Khamla Vongsa',
    phone: '+856 20 9987 3312',
    items: [{ name: 'Custard Bun', qty: 6, price: 2.0 }, { name: 'Red Bean Bun', qty: 4, price: 1.8 }],
    total: 19.2, status: 'pending', paymentStatus: 'unpaid',
  },
  {
    id: 'o3', roundId: 'r1', queueNum: 'P003', customer: 'Naly Douangmala',
    phone: '+856 20 5500 6677',
    items: [{ name: 'Steamed BBQ Pork Bun', qty: 10, price: 2.5 }],
    total: 25.0, status: 'confirmed', paymentStatus: 'paid',
  },
  {
    id: 'o4', roundId: 'r2', queueNum: 'P004', customer: 'Bounsong Keola',
    phone: '+856 20 2245 8891',
    items: [{ name: 'Lotus Paste Bun', qty: 4, price: 2.2 }, { name: 'Sesame Ball', qty: 4, price: 1.5 }],
    total: 14.8, status: 'pending', paymentStatus: 'unpaid',
  },
  {
    id: 'o5', roundId: 'r2', queueNum: 'P005', customer: 'Phet Soulignavong',
    phone: '+856 20 7723 4456',
    items: [{ name: 'Sesame Ball', qty: 4, price: 1.5 }],
    total: 6.0, status: 'rejected', paymentStatus: 'unpaid',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(price: number) { return `$${price.toFixed(2)}` }

function StatusBadge({ status }: { status: PreorderRound['status'] }) {
  const cfg = {
    open:     { label: 'Open',     cls: 'bg-green-500/20 text-green-300 border border-green-500/30' },
    closed:   { label: 'Closed',   cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
    upcoming: { label: 'Upcoming', cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  }[status]
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.cls}`}>{cfg.label}</span>
  )
}

function OrderStatusBadge({ status }: { status: RoundOrder['status'] }) {
  const cfg = {
    pending:   { label: 'Pending',   cls: 'bg-yellow-500/20 text-yellow-300' },
    confirmed: { label: 'Confirmed', cls: 'bg-green-500/20 text-green-300' },
    rejected:  { label: 'Rejected',  cls: 'bg-red-500/20 text-red-400' },
  }[status]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.cls}`}>{cfg.label}</span>
  )
}

// ── Quota Progress Bar ─────────────────────────────────────────────────────────
function QuotaBar({ item }: { item: RoundItem }) {
  const pct = item.maxQty > 0 ? Math.round((item.reserved / item.maxQty) * 100) : 0
  const remaining = item.maxQty - item.reserved
  const color = pct >= 90 ? '#dc2626' : pct >= 70 ? '#f97316' : '#16a34a'
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs truncate" style={{ color: 'var(--text-col)' }}>{item.nameLo}</div>
      <div className="w-24 text-xs truncate" style={{ color: 'var(--text-muted-col)' }}>{item.name}</div>
      <div className="text-xs w-10 text-right tabular-nums" style={{ color: 'var(--text-muted-col)' }}>{item.maxQty}</div>
      <div className="text-xs w-12 text-right tabular-nums" style={{ color: 'var(--text-col)' }}>{item.reserved}</div>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--active-bg)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <span className="text-xs w-10 text-right tabular-nums" style={{ color: remaining === 0 ? '#dc2626' : 'var(--text-muted-col)' }}>
          {remaining} left
        </span>
      </div>
    </div>
  )
}

// ── Round Card ─────────────────────────────────────────────────────────────────
function RoundCard({
  round,
  onToggle,
  onViewOrders,
}: {
  round: PreorderRound
  onToggle: (id: string) => void
  onViewOrders: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const totalReserved = round.items.reduce((s, i) => s + i.reserved, 0)

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-col)' }}
    >
      {/* Card header */}
      <div
        className="px-5 py-4 flex items-start justify-between gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--active-bg)' }}>
            <Layers size={16} className="text-orange-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-col)' }}>{round.name}</h3>
              <StatusBadge status={round.status} />
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted-col)' }}>
                <Calendar size={11} /> {round.pickupDate}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted-col)' }}>
                <Clock size={11} /> {round.pickupTime}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted-col)' }}>
                <AlertCircle size={11} /> Deadline: {round.deadline}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold text-orange-400 leading-tight">{round.totalOrders}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted-col)' }}>orders</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text-col)' }}>{totalReserved}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted-col)' }}>reserved</p>
          </div>
          {expanded ? (
            <ChevronUp size={16} style={{ color: 'var(--text-muted-col)' }} />
          ) : (
            <ChevronDown size={16} style={{ color: 'var(--text-muted-col)' }} />
          )}
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="border-t" style={{ borderColor: 'var(--border-col)' }}>
          {/* Quota table header */}
          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-28 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted-col)' }}>ລາຍການ</div>
              <div className="w-24 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted-col)' }}>Item</div>
              <div className="w-10 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted-col)' }}>Max</div>
              <div className="w-12 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted-col)' }}>Rsvd</div>
              <div className="flex-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted-col)' }}>Stock</div>
            </div>
            <div className="space-y-2">
              {round.items.map(item => (
                <QuotaBar key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 py-3 flex items-center gap-2">
            <button
              onClick={() => onToggle(round.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                round.status === 'open'
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                  : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30'
              }`}
            >
              {round.status === 'open' ? (
                <><ToggleRight size={16} /> Close Round</>
              ) : (
                <><ToggleLeft size={16} /> Open Round</>
              )}
            </button>
            <button
              onClick={() => onViewOrders(round.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'var(--active-bg)', color: 'var(--text-col)' }}
            >
              <Eye size={15} /> View Orders ({round.totalOrders})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── New Round Modal ─────────────────────────────────────────────────────────────
interface NewRoundForm {
  name: string
  pickupDate: string
  pickupTime: string
  deadline: string
  selectedItems: { menuId: string; maxQty: number }[]
}

function NewRoundModal({ onClose, onSave }: { onClose: () => void; onSave: (form: NewRoundForm) => void }) {
  const [form, setForm] = useState<NewRoundForm>({
    name: '',
    pickupDate: '',
    pickupTime: '',
    deadline: '',
    selectedItems: [],
  })

  function toggleItem(menuId: string) {
    setForm(prev => {
      const exists = prev.selectedItems.find(i => i.menuId === menuId)
      if (exists) {
        return { ...prev, selectedItems: prev.selectedItems.filter(i => i.menuId !== menuId) }
      }
      return { ...prev, selectedItems: [...prev.selectedItems, { menuId, maxQty: 50 }] }
    })
  }

  function setMaxQty(menuId: string, qty: number) {
    setForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.map(i => i.menuId === menuId ? { ...i, maxQty: qty } : i),
    }))
  }

  const isSelected = (id: string) => form.selectedItems.some(i => i.menuId === id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-col)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-col)' }}>
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-orange-400" />
            <h2 className="font-bold" style={{ color: 'var(--text-col)' }}>ສ້າງຮອບໃໝ່ / New Round</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted-col)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Round name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted-col)' }}>
              Round Name
            </label>
            <input
              type="text"
              placeholder="e.g. Round 1 – Morning Batch"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              style={{ background: 'var(--main-bg)', borderColor: 'var(--border-col)', color: 'var(--text-col)' }}
            />
          </div>

          {/* Pickup date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted-col)' }}>
                Pickup Date
              </label>
              <input
                type="date"
                value={form.pickupDate}
                onChange={e => setForm(f => ({ ...f, pickupDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                style={{ background: 'var(--main-bg)', borderColor: 'var(--border-col)', color: 'var(--text-col)' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted-col)' }}>
                Pickup Time
              </label>
              <input
                type="text"
                placeholder="08:00–10:00"
                value={form.pickupTime}
                onChange={e => setForm(f => ({ ...f, pickupTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                style={{ background: 'var(--main-bg)', borderColor: 'var(--border-col)', color: 'var(--text-col)' }}
              />
            </div>
          </div>

          {/* Order deadline */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted-col)' }}>
              Order Deadline
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              style={{ background: 'var(--main-bg)', borderColor: 'var(--border-col)', color: 'var(--text-col)' }}
            />
          </div>

          {/* Items checklist */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted-col)' }}>
              Include Items &amp; Set Quotas
            </label>
            <div className="space-y-2">
              {MENU_OPTIONS.map(menu => {
                const sel = isSelected(menu.id)
                const entry = form.selectedItems.find(i => i.menuId === menu.id)
                return (
                  <div
                    key={menu.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border transition-colors"
                    style={{
                      borderColor: sel ? '#f97316' : 'var(--border-col)',
                      background: sel ? 'rgba(249,115,22,0.08)' : 'var(--main-bg)',
                    }}
                  >
                    <button
                      onClick={() => toggleItem(menu.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        sel ? 'border-orange-500 bg-orange-500' : 'border-slate-500'
                      }`}
                    >
                      {sel && <CheckCircle size={10} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-col)' }}>{menu.nameLo}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted-col)' }}>{menu.name}</p>
                    </div>
                    {sel && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs" style={{ color: 'var(--text-muted-col)' }}>Max:</span>
                        <input
                          type="number"
                          min={1}
                          value={entry?.maxQty ?? 50}
                          onChange={e => setMaxQty(menu.id, parseInt(e.target.value) || 1)}
                          onClick={e => e.stopPropagation()}
                          className="w-16 px-2 py-1 rounded-md text-xs border text-center focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-col)', color: 'var(--text-col)' }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border-col)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted-col)', background: 'var(--active-bg)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name || form.selectedItems.length === 0}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: '#f97316' }}
          >
            Create Round
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Orders Slide-In Panel ──────────────────────────────────────────────────────
function OrdersPanel({
  round,
  orders,
  onClose,
  onUpdateStatus,
}: {
  round: PreorderRound
  orders: RoundOrder[]
  onClose: () => void
  onUpdateStatus: (orderId: string, status: RoundOrder['status']) => void
}) {
  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex flex-col border-l shadow-2xl"
      style={{ width: 520, background: 'var(--card-bg)', borderColor: 'var(--border-col)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-col)' }}>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-orange-400" />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-col)' }}>{round.name}</h3>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
            {orders.length} orders · Pickup {round.pickupDate} {round.pickupTime}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-muted-col)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Orders table */}
      <div className="flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <ShoppingBag size={28} style={{ color: 'var(--text-muted-col)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted-col)' }}>No orders yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-col)' }}>
            {orders.map(order => (
              <div key={order.id} className="px-5 py-4">
                {/* Row 1: queue + customer + status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-orange-400">#{order.queueNum}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-col)' }}>{order.customer}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted-col)' }}>{order.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-0.5 mb-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--text-muted-col)' }}>{item.qty}× {item.name}</span>
                      <span style={{ color: 'var(--text-col)' }}>{fmt(item.qty * item.price)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-bold pt-1 border-t mt-1"
                    style={{ borderColor: 'var(--border-col)' }}>
                    <span style={{ color: 'var(--text-col)' }}>Total</span>
                    <span className="text-orange-400">{fmt(order.total)}</span>
                  </div>
                </div>

                {/* Actions */}
                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateStatus(order.id, 'confirmed')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={12} /> Confirm
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'rejected')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PreorderPage() {
  const [rounds, setRounds] = useState<PreorderRound[]>(MOCK_ROUNDS)
  const [orders, setOrders] = useState<RoundOrder[]>(MOCK_ORDERS)
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active')
  const [showNewModal, setShowNewModal] = useState(false)
  const [viewingRoundId, setViewingRoundId] = useState<string | null>(null)

  const activeRounds = rounds.filter(r => r.status === 'open' || r.status === 'upcoming')
  const pastRounds   = rounds.filter(r => r.status === 'closed')
  const displayedRounds = activeTab === 'active' ? activeRounds : pastRounds

  function toggleRound(id: string) {
    setRounds(prev => prev.map(r =>
      r.id === id
        ? { ...r, status: r.status === 'open' ? 'closed' : 'open' }
        : r
    ))
  }

  function handleNewRound(form: NewRoundForm) {
    const newRound: PreorderRound = {
      id: `r${rounds.length + 1}`,
      name: form.name,
      status: 'upcoming',
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime,
      deadline: form.deadline,
      totalOrders: 0,
      items: form.selectedItems.map(si => {
        const menu = MENU_OPTIONS.find(m => m.id === si.menuId)!
        return { id: si.menuId, name: menu.name, nameLo: menu.nameLo, maxQty: si.maxQty, reserved: 0 }
      }),
    }
    setRounds(prev => [newRound, ...prev])
    setShowNewModal(false)
  }

  function updateOrderStatus(orderId: string, status: RoundOrder['status']) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const viewingRound = viewingRoundId ? rounds.find(r => r.id === viewingRoundId) : null
  const panelOrders  = viewingRoundId ? orders.filter(o => o.roundId === viewingRoundId) : []

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--main-bg)' }}>
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--border-col)' }}
        >
          <Package size={20} className="text-orange-400" />
          <div>
            <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--text-col)' }}>
              ພຣີອໍເດີ
              <span className="font-normal text-sm ml-2" style={{ color: 'var(--text-muted-col)' }}>Pre-orders</span>
            </h1>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: '#f97316' }}
          >
            <Plus size={16} /> New Round
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 shrink-0 border-b" style={{ borderColor: 'var(--border-col)' }}>
          {([ 'active', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition-all border-b-2 ${
                activeTab === tab ? 'border-orange-500 text-orange-400' : 'border-transparent'
              }`}
              style={{ color: activeTab === tab ? '#f97316' : 'var(--text-muted-col)' }}
            >
              {tab === 'active' ? (
                <span className="flex items-center gap-1.5">
                  Active Rounds
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: activeTab === 'active' ? '#f97316' : 'var(--active-bg)', color: activeTab === 'active' ? 'white' : 'var(--text-muted-col)' }}>
                    {activeRounds.length}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Past Rounds
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: activeTab === 'past' ? '#f97316' : 'var(--active-bg)', color: activeTab === 'past' ? 'white' : 'var(--text-muted-col)' }}>
                    {pastRounds.length}
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Round cards */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {displayedRounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Users size={32} style={{ color: 'var(--text-muted-col)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted-col)' }}>No rounds here</p>
              {activeTab === 'active' && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
                  style={{ background: '#f97316' }}
                >
                  <Plus size={14} /> Create First Round
                </button>
              )}
            </div>
          ) : (
            displayedRounds.map(round => (
              <RoundCard
                key={round.id}
                round={round}
                onToggle={toggleRound}
                onViewOrders={setViewingRoundId}
              />
            ))
          )}
        </div>
      </div>

      {/* Orders slide-in panel */}
      {viewingRound && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setViewingRoundId(null)}
          />
          <OrdersPanel
            round={viewingRound}
            orders={panelOrders}
            onClose={() => setViewingRoundId(null)}
            onUpdateStatus={updateOrderStatus}
          />
        </>
      )}

      {/* New Round Modal */}
      {showNewModal && (
        <NewRoundModal
          onClose={() => setShowNewModal(false)}
          onSave={handleNewRound}
        />
      )}
    </div>
  )
}
