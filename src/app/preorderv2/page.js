import { supabase } from '../../lib/supabase'

const CARD_GRADIENTS = [
  'linear-gradient(150deg, #8B2500 0%, #3D0F00 100%)',
  'linear-gradient(150deg, #0D4A1F 0%, #042410 100%)',
  'linear-gradient(150deg, #1A1A6B 0%, #0A0A35 100%)',
  'linear-gradient(150deg, #5B0B8C 0%, #2A0542 100%)',
  'linear-gradient(150deg, #7A3200 0%, #380E00 100%)',
  'linear-gradient(150deg, #004D5C 0%, #001F25 100%)',
  'linear-gradient(150deg, #6B1A1A 0%, #300808 100%)',
  'linear-gradient(150deg, #1A6B3A 0%, #0A3520 100%)',
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
    <div style={{
      minHeight: '100vh',
      background: '#100A05',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflowX: 'hidden',
      color: '#FFFBF5',
    }}>

      {/* ── Hero ── */}
      <div style={{
        minHeight: '56vh',
        background: 'radial-gradient(ellipse 90% 70% at 50% 45%, #2C1608 0%, #1C0D04 55%, #100A05 100%)',
        padding: '52px 24px 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 18,
        textAlign: 'center',
        position: 'relative',
      }}>

        {/* dot grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,200,80,.045) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          pointerEvents: 'none',
        }} />

        {/* logo */}
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <div style={{
            position: 'absolute', inset: -10,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,180,50,.2) 0%, transparent 70%)',
          }} />
          <div style={{
            width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
            border: '2px solid rgba(255,200,80,.45)',
            boxShadow: '0 0 0 7px rgba(255,170,40,.07), 0 0 50px rgba(255,140,40,.18)',
          }}>
            <img
              src={txt(shopInfo.logo) || '/logo.jpg'}
              alt="logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* name + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <h1 style={{
            margin: 0,
            color: '#FFFBF5', fontWeight: 900, fontSize: '2.4rem',
            letterSpacing: '-.03em', lineHeight: 1.05,
          }}>
            {txt(shopInfo.name, 'Basic Chinese Bun')}
          </h1>
          <p style={{
            margin: 0,
            color: 'rgba(255,208,80,.65)', fontSize: '.78rem',
            fontWeight: 600, letterSpacing: '.08em',
          }}>
            ສາລາເປົາ &nbsp;·&nbsp; ໝົມປັງໂຕ &nbsp;·&nbsp; ສົດໃໝ່ທຸກວັນ
          </p>
        </div>

        {/* open badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,140,40,.13)',
          border: '1px solid rgba(255,140,40,.28)',
          borderRadius: 99, padding: '7px 18px',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#4ADE80',
            boxShadow: '0 0 0 3px rgba(74,222,128,.25)',
          }} />
          <span style={{
            color: '#FFD060', fontSize: '.72rem',
            fontWeight: 800, letterSpacing: '.08em',
          }}>
            ເປີດຮັບຄຳສັ່ງທຸກວັນ
          </span>
        </div>
      </div>

      {/* ── thin gold rule ── */}
      <div style={{
        height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,200,80,.12) 40%, rgba(255,200,80,.12) 60%, transparent 100%)',
      }} />

      {/* ── Menu section ── */}
      <div style={{ padding: '28px 18px 16px' }}>

        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div>
            <div style={{
              fontSize: '.62rem', fontWeight: 800, color: '#FF8C28',
              letterSpacing: '.16em', marginBottom: 5,
            }}>
              ເມນູ · MENU
            </div>
            <div style={{
              fontWeight: 900, fontSize: '1.3rem', color: '#FFFBF5', lineHeight: 1,
            }}>
              ເລືອກສິ່ງທີ່ຊອບ 🥟
            </div>
          </div>
          {visibleMenus.length > 0 && (
            <div style={{
              background: 'rgba(255,140,40,.1)',
              border: '1px solid rgba(255,140,40,.2)',
              borderRadius: 99, padding: '5px 13px',
              fontSize: '.7rem', fontWeight: 800, color: '#FF8C28',
            }}>
              {visibleMenus.length} ລາຍການ
            </div>
          )}
        </div>

        {visibleMenus.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: 'rgba(255,251,245,.3)', fontWeight: 700,
          }}>
            ສິນຄ້າໝົດຊົ່ວຄາວ
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {visibleMenus.map(({ m, i }) => (
              <a
                key={i}
                href="/preorder"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  borderRadius: 22,
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '3 / 4',
                  background: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                  border: '1px solid rgba(255,200,80,.07)',
                  boxShadow: '0 8px 36px rgba(0,0,0,.55)',
                  animation: `bcbFloat 3.6s ease-in-out ${(i * 0.55) % 2.8}s infinite`,
                }}>

                  {images[i] && (
                    <img
                      src={images[i]}
                      alt={txt(m)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}

                  {/* dark gradient overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(4,2,0,.96) 0%, rgba(4,2,0,.55) 45%, rgba(4,2,0,.08) 100%)',
                  }} />

                  {/* shine */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '50%', height: '36%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,.07) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />

                  {/* text */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 13px 15px' }}>
                    <div style={{
                      color: '#FFFBF5', fontWeight: 900, fontSize: '.86rem',
                      lineHeight: 1.3, marginBottom: 9,
                    }}>
                      {txt(m, '?')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        background: 'rgba(255,208,96,.14)',
                        border: '1px solid rgba(255,208,96,.28)',
                        borderRadius: 99, padding: '3px 9px',
                        color: '#FFD060', fontWeight: 900, fontSize: '.7rem',
                      }}>
                        {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                      </div>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(255,140,40,.22)',
                        border: '1px solid rgba(255,140,40,.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#FF8C28', fontSize: '.85rem', fontWeight: 900,
                        flexShrink: 0,
                      }}>
                        +
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '28px 18px 60px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <a href="/preorder" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'linear-gradient(135deg, #FF8C28 0%, #E06010 100%)',
          color: '#fff', fontWeight: 900, fontSize: '1.05rem',
          padding: '18px 0', borderRadius: 99, textDecoration: 'none',
          boxShadow: '0 12px 40px rgba(255,140,40,.32), 0 3px 10px rgba(255,100,0,.2)',
          letterSpacing: '.04em',
        }}>
          <span>ສັ່ງດ່ວນ</span>
          <span style={{ fontSize: '1.15em' }}>→</span>
        </a>
        <a href="/preorder" style={{
          display: 'block', color: 'rgba(255,251,245,.35)', fontWeight: 700,
          fontSize: '.78rem', textAlign: 'center', textDecoration: 'none', padding: '2px 0',
        }}>
          ເບິ່ງລາຄາ · ຊ່ອງທາງຊຳລະ · ຕິດຕໍ່ຮ້ານ
        </a>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid rgba(255,200,80,.07)',
        textAlign: 'center', padding: '20px',
        fontSize: '.7rem', fontWeight: 600,
        color: 'rgba(255,251,245,.18)',
        letterSpacing: '.04em',
      }}>
        {txt(shopInfo.name, 'Basic Chinese Bun')} &nbsp;·&nbsp; {txt(shopInfo.address, 'ວຽງຈັນ, ລາວ')}
      </div>

    </div>
  )
}
