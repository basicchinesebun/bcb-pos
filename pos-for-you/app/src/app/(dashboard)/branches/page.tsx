'use client'

import { useState } from 'react'
import {
  MapPin,
  Phone,
  User,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  X,
  ShoppingBag,
  DollarSign,
  ChevronDown,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type BranchStatus = 'active' | 'inactive'

interface Branch {
  id: number
  nameLo: string
  nameTh: string
  nameEn: string
  nameZh: string
  address: string
  phone: string
  city: string
  manager: string
  status: BranchStatus
  ordersToday: number
  revenueToday: number
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MANAGERS = [
  'Khamla Phommasack',
  'Naly Sirivong',
  'Bounmy Keodara',
  'Somchai Vongsa',
]

const INITIAL_BRANCHES: Branch[] = [
  {
    id: 1,
    nameLo: 'ສາຂາຫຼັກ ວຽງຈັນ',
    nameTh: 'สาขาหลัก เวียงจันทน์',
    nameEn: 'Vientiane Main',
    nameZh: '万象总店',
    address: '123 ຖ. ລ້ານຊ້າງ, ວຽງຈັນ',
    phone: '+856 21 222 333',
    city: 'Vientiane',
    manager: 'Khamla Phommasack',
    status: 'active',
    ordersToday: 84,
    revenueToday: 1260000,
  },
  {
    id: 2,
    nameLo: 'ສາຂາ ຫຼວງພະບາງ',
    nameTh: 'สาขา หลวงพระบาง',
    nameEn: 'Luang Prabang',
    nameZh: '琅勃拉邦店',
    address: '56 ຖ. ສາຍຄຳ, ຫຼວງພະບາງ',
    phone: '+856 71 444 555',
    city: 'Luang Prabang',
    manager: 'Naly Sirivong',
    status: 'active',
    ordersToday: 47,
    revenueToday: 705000,
  },
  {
    id: 3,
    nameLo: 'ສາຂາ ສະຫວັນນະເຂດ',
    nameTh: 'สาขา สะหวันนะเขต',
    nameEn: 'Savannakhet',
    nameZh: '沙湾拿吉店',
    address: '9 ຖ. ໄຊຍະໂພ, ສະຫວັນນະເຂດ',
    phone: '+856 41 666 777',
    city: 'Savannakhet',
    manager: 'Bounmy Keodara',
    status: 'inactive',
    ordersToday: 0,
    revenueToday: 0,
  },
]

// ── Form state shape ───────────────────────────────────────────────────────────
interface BranchForm {
  nameLo: string
  nameTh: string
  nameEn: string
  nameZh: string
  address: string
  phone: string
  city: string
  manager: string
  status: BranchStatus
}

const EMPTY_FORM: BranchForm = {
  nameLo: '',
  nameTh: '',
  nameEn: '',
  nameZh: '',
  address: '',
  phone: '',
  city: '',
  manager: MANAGERS[0],
  status: 'active',
}

function branchToForm(b: Branch): BranchForm {
  return {
    nameLo: b.nameLo,
    nameTh: b.nameTh,
    nameEn: b.nameEn,
    nameZh: b.nameZh,
    address: b.address,
    phone: b.phone,
    city: b.city,
    manager: b.manager,
    status: b.status,
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: BranchStatus }) {
  const active = status === 'active'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 9999,
        background: active ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
        color: active ? '#4ade80' : '#94a3b8',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: active ? '#4ade80' : '#64748b',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted-col)' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: 8,
          border: '1px solid var(--border-col)',
          background: 'var(--main-bg)',
          color: 'var(--text-col)',
          fontSize: 13,
          outline: 'none',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--cta-primary)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-col)')}
      />
    </div>
  )
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted-col)' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 36px 9px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-col)',
            background: 'var(--main-bg)',
            color: 'var(--text-col)',
            fontSize: 13,
            appearance: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted-col)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Branch | null>(null)
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM)

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditTarget(null)
    setModalMode('add')
  }

  function openEdit(branch: Branch) {
    setForm(branchToForm(branch))
    setEditTarget(branch)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setEditTarget(null)
  }

  function setField<K extends keyof BranchForm>(key: K, value: BranchForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.nameEn.trim()) return

    if (modalMode === 'add') {
      const newBranch: Branch = {
        id: Date.now(),
        ...form,
        ordersToday: 0,
        revenueToday: 0,
      }
      setBranches((prev) => [...prev, newBranch])
    } else if (modalMode === 'edit' && editTarget) {
      setBranches((prev) =>
        prev.map((b) =>
          b.id === editTarget.id ? { ...b, ...form } : b
        )
      )
    }
    closeModal()
  }

  function toggleStatus(id: number) {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b
      )
    )
  }

  const totalActive = branches.filter((b) => b.status === 'active').length
  const totalOrders = branches.reduce((acc, b) => acc + b.ordersToday, 0)
  const totalRevenue = branches.reduce((acc, b) => acc + b.revenueToday, 0)

  return (
    <div
      className="min-h-screen p-6 overflow-y-auto"
      style={{ background: 'var(--main-bg)', color: 'var(--text-col)' }}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-col)' }}>
            ສາຂາ / <span style={{ color: 'var(--cta-primary)' }}>Branches</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
            ຈັດການສາຂາທັງໝົດ — Manage all branch locations
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 10,
            background: 'var(--cta-primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={15} />
          ເພີ່ມສາຂາ / Add Branch
        </button>
      </div>

      {/* ── Summary Strip ── */}
      <div
        className="rounded-xl flex flex-wrap gap-0 mb-6 overflow-hidden"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
      >
        {[
          {
            label: 'Total Branches',
            value: branches.length,
            icon: <Building2 size={16} />,
            color: 'var(--cta-primary)',
            bg: 'rgba(249,115,22,0.12)',
          },
          {
            label: 'Active Branches',
            value: totalActive,
            icon: <CheckCircle2 size={16} />,
            color: '#4ade80',
            bg: 'rgba(22,163,74,0.12)',
          },
          {
            label: "Today's Orders",
            value: totalOrders,
            icon: <ShoppingBag size={16} />,
            color: '#60a5fa',
            bg: 'rgba(37,99,235,0.12)',
          },
          {
            label: "Today's Revenue",
            value: `₭${totalRevenue.toLocaleString()}`,
            icon: <DollarSign size={16} />,
            color: '#a78bfa',
            bg: 'rgba(124,58,237,0.12)',
          },
        ].map((item, idx, arr) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-5"
            style={{
              flex: '1 1 160px',
              borderRight: idx < arr.length - 1 ? '1px solid var(--border-col)' : 'none',
            }}
          >
            <div
              className="rounded-lg flex items-center justify-center"
              style={{ width: 38, height: 38, background: item.bg, color: item.color, flexShrink: 0 }}
            >
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted-col)' }}>{item.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-col)' }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Branch Cards Grid ── */}
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
      >
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="rounded-xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-col)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = branch.status === 'active' ? 'rgba(249,115,22,0.4)' : 'var(--border-col)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-col)')}
          >
            {/* Card header */}
            <div
              className="px-5 pt-5 pb-4"
              style={{ borderBottom: '1px solid var(--border-col)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-lg font-bold leading-tight truncate"
                    style={{ color: 'var(--text-col)' }}
                  >
                    {branch.nameEn}
                  </h2>
                  <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--text-muted-col)' }}>
                    {branch.nameLo}
                  </p>
                </div>
                <StatusBadge status={branch.status} />
              </div>
              {/* Multi-language names */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { lang: 'ไทย', name: branch.nameTh },
                  { lang: '中', name: branch.nameZh },
                ].map(({ lang, name }) => (
                  <span
                    key={lang}
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      border: '1px solid var(--border-col)',
                      color: 'var(--text-muted-col)',
                    }}
                  >
                    <span style={{ opacity: 0.6 }}>{lang}: </span>{name}
                  </span>
                ))}
              </div>
            </div>

            {/* Card body */}
            <div className="px-5 py-4 flex flex-col gap-2.5 flex-1">
              {/* Address */}
              <div className="flex items-start gap-2">
                <MapPin size={13} style={{ color: 'var(--cta-primary)', marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-col)', lineHeight: 1.4 }}>{branch.address}</span>
              </div>
              {/* Phone */}
              <div className="flex items-center gap-2">
                <Phone size={13} style={{ color: 'var(--text-muted-col)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted-col)' }}>{branch.phone}</span>
              </div>
              {/* Manager */}
              <div className="flex items-center gap-2">
                <User size={13} style={{ color: 'var(--text-muted-col)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted-col)' }}>
                  Manager: <span style={{ color: 'var(--text-col)', fontWeight: 600 }}>{branch.manager}</span>
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div
              className="grid grid-cols-2"
              style={{ borderTop: '1px solid var(--border-col)' }}
            >
              <div
                className="flex flex-col items-center py-3 gap-0.5"
                style={{ borderRight: '1px solid var(--border-col)' }}
              >
                <div className="flex items-center gap-1.5">
                  <ShoppingBag size={12} style={{ color: '#60a5fa' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted-col)', fontWeight: 500 }}>
                    Orders Today
                  </span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-col)' }}>
                  {branch.ordersToday}
                </p>
              </div>
              <div className="flex flex-col items-center py-3 gap-0.5">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={12} style={{ color: '#a78bfa' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted-col)', fontWeight: 500 }}>
                    Revenue Today
                  </span>
                </div>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-col)' }}>
                  ₭{branch.revenueToday.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ borderTop: '1px solid var(--border-col)' }}
            >
              <button
                onClick={() => openEdit(branch)}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '8px 0',
                  borderRadius: 8,
                  border: '1px solid var(--border-col)',
                  background: 'transparent',
                  color: '#60a5fa',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                onClick={() => toggleStatus(branch.id)}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '8px 0',
                  borderRadius: 8,
                  border: `1px solid ${branch.status === 'active' ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'}`,
                  background: 'transparent',
                  color: branch.status === 'active' ? 'var(--cta-danger)' : '#4ade80',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    branch.status === 'active' ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)'
                }}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {branch.status === 'active' ? (
                  <>
                    <ToggleRight size={14} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleLeft size={14} />
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-col)',
              maxHeight: '90vh',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-col)' }}
            >
              <div className="flex items-center gap-2">
                <Building2 size={16} style={{ color: 'var(--cta-primary)' }} />
                <h3 className="font-semibold text-sm">
                  {modalMode === 'add' ? 'ເພີ່ມສາຂາ / Add Branch' : 'ແກ້ໄຂສາຂາ / Edit Branch'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted-col)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {/* Branch name — 4 languages */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted-col)' }}>
                  ຊື່ສາຂາ / Branch Name (all languages)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="ລາວ"
                    value={form.nameLo}
                    onChange={(v) => setField('nameLo', v)}
                    placeholder="ສາຂາ..."
                  />
                  <FormInput
                    label="ไทย"
                    value={form.nameTh}
                    onChange={(v) => setField('nameTh', v)}
                    placeholder="สาขา..."
                  />
                  <FormInput
                    label="EN"
                    value={form.nameEn}
                    onChange={(v) => setField('nameEn', v)}
                    placeholder="Branch name..."
                  />
                  <FormInput
                    label="中"
                    value={form.nameZh}
                    onChange={(v) => setField('nameZh', v)}
                    placeholder="分店名称..."
                  />
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border-col)' }} />

              {/* Address & Phone */}
              <FormInput
                label="ທີ່ຢູ່ / Address"
                value={form.address}
                onChange={(v) => setField('address', v)}
                placeholder="123 ຖ. ..."
              />

              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="ເມືອງ / City"
                  value={form.city}
                  onChange={(v) => setField('city', v)}
                  placeholder="Vientiane"
                />
                <FormInput
                  label="ໂທລະສັບ / Phone"
                  value={form.phone}
                  onChange={(v) => setField('phone', v)}
                  placeholder="+856 ..."
                  type="tel"
                />
              </div>

              {/* Manager */}
              <SelectInput
                label="ຜູ້ຈັດການ / Assign Manager"
                value={form.manager}
                onChange={(v) => setField('manager', v)}
                options={MANAGERS}
              />

              {/* Active toggle */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted-col)' }}>
                  ສະຖານະ / Status
                </p>
                <button
                  onClick={() =>
                    setField('status', form.status === 'active' ? 'inactive' : 'active')
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${form.status === 'active' ? 'rgba(22,163,74,0.4)' : 'var(--border-col)'}`,
                    background:
                      form.status === 'active'
                        ? 'rgba(22,163,74,0.08)'
                        : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                >
                  {form.status === 'active' ? (
                    <CheckCircle2 size={18} color="#4ade80" />
                  ) : (
                    <XCircle size={18} color="#64748b" />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: form.status === 'active' ? '#4ade80' : '#94a3b8',
                    }}
                  >
                    {form.status === 'active' ? 'Active — Branch is open' : 'Inactive — Branch is closed'}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      color: 'var(--text-muted-col)',
                      fontWeight: 500,
                    }}
                  >
                    Click to toggle
                  </span>
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border-col)' }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-col)',
                  background: 'transparent',
                  color: 'var(--text-muted-col)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ຍົກເລີກ / Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: form.nameEn.trim() ? 'var(--cta-primary)' : 'var(--border-col)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: form.nameEn.trim() ? 'pointer' : 'not-allowed',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { if (form.nameEn.trim()) e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {modalMode === 'add' ? (
                  <>
                    <Plus size={13} />
                    ເພີ່ມສາຂາ / Add Branch
                  </>
                ) : (
                  <>
                    <Pencil size={13} />
                    ບັນທຶກ / Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  )
}
