export default function PreorderV2Page() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF2E7', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#2E1C12',
        padding: '48px 24px 52px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        textAlign: 'center',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid rgba(253,246,238,.2)',
        }}>
          <img src="/logo.jpg" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ color: '#FAF2E7', fontWeight: 900, fontSize: '1.5rem' }}>
            Basic Chinese Bun
          </div>
          <div style={{ color: 'rgba(253,246,238,.5)', fontSize: '.88rem', marginTop: 6 }}>
            ສາລາເປົາ · ໝົມປັງໂຕ · ສົດໃໝ່ທຸກວັນ
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 20px' }}>
        <p style={{ fontWeight: 900, fontSize: '1.1rem', color: '#2E1C12', marginBottom: 8 }}>
          ກຳລັງໂຫຼດເມນູ...
        </p>
        <p style={{ fontSize: '.82rem', color: '#9E7B6A' }}>
          (diagnostic — no JS version)
        </p>
      </div>

      <div style={{ padding: '12px 20px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <a href="/preorder" style={{
          display: 'block',
          background: '#00A859',
          color: '#fff',
          fontWeight: 900,
          fontSize: '1rem',
          textAlign: 'center',
          padding: '17px 0',
          borderRadius: 99,
          textDecoration: 'none',
        }}>
          ສັ່ງດ່ວນ →
        </a>
      </div>

      <div style={{
        background: '#2E1C12', color: 'rgba(253,246,238,.4)',
        textAlign: 'center', padding: '20px', fontSize: '.75rem', fontWeight: 600,
      }}>
        Basic Chinese Bun · ວຽງຈັນ, ລາວ
      </div>
    </div>
  )
}
