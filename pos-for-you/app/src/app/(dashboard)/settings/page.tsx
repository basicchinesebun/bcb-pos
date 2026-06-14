'use client'

import { useState, useRef } from 'react'
import {
  Store,
  CreditCard,
  Globe,
  Printer,
  Bell,
  Crown,
  Camera,
  Upload,
  Check,
  ChevronDown,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'shop' | 'payment' | 'language' | 'receipt' | 'notifications' | 'subscription'

// ── Toggle Component ──────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? 'var(--cta-primary)' : 'var(--border-col)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#ffffff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}

// ── Input Field ───────────────────────────────────────────────────────────────
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, color: 'var(--text-muted-col)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'var(--main-bg)',
          border: '1px solid var(--border-col)',
          color: 'var(--text-col)',
          borderRadius: 8,
          padding: '8px 12px',
          width: '100%',
          fontSize: 14,
          outline: 'none',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--cta-primary)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border-col)')}
      />
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-col)', margin: 0 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: 'var(--text-muted-col)', marginTop: 4 }}>{subtitle}</p>
      )}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div
      style={{
        borderTop: '1px solid var(--border-col)',
        margin: '24px 0',
      }}
    />
  )
}

// ── Save Button ───────────────────────────────────────────────────────────────
function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: saved ? 'var(--cta-success)' : 'var(--cta-primary)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 24px',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background 0.2s',
      }}
    >
      {saved ? <Check size={16} /> : null}
      {saved ? 'Saved!' : 'Save Changes'}
    </button>
  )
}

// ── Shop Info Tab ─────────────────────────────────────────────────────────────
function ShopInfoTab() {
  const [saved, setSaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nameLao: 'ບາຊິກ ຈີນ ບານ',
    nameThai: 'เบสิก ชายน์ บัน',
    nameEn: 'Basic Chinese Bun',
    nameCn: '基础中国包',
    phone: '+856 20 5555 1234',
    email: 'info@bcb.la',
    address: '123 Lane Xang Avenue, Vientiane, Laos',
    facebook: 'https://facebook.com/bcblaos',
    instagram: 'https://instagram.com/bcblaos',
    line: '@bcblaos',
  })

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
    }
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <SectionHeader title="Shop Information" subtitle="Manage your restaurant's public profile" />

      {/* Shop Name — Multilingual */}
      <div
        style={{
          background: 'var(--main-bg)',
          border: '1px solid var(--border-col)',
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted-col)', marginBottom: 12 }}>
          Shop Name (All Languages)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InputField label="🇱🇦 Lao" value={form.nameLao} onChange={set('nameLao')} placeholder="ຊື່ຮ້ານ" />
          <InputField label="🇹🇭 Thai" value={form.nameThai} onChange={set('nameThai')} placeholder="ชื่อร้าน" />
          <InputField label="🇬🇧 English" value={form.nameEn} onChange={set('nameEn')} placeholder="Shop name" />
          <InputField label="🇨🇳 Chinese" value={form.nameCn} onChange={set('nameCn')} placeholder="店名" />
        </div>
      </div>

      {/* Logo Upload */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted-col)', fontWeight: 500, display: 'block', marginBottom: 8 }}>
          Shop Logo
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--border-col)',
            borderRadius: 10,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--cta-primary)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-col)')}
        >
          {logoPreview ? (
            <>
              <img
                src={logoPreview}
                alt="Logo preview"
                style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted-col)' }}>Click to change logo</span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--border-col)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={24} style={{ color: 'var(--text-muted-col)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', margin: 0 }}>
                  Upload shop logo
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted-col)', marginTop: 4 }}>
                  PNG, JPG up to 5MB — recommended 512×512px
                </p>
              </div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
      </div>

      <Divider />

      {/* Contact Info */}
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 12 }}>Contact Details</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <InputField label="Phone" value={form.phone} onChange={set('phone')} placeholder="+856 20 ..." />
        <InputField label="Email" value={form.email} onChange={set('email')} type="email" placeholder="info@shop.com" />
      </div>
      <InputField label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />

      <Divider />

      {/* Social Links */}
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 12 }}>Social Links</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {[
          { key: 'facebook' as const, label: 'fb', color: '#1877f2', placeholder: 'https://facebook.com/yourpage' },
          { key: 'instagram' as const, label: 'ig', color: '#e1306c', placeholder: 'https://instagram.com/yourpage' },
          { key: 'line' as const, label: 'LINE', color: '#06c755', placeholder: '@lineid' },
        ].map((social) => (
          <div key={social.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: social.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 700,
                fontSize: 11,
                color: '#fff',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {social.label}
            </div>
            <input
              value={form[social.key]}
              onChange={(e) => set(social.key)(e.target.value)}
              placeholder={social.placeholder}
              style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', color: 'var(--text-col)', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 14, outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--cta-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-col)')}
            />
          </div>
        ))}
      </div>

      <SaveButton onClick={handleSave} saved={saved} />
    </div>
  )
}

// ── Payment Tab ───────────────────────────────────────────────────────────────
function PaymentTab() {
  const [saved, setSaved] = useState(false)
  const [currency, setCurrency] = useState<'LAK' | 'THB' | 'USD' | 'CNY'>('LAK')
  const [cashEnabled, setCashEnabled] = useState(true)
  const [bcelEnabled, setBcelEnabled] = useState(true)
  const [bankEnabled, setBankEnabled] = useState(false)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [bankAccount, setBankAccount] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const qrRef = useRef<HTMLInputElement>(null)

  const currencies = [
    { code: 'LAK', label: 'Lao Kip', symbol: '₭' },
    { code: 'THB', label: 'Thai Baht', symbol: '฿' },
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
  ] as const

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <SectionHeader title="Payment Settings" subtitle="Configure currencies and accepted payment methods" />

      {/* Currency */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 12 }}>Currency</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {currencies.map((c) => (
            <label
              key={c.code}
              onClick={() => setCurrency(c.code)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '14px 8px',
                borderRadius: 10,
                border: currency === c.code ? '2px solid var(--cta-primary)' : '1px solid var(--border-col)',
                background: currency === c.code ? 'rgba(249,115,22,0.08)' : 'var(--main-bg)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: currency === c.code ? 'var(--cta-primary)' : 'var(--text-col)' }}>
                {c.symbol}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: currency === c.code ? 'var(--cta-primary)' : 'var(--text-col)' }}>
                {c.code}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted-col)', textAlign: 'center' }}>{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Divider />

      {/* Payment Methods */}
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 16 }}>Payment Methods</p>

      {/* Cash */}
      <div
        style={{
          background: 'var(--main-bg)',
          border: '1px solid var(--border-col)',
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>💵</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', margin: 0 }}>Cash</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-col)', margin: 0 }}>Accept cash payments at counter</p>
            </div>
          </div>
          <Toggle value={cashEnabled} onChange={setCashEnabled} />
        </div>
      </div>

      {/* BCEL OnePay */}
      <div
        style={{
          background: 'var(--main-bg)',
          border: '1px solid var(--border-col)',
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: bcelEnabled ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>📱</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', margin: 0 }}>BCEL OnePay</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-col)', margin: 0 }}>QR code payment via BCEL app</p>
            </div>
          </div>
          <Toggle value={bcelEnabled} onChange={setBcelEnabled} />
        </div>
        {bcelEnabled && (
          <div
            style={{
              borderTop: '1px solid var(--border-col)',
              paddingTop: 14,
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--text-muted-col)', marginBottom: 10 }}>QR Code Image</p>
            <div
              onClick={() => qrRef.current?.click()}
              style={{
                border: '2px dashed var(--border-col)',
                borderRadius: 8,
                padding: qrPreview ? 12 : 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--cta-primary)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-col)')}
            >
              {qrPreview ? (
                <>
                  <img src={qrPreview} alt="QR" style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 6 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted-col)' }}>Click to replace</span>
                </>
              ) : (
                <>
                  <Upload size={20} style={{ color: 'var(--text-muted-col)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted-col)' }}>Upload QR image</span>
                </>
              )}
            </div>
            <input
              ref={qrRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setQrPreview(URL.createObjectURL(f))
              }}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Bank Transfer */}
      <div
        style={{
          background: 'var(--main-bg)',
          border: '1px solid var(--border-col)',
          borderRadius: 10,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: bankEnabled ? 14 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>🏦</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', margin: 0 }}>Bank Transfer</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-col)', margin: 0 }}>Direct bank account transfer</p>
            </div>
          </div>
          <Toggle value={bankEnabled} onChange={setBankEnabled} />
        </div>
        {bankEnabled && (
          <div style={{ borderTop: '1px solid var(--border-col)', paddingTop: 14 }}>
            <InputField
              label="Bank Account Number / Name"
              value={bankAccount}
              onChange={setBankAccount}
              placeholder="e.g. BCEL 030-0-01234-5 — Shop Name"
            />
          </div>
        )}
      </div>

      <Divider />

      {/* Tax Rate */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 12 }}>Tax</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 120 }}>
            <input
              type="number"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              style={{
                background: 'var(--main-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
                borderRadius: 8,
                padding: '8px 36px 8px 12px',
                width: '100%',
                fontSize: 14,
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--cta-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-col)')}
            />
            <span
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14,
                color: 'var(--text-muted-col)',
              }}
            >
              %
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted-col)' }}>
            {taxRate === '0' ? 'No tax applied' : `${taxRate}% will be added to order totals`}
          </span>
        </div>
      </div>

      <SaveButton onClick={handleSave} saved={saved} />
    </div>
  )
}

// ── Language & Region Tab ─────────────────────────────────────────────────────
function LanguageTab() {
  const [saved, setSaved] = useState(false)
  const [lang, setLang] = useState<'lo' | 'th' | 'en' | 'zh'>('lo')
  const [dateFormat, setDateFormat] = useState<'DMY' | 'MDY'>('DMY')
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h')
  const [timezone, setTimezone] = useState('Asia/Vientiane')

  const languages = [
    { code: 'lo' as const, flag: '🇱🇦', label: 'ລາວ', sublabel: 'Lao' },
    { code: 'th' as const, flag: '🇹🇭', label: 'ไทย', sublabel: 'Thai' },
    { code: 'en' as const, flag: '🇬🇧', label: 'English', sublabel: 'English' },
    { code: 'zh' as const, flag: '🇨🇳', label: '中文', sublabel: 'Chinese' },
  ]

  const timezones = [
    'Asia/Vientiane',
    'Asia/Bangkok',
    'Asia/Shanghai',
    'Asia/Singapore',
    'UTC',
  ]

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <SectionHeader title="Language & Region" subtitle="Set the default language and regional display formats" />

      {/* Language */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 12 }}>Default Language</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px 8px',
                borderRadius: 10,
                border: lang === l.code ? '2px solid var(--cta-primary)' : '1px solid var(--border-col)',
                background: lang === l.code ? 'rgba(249,115,22,0.08)' : 'var(--main-bg)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 28 }}>{l.flag}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: lang === l.code ? 'var(--cta-primary)' : 'var(--text-col)', margin: 0 }}>
                  {l.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-col)', margin: 0 }}>{l.sublabel}</p>
              </div>
              {lang === l.code && (
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--cta-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} color="#fff" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Date & Time Formats */}
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 16 }}>Date & Time Formats</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Date Format */}
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted-col)', fontWeight: 500, marginBottom: 10 }}>Date Format</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['DMY', 'MDY'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setDateFormat(fmt)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 8,
                  border: dateFormat === fmt ? '2px solid var(--cta-primary)' : '1px solid var(--border-col)',
                  background: dateFormat === fmt ? 'rgba(249,115,22,0.08)' : 'var(--main-bg)',
                  color: dateFormat === fmt ? 'var(--cta-primary)' : 'var(--text-col)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {fmt === 'DMY' ? 'DD/MM/YYYY' : 'MM/DD/YYYY'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted-col)', marginTop: 6 }}>
            Preview: {dateFormat === 'DMY' ? '14/06/2026' : '06/14/2026'}
          </p>
        </div>

        {/* Time Format */}
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted-col)', fontWeight: 500, marginBottom: 10 }}>Time Format</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['12h', '24h'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTimeFormat(fmt)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 8,
                  border: timeFormat === fmt ? '2px solid var(--cta-primary)' : '1px solid var(--border-col)',
                  background: timeFormat === fmt ? 'rgba(249,115,22,0.08)' : 'var(--main-bg)',
                  color: timeFormat === fmt ? 'var(--cta-primary)' : 'var(--text-col)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted-col)', marginTop: 6 }}>
            Preview: {timeFormat === '12h' ? '03:45 PM' : '15:45'}
          </p>
        </div>
      </div>

      {/* Timezone */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, color: 'var(--text-muted-col)', fontWeight: 500, display: 'block', marginBottom: 8 }}>
          Timezone
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{
              background: 'var(--main-bg)',
              border: '1px solid var(--border-col)',
              color: 'var(--text-col)',
              borderRadius: 8,
              padding: '8px 36px 8px 12px',
              width: '100%',
              fontSize: 14,
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer',
            }}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz} style={{ background: 'var(--card-bg)' }}>
                {tz}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted-col)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      <SaveButton onClick={handleSave} saved={saved} />
    </div>
  )
}

// ── Receipt & Printer Tab ─────────────────────────────────────────────────────
function ReceiptTab() {
  const [saved, setSaved] = useState(false)
  const [header, setHeader] = useState('Thank you for visiting Basic Chinese Bun!')
  const [footer, setFooter] = useState('Please come again. Follow us on Facebook & Instagram!')
  const [showLogo, setShowLogo] = useState(true)
  const [printerType, setPrinterType] = useState<'browser' | 'bluetooth'>('browser')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <SectionHeader title="Receipt & Printer" subtitle="Customize printed receipts and configure your printer" />

      {/* Receipt Content */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 14 }}>Receipt Content</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-muted-col)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Header Text
            </label>
            <textarea
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              rows={2}
              placeholder="Text printed at the top of receipt..."
              style={{
                background: 'var(--main-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
                borderRadius: 8,
                padding: '8px 12px',
                width: '100%',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--cta-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-col)')}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-muted-col)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Footer Text
            </label>
            <textarea
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              rows={2}
              placeholder="Text printed at the bottom of receipt..."
              style={{
                background: 'var(--main-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
                borderRadius: 8,
                padding: '8px 12px',
                width: '100%',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--cta-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-col)')}
            />
          </div>
        </div>
      </div>

      {/* Show Logo Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--main-bg)',
          border: '1px solid var(--border-col)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
        }}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', margin: 0 }}>Show Logo on Receipt</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted-col)', margin: 0 }}>Print the shop logo at the top</p>
        </div>
        <Toggle value={showLogo} onChange={setShowLogo} />
      </div>

      <Divider />

      {/* Printer Type */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 12 }}>Printer Type</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            { id: 'browser' as const, icon: '🖨️', label: 'Browser Print', desc: 'Standard system print dialog' },
            { id: 'bluetooth' as const, icon: '📡', label: 'Bluetooth ESC/POS', desc: 'Thermal receipt printer via BT' },
          ]).map((pt) => (
            <button
              key={pt.id}
              onClick={() => setPrinterType(pt.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                border: printerType === pt.id ? '2px solid var(--cta-primary)' : '1px solid var(--border-col)',
                background: printerType === pt.id ? 'rgba(249,115,22,0.08)' : 'var(--main-bg)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 24 }}>{pt.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: printerType === pt.id ? 'var(--cta-primary)' : 'var(--text-col)', margin: 0 }}>
                  {pt.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-col)', margin: 0 }}>{pt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 12 }}>Receipt Font Size</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['small', 'medium', 'large'] as const).map((sz) => (
            <button
              key={sz}
              onClick={() => setFontSize(sz)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 8,
                border: fontSize === sz ? '2px solid var(--cta-primary)' : '1px solid var(--border-col)',
                background: fontSize === sz ? 'rgba(249,115,22,0.08)' : 'var(--main-bg)',
                color: fontSize === sz ? 'var(--cta-primary)' : 'var(--text-col)',
                fontSize: sz === 'small' ? 12 : sz === 'medium' ? 14 : 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Box */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border-col)',
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
          fontFamily: 'monospace',
          color: '#111',
          fontSize: fontSize === 'small' ? 11 : fontSize === 'medium' ? 13 : 15,
          maxWidth: 320,
        }}
      >
        <p style={{ textAlign: 'center', fontWeight: 700, borderBottom: '1px dashed #ccc', paddingBottom: 8, margin: '0 0 8px' }}>
          {showLogo ? '[ LOGO ]' : ''}
        </p>
        <p style={{ textAlign: 'center', margin: '0 0 8px', fontSize: 'inherit' }}>{header}</p>
        <p style={{ margin: '0 0 4px', borderTop: '1px dashed #ccc', paddingTop: 8 }}>Item × 2 ....... 40,000₭</p>
        <p style={{ margin: '0 0 8px' }}>Item × 1 ....... 15,000₭</p>
        <p style={{ fontWeight: 700, borderTop: '1px dashed #ccc', paddingTop: 8, margin: '0 0 8px' }}>TOTAL: 55,000₭</p>
        <p style={{ textAlign: 'center', fontSize: 'inherit', borderTop: '1px dashed #ccc', paddingTop: 8, margin: 0 }}>{footer}</p>
      </div>

      <SaveButton onClick={handleSave} saved={saved} />
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [saved, setSaved] = useState(false)
  const [newOrder, setNewOrder] = useState(true)
  const [orderReady, setOrderReady] = useState(true)
  const [lowStock, setLowStock] = useState(true)
  const [dailyReport, setDailyReport] = useState(false)
  const [sound, setSound] = useState(true)
  const [voice, setVoice] = useState(true)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const NotifRow = ({
    label,
    desc,
    value,
    onChange,
  }: {
    label: string
    desc: string
    value: boolean
    onChange: (v: boolean) => void
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0',
        borderBottom: '1px solid var(--border-col)',
      }}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted-col)', margin: '2px 0 0' }}>{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )

  return (
    <div>
      <SectionHeader title="Notifications" subtitle="Control which events trigger alerts and sounds" />

      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 4 }}>Order Alerts</p>
      <div style={{ marginBottom: 24 }}>
        <NotifRow label="New Order" desc="Alert when a new order is placed" value={newOrder} onChange={setNewOrder} />
        <NotifRow label="Order Ready" desc="Alert when an order is marked as ready" value={orderReady} onChange={setOrderReady} />
        <NotifRow label="Low Stock" desc="Alert when inventory drops below threshold" value={lowStock} onChange={setLowStock} />
        <NotifRow label="Daily Sales Report" desc="Send summary report at end of day" value={dailyReport} onChange={setDailyReport} />
      </div>

      <Divider />

      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 4 }}>Audio</p>
      <div>
        <NotifRow label="Notification Sound" desc="Play a chime when alerts are triggered" value={sound} onChange={setSound} />
        <NotifRow label="Voice Announcements" desc="Speak order / queue numbers aloud" value={voice} onChange={setVoice} />
      </div>

      <div style={{ marginTop: 24 }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  )
}

// ── Subscription Tab ──────────────────────────────────────────────────────────
function SubscriptionTab() {
  const plan = 'pro' // 'basic' | 'pro' | 'enterprise'

  const features = [
    { label: 'Unlimited orders per day', included: true },
    { label: 'Multi-language POS (4 languages)', included: true },
    { label: 'Bluetooth ESC/POS printer support', included: true },
    { label: 'Real-time inventory tracking', included: true },
    { label: 'Sales reports & analytics', included: true },
    { label: 'Payment slip uploads', included: true },
    { label: 'Multiple branches', included: false },
    { label: 'Custom domain & branding', included: false },
    { label: 'Dedicated support SLA', included: false },
  ]

  return (
    <div>
      <SectionHeader title="Subscription" subtitle="Manage your plan and billing" />

      {/* Current Plan Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
          border: '1px solid rgba(249,115,22,0.4)',
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(249,115,22,0.08)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Crown size={24} style={{ color: 'var(--cta-primary)' }} />
              <span
                style={{
                  background: 'var(--cta-primary)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 20,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Pro Plan
              </span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-col)', margin: '0 0 4px' }}>
              $29<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted-col)' }}>/month</span>
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted-col)', margin: 0 }}>
              Renews on <strong style={{ color: 'var(--text-col)' }}>July 14, 2026</strong>
            </p>
          </div>
          <span
            style={{
              background: 'rgba(22,163,74,0.15)',
              color: '#4ade80',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            Active
          </span>
        </div>
      </div>

      {/* Features List */}
      <div
        style={{
          background: 'var(--main-bg)',
          border: '1px solid var(--border-col)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-col)', marginBottom: 14 }}>
          What's included in your plan
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: f.included ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {f.included ? (
                  <Check size={12} color="#4ade80" />
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--text-muted-col)' }}>—</span>
                )}
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: f.included ? 'var(--text-col)' : 'var(--text-muted-col)',
                }}
              >
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Banner */}
      <div
        style={{
          background: 'var(--main-bg)',
          border: '1px solid var(--border-col)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-col)', margin: '0 0 4px' }}>
            Need multiple branches?
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted-col)', margin: 0 }}>
            Upgrade to Enterprise for unlimited branches, custom branding, and priority support.
          </p>
        </div>
        <button
          style={{
            background: 'transparent',
            border: '1px solid var(--cta-primary)',
            color: 'var(--cta-primary)',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget
            btn.style.background = 'var(--cta-primary)'
            btn.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget
            btn.style.background = 'transparent'
            btn.style.color = 'var(--cta-primary)'
          }}
        >
          Contact Sales
        </button>
      </div>

      {/* Billing Info */}
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-col)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted-col)', marginBottom: 12 }}>Billing</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            style={{
              background: 'var(--main-bg)',
              border: '1px solid var(--border-col)',
              color: 'var(--text-col)',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            View Invoices
          </button>
          <button
            style={{
              background: 'var(--main-bg)',
              border: '1px solid var(--border-col)',
              color: 'var(--text-col)',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Update Payment Method
          </button>
          <button
            style={{
              background: 'transparent',
              border: '1px solid rgba(220,38,38,0.4)',
              color: '#dc2626',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'shop', label: 'Shop Info', icon: <Store size={16} /> },
  { id: 'payment', label: 'Payment', icon: <CreditCard size={16} /> },
  { id: 'language', label: 'Language & Region', icon: <Globe size={16} /> },
  { id: 'receipt', label: 'Receipt & Printer', icon: <Printer size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'subscription', label: 'Subscription', icon: <Crown size={16} /> },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('shop')

  return (
    <div
      style={{
        padding: '24px',
        height: '100vh',
        overflowY: 'auto',
        color: 'var(--text-col)',
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted-col)', marginTop: 4 }}>
          Manage your shop configuration and preferences
        </p>
      </div>

      {/* Layout: Sidebar + Content */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Left Sidebar */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-col)',
            borderRadius: 12,
            padding: '8px 0',
            position: 'sticky',
            top: 0,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 16px',
                  background: isActive ? 'rgba(249,115,22,0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--cta-primary)' : '3px solid transparent',
                  color: isActive ? 'var(--cta-primary)' : 'var(--text-muted-col)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-col)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-muted-col)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{ flexShrink: 0 }}>{tab.icon}</span>
                <span style={{ lineHeight: 1.3 }}>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-col)',
            borderRadius: 12,
            padding: 28,
            minWidth: 0,
          }}
        >
          {activeTab === 'shop' && <ShopInfoTab />}
          {activeTab === 'payment' && <PaymentTab />}
          {activeTab === 'language' && <LanguageTab />}
          {activeTab === 'receipt' && <ReceiptTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'subscription' && <SubscriptionTab />}
        </div>
      </div>
    </div>
  )
}
