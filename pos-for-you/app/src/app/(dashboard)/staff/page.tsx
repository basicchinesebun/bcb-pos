'use client'

import { useState } from 'react'
import {
  Users,
  UserCheck,
  Shield,
  Activity,
  Pencil,
  Ban,
  X,
  Mail,
  Send,
  ChevronDown,
  Clock,
  MapPin,
  Phone,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = 'shop_owner' | 'manager' | 'cashier' | 'viewer'
type Status = 'active' | 'inactive'

interface StaffMember {
  id: number
  name: string
  nameLo: string
  role: Role
  branch: string
  email: string
  phone: string
  lastLogin: string
  status: Status
  initials: string
  avatarColor: string
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const BRANCHES = ['Vientiane Main', 'Luang Prabang']

const STAFF: StaffMember[] = [
  {
    id: 1,
    name: 'Somchai Vongsa',
    nameLo: 'ສົມໄຊ ວົງສາ',
    role: 'shop_owner',
    branch: 'Vientiane Main',
    email: 'somchai@bcb.la',
    phone: '+856 20 5555 0001',
    lastLogin: '2026-06-14 08:12',
    status: 'active',
    initials: 'SV',
    avatarColor: '#7c3aed',
  },
  {
    id: 2,
    name: 'Khamla Phommasack',
    nameLo: 'ຄຳລາ ພົມມະສັກ',
    role: 'manager',
    branch: 'Vientiane Main',
    email: 'khamla@bcb.la',
    phone: '+856 20 5555 0002',
    lastLogin: '2026-06-14 09:04',
    status: 'active',
    initials: 'KP',
    avatarColor: '#2563eb',
  },
  {
    id: 3,
    name: 'Naly Sirivong',
    nameLo: 'ນາລີ ສີລິວົງ',
    role: 'manager',
    branch: 'Luang Prabang',
    email: 'naly@bcb.la',
    phone: '+856 20 5555 0003',
    lastLogin: '2026-06-13 17:45',
    status: 'active',
    initials: 'NS',
    avatarColor: '#0891b2',
  },
  {
    id: 4,
    name: 'Bounmy Keodara',
    nameLo: 'ບຸນມີ ແກ້ວດາລາ',
    role: 'cashier',
    branch: 'Vientiane Main',
    email: 'bounmy@bcb.la',
    phone: '+856 20 5555 0004',
    lastLogin: '2026-06-14 08:55',
    status: 'active',
    initials: 'BK',
    avatarColor: '#16a34a',
  },
  {
    id: 5,
    name: 'Phonesavanh Ly',
    nameLo: 'ໂຜນສະຫວັນ ລີ',
    role: 'cashier',
    branch: 'Luang Prabang',
    email: 'phone@bcb.la',
    phone: '+856 20 5555 0005',
    lastLogin: '2026-06-12 14:20',
    status: 'inactive',
    initials: 'PL',
    avatarColor: '#ca8a04',
  },
  {
    id: 6,
    name: 'Daovone Saiyasouk',
    nameLo: 'ດາວໂວນ ໄຊຍະສຸກ',
    role: 'viewer',
    branch: 'Vientiane Main',
    email: 'daovone@bcb.la',
    phone: '+856 20 5555 0006',
    lastLogin: '2026-06-10 11:30',
    status: 'inactive',
    initials: 'DS',
    avatarColor: '#64748b',
  },
]

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<Role, { label: string; bg: string; color: string }> = {
  shop_owner: { label: 'Owner',   bg: 'rgba(124,58,237,0.18)', color: '#a78bfa' },
  manager:    { label: 'Manager', bg: 'rgba(37,99,235,0.18)',  color: '#60a5fa' },
  cashier:    { label: 'Cashier', bg: 'rgba(22,163,74,0.18)',  color: '#4ade80' },
  viewer:     { label: 'Viewer',  bg: 'rgba(100,116,139,0.2)', color: '#94a3b8' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role]
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 9999,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: Status }) {
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

function Avatar({ member }: { member: StaffMember }) {
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: member.avatarColor + '33',
        border: `2px solid ${member.avatarColor}55`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: member.avatarColor,
        flexShrink: 0,
      }}
    >
      {member.initials}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  label: string
  value: number | string
}) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
    >
      <div
        className="rounded-lg flex items-center justify-center"
        style={{ width: 44, height: 44, background: iconBg, color: iconColor, flexShrink: 0 }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted-col)' }}>{label}</p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-col)' }}>{value}</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(STAFF)
  const [showInvite, setShowInvite] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Exclude<Role, 'shop_owner'>>('cashier')
  const [inviteBranch, setInviteBranch] = useState(BRANCHES[0])

  // Edit role state
  const [editRole, setEditRole] = useState<Role>('cashier')

  const totalStaff   = staff.length
  const totalManagers = staff.filter((s) => s.role === 'manager').length
  const totalCashiers = staff.filter((s) => s.role === 'cashier').length
  const activeNow     = staff.filter((s) => s.status === 'active').length

  function toggleStatus(id: number) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
      )
    )
  }

  function openEdit(member: StaffMember) {
    setEditTarget(member)
    setEditRole(member.role)
  }

  function saveEdit() {
    if (!editTarget) return
    setStaff((prev) =>
      prev.map((s) => (s.id === editTarget.id ? { ...s, role: editRole } : s))
    )
    setEditTarget(null)
  }

  function sendInvite() {
    if (!inviteEmail.trim()) return
    setShowInvite(false)
    setInviteEmail('')
    setInviteRole('cashier')
    setInviteBranch(BRANCHES[0])
  }

  const TH_STYLE: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    color: 'var(--text-muted-col)',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
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
            ພະນັກງານ / <span style={{ color: 'var(--cta-primary)' }}>Staff</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
            ຈັດການທີມງານ — Manage your team members
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
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
          <Mail size={15} />
          ເຊີນພະນັກງານ / Invite Staff
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        <StatCard
          icon={<Users size={20} />}
          iconColor="var(--cta-primary)"
          iconBg="rgba(249,115,22,0.15)"
          label="ທັງໝົດ / Total Staff"
          value={totalStaff}
        />
        <StatCard
          icon={<Shield size={20} />}
          iconColor="#a78bfa"
          iconBg="rgba(124,58,237,0.15)"
          label="ຜູ້ຈັດການ / Managers"
          value={totalManagers}
        />
        <StatCard
          icon={<UserCheck size={20} />}
          iconColor="#60a5fa"
          iconBg="rgba(37,99,235,0.15)"
          label="ພະນັກງານໂຕ / Cashiers"
          value={totalCashiers}
        />
        <StatCard
          icon={<Activity size={20} />}
          iconColor="#4ade80"
          iconBg="rgba(22,163,74,0.15)"
          label="ກຳລັງໃຊ້ງານ / Active Now"
          value={activeNow}
        />
      </div>

      {/* ── Staff Table ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-col)' }}
        >
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: 'var(--cta-primary)' }} />
            <h2 className="text-sm font-semibold">ລາຍຊື່ພະນັກງານ / Staff List</h2>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 12px',
              borderRadius: 9999,
              background: 'rgba(249,115,22,0.12)',
              color: 'var(--cta-primary)',
            }}
          >
            {totalStaff} members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-col)' }}>
                {['Staff', 'Role', 'Branch', 'Contact', 'Last Login', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={TH_STYLE}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((member, idx) => (
                <tr
                  key={member.id}
                  style={{
                    borderBottom: idx < staff.length - 1 ? '1px solid var(--border-col)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Staff (avatar + name) */}
                  <td style={{ padding: '14px 16px' }}>
                    <div className="flex items-center gap-3">
                      <Avatar member={member} />
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-col)', lineHeight: 1.3 }}>
                          {member.name}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted-col)', marginTop: 1 }}>
                          {member.nameLo}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '14px 16px' }}>
                    <RoleBadge role={member.role} />
                  </td>

                  {/* Branch */}
                  <td style={{ padding: '14px 16px' }}>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} style={{ color: 'var(--text-muted-col)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted-col)', fontSize: 12 }}>{member.branch}</span>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ color: 'var(--text-col)', fontSize: 12 }}>{member.email}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone size={10} style={{ color: 'var(--text-muted-col)' }} />
                      <p style={{ color: 'var(--text-muted-col)', fontSize: 11 }}>{member.phone}</p>
                    </div>
                  </td>

                  {/* Last Login */}
                  <td style={{ padding: '14px 16px' }}>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: 'var(--text-muted-col)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted-col)', fontSize: 12 }}>{member.lastLogin}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={member.status} />
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    <div className="flex items-center gap-2">
                      {/* Edit Role */}
                      <button
                        onClick={() => openEdit(member)}
                        title="Edit role"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid var(--border-col)',
                          background: 'transparent',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Deactivate / Reactivate */}
                      {member.role !== 'shop_owner' && (
                        <button
                          onClick={() => toggleStatus(member.id)}
                          title={member.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid var(--border-col)',
                            background: 'transparent',
                            color: member.status === 'active' ? 'var(--cta-danger)' : '#4ade80',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              member.status === 'active'
                                ? 'rgba(220,38,38,0.15)'
                                : 'rgba(22,163,74,0.15)'
                          }}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="rounded-2xl w-full max-w-md mx-4 overflow-hidden"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border-col)' }}
            >
              <div className="flex items-center gap-2">
                <Mail size={16} style={{ color: 'var(--cta-primary)' }} />
                <h3 className="font-semibold text-sm">ເຊີນພະນັກງານ / Invite Staff Member</h3>
              </div>
              <button
                onClick={() => setShowInvite(false)}
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

            {/* Modal body */}
            <div className="p-6 flex flex-col gap-4">
              {/* Email */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--text-muted-col)' }}
                >
                  ອີເມວ / Email Address
                </label>
                <input
                  type="email"
                  placeholder="staff@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
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

              {/* Role */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--text-muted-col)' }}
                >
                  ບົດບາດ / Role
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Exclude<Role, 'shop_owner'>)}
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
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="viewer">Viewer</option>
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

              {/* Branch */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--text-muted-col)' }}
                >
                  ສາຂາ / Branch
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={inviteBranch}
                    onChange={(e) => setInviteBranch(e.target.value)}
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
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
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

              {/* Role preview badge */}
              <div
                className="rounded-lg px-4 py-3 flex items-center gap-3"
                style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)' }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted-col)' }}>Will be invited as:</span>
                <RoleBadge role={inviteRole} />
                <span style={{ fontSize: 12, color: 'var(--text-muted-col)' }}>at</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-col)' }}>{inviteBranch}</span>
              </div>
            </div>

            {/* Modal footer */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4"
              style={{ borderTop: '1px solid var(--border-col)' }}
            >
              <button
                onClick={() => setShowInvite(false)}
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
                onClick={sendInvite}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: inviteEmail.trim() ? 'var(--cta-primary)' : 'var(--border-col)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { if (inviteEmail.trim()) e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Send size={13} />
                ສົ່ງຄຳເຊີນ / Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Role Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border-col)' }}
            >
              <div className="flex items-center gap-3">
                <Avatar member={editTarget} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-col)' }}>
                    {editTarget.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted-col)' }}>
                    Change role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditTarget(null)}
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

            {/* Body */}
            <div className="p-6 flex flex-col gap-3">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted-col)' }}>
                ເລືອກບົດບາດ / Select Role
              </label>
              {(['manager', 'cashier', 'viewer'] as Role[]).map((r) => {
                const cfg = ROLE_CONFIG[r]
                const isSelected = editRole === r
                return (
                  <button
                    key={r}
                    onClick={() => setEditRole(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: isSelected
                        ? `1.5px solid ${cfg.color}`
                        : '1.5px solid var(--border-col)',
                      background: isSelected ? cfg.bg : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: isSelected ? cfg.color : 'var(--border-col)',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                      }}
                    />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, color: isSelected ? cfg.color : 'var(--text-col)' }}>
                        {cfg.label}
                      </p>
                    </div>
                    <RoleBadge role={r} />
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4"
              style={{ borderTop: '1px solid var(--border-col)' }}
            >
              <button
                onClick={() => setEditTarget(null)}
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
                onClick={saveEdit}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'var(--cta-primary)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                ບັນທຶກ / Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  )
}
