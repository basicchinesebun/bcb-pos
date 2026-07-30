import { supabase } from '../../lib/supabase'

const PALETTE = [
  '#7B3F00', '#1B4F2A', '#1A2D5A', '#4a1942',
  '#2d4a1a', '#5c2d00', '#1a3d4a', '#3d1f4a',
]

async function getShopData() {
  try {
    const { data } = await supabase.from('shop_config').select('*')
    if (!data) return defaults()
    const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
    return {
      menus:    tryParse(cfg.menus,        []),
      prices:   tryParse(cfg.prices,       []),
      images:   tryParse(cfg.menu_images,  {}),
      shopInfo: tryParse(cfg.shop_info,    { name: 'Basic Chinese Bun' }),
      stock:    tryParse(cfg.stock_online, []),
    }
  } catch {
    return defaults()
  }
}

function tryParse(val, fallback) {
  try { return val ? JSON.parse(val) : fallback } catch { return fallback }
}

function txt(val, fallback = '') {
  if (!val) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'object') return val.lo || val.en || fallback
  return fallback
}

function defaults() {
  return { menus: [], prices: [], images: {}, shopInfo: { name: 'Basic Chinese Bun' }, stock: [] }
}

export default async function PreorderV2Page() {
  const { menus, prices, images, shopInfo, stock } = await getShopData()

  const visibleMenus = menus
    .map((m, i) => ({ m, i }))
    .filter(({ i }) => stock.length === 0 || (stock[i] ?? 1) > 0)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF2E7', fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{
        background: '#2E1C12',
        padding: '48px 24px 52px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        textAlign: 'center',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid rgba(253,246,238,.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        }}>
          <img src={txt(shopInfo.logo) || '/logo.jpg'} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ color: '#FAF2E7', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '.01em' }}>
            {txt(shopInfo.name, 'Basic Chinese Bun')}
          </div>
          <div style={{ color: 'rgba(253,246,238,.5)', fontSize: '.88rem', marginTop: 6, fontWeight: 600 }}>
            ສາລາເປົາ · ໝົມປັງໂຕ · ສົດໃໝ່ທຸກວັນ
          </div>
        </div>
      </div>

      {/* Wave */}
      <svg viewBox="0 0 400 32" style={{ display: 'block', background: '#2E1C12', marginBottom: -1 }}>
        <path d="M0,0 Q100,32 200,16 Q300,0 400,24 L400,32 L0,32Z" fill="#FAF2E7" />
      </svg>

      {/* Cards */}
      <div style={{ padding: '32px 20px 20px' }}>
        <p style={{ fontWeight: 900, fontSize: '1.1rem', color: '#2E1C12', marginBottom: 6 }}>
          ເລືອກໄດ້ຫຼາຍຮົດ 🥟
        </p>
        <p style={{ fontSize: '.82rem', color: '#9E7B6A', marginBottom: 28 }}>
          ເລື່ອນເບິ່ງເມນູທັງໝົດ
        </p>

        {visibleMenus.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9E7B6A', fontWeight: 700 }}>
            ສິນຄ້າໝົດຊົ່ວຄາວ
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 16,
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}>
            {visibleMenus.map(({ m, i }) => (
              <div key={i} style={{ flexShrink: 0, scrollSnapAlign: 'start' }}>
                <div style={{
                  width: 150, height: 200,
                  borderRadius: 20,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(46,28,18,.3), 0 6px 16px rgba(46,28,18,.15)',
                  animation: `bcbFloat 3.2s ease-in-out ${(i * 0.45) % 2}s infinite`,
                }}>
                  {images[i]
                    ? <img src={images[i]} alt={m} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ position: 'absolute', inset: 0, background: PALETTE[i % PALETTE.length] }} />
                  }
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,.72) 40%, transparent 70%)',
                  }} />
                  {!images[i] && (
                    <div style={{
                      position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
                      fontSize: '3.6rem',
                    }}>🥟</div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px 16px' }}>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: '.88rem', lineHeight: 1.25, marginBottom: 3 }}>
                      {txt(m, '?')}
                    </div>
                    <div style={{ color: '#FFD87A', fontWeight: 800, fontSize: '.78rem' }}>
                      {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 20px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <a href="/preorder" style={{
          display: 'block', background: '#00A859', color: '#fff',
          fontWeight: 900, fontSize: '1rem', textAlign: 'center',
          padding: '17px 0', borderRadius: 99, textDecoration: 'none',
          boxShadow: '0 6px 24px rgba(0,168,89,.35)', letterSpacing: '.02em',
        }}>
          ສັ່ງດ່ວນ →
        </a>
        <a href="/preorder" style={{
          display: 'block', color: '#9E7B6A', fontWeight: 700,
          fontSize: '.82rem', textAlign: 'center', textDecoration: 'none',
        }}>
          ເບິ່ງລາຄາ · ຊ່ອງທາງຊຳລະ · ຕິດຕໍ່ຮ້ານ
        </a>
      </div>

      {/* Footer */}
      <div style={{
        background: '#2E1C12', color: 'rgba(253,246,238,.4)',
        textAlign: 'center', padding: '20px', fontSize: '.75rem', fontWeight: 600,
      }}>
        {txt(shopInfo.name, 'Basic Chinese Bun')} · {txt(shopInfo.address, 'ວຽງຈັນ, ລາວ')}
      </div>
    </div>
  )
}
