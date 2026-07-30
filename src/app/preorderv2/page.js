import { supabase } from '../../lib/supabase'

const CARD_BG = [
  'linear-gradient(150deg,#6B1800,#2A0800)',
  'linear-gradient(150deg,#0A3B18,#041A0A)',
  'linear-gradient(150deg,#12125A,#08082A)',
  'linear-gradient(150deg,#4A0870,#200336)',
  'linear-gradient(150deg,#612800,#2C0C00)',
  'linear-gradient(150deg,#003D4A,#001820)',
  'linear-gradient(150deg,#581515,#280606)',
  'linear-gradient(150deg,#155830,#071E10)',
]

const GOLD = 'radial-gradient(circle at 35% 30%, #F5DC8A 0%, #C8851A 48%, #7A4E08 100%)'

const FEATURES = [
  { n:'01', title:'ເຮັດໃໝ່ທຸກວັນ',  sub:'Fresh Daily',  desc:'ສາລາເປົາອົບສົດໃໝ່ທຸກເຊົ້າ ບໍ່ມີ stock ຄ້າງ' },
  { n:'02', title:'ສ່ວນປະກອບດີ',    sub:'Quality Ingredients', desc:'ໃຊ້ວັດຖຸດິບຄຸນນະພາບ ຄັດສັນມາຢ່າງດີ' },
  { n:'03', title:'ສາລາເປົາສົດ',    sub:'Steamed Fresh', desc:'ນຶ່ງໃໝ່ທຸກຮອບ ຮ້ອນໆ ນ້ຳໃສ' },
  { n:'04', title:'ສັ່ງລ່ວງໜ້າ',    sub:'Pre-Order Ready', desc:'ສັ່ງລ່ວງໜ້າ ຮັບຕາມເວລາທີ່ເລືອກ' },
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
  } catch { return defaults() }
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

  const heroImg = (visibleMenus[0] && images[visibleMenus[0].i]) || null
  const logoSrc = txt(shopInfo.logo) || '/logo.jpg'

  return (
    <div style={{
      background: '#120800',
      color: '#FAF0E0',
      fontFamily: "'Noto Sans Lao', system-ui, -apple-system, sans-serif",
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative',
    }}>

      {/* ── page-wide ambient warm glow top-right ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: '70vw', height: '50vh',
        background: 'radial-gradient(ellipse at 80% 10%, rgba(180,100,10,.14) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── bun pattern watermark ── */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/bun-pattern.png)',
        backgroundSize: '160%',
        backgroundPosition: '60% 20%',
        opacity: 0.022,
        filter: 'sepia(1) brightness(0.5)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ NAV ══ */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 20px',
          borderBottom: '1px solid rgba(200,149,26,.08)',
          backdropFilter: 'blur(8px)',
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(18,8,0,.85)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
              border: '1.5px solid rgba(200,149,26,.45)',
              flexShrink: 0,
            }}>
              <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '.82rem', color: '#D4A832', letterSpacing: '.03em' }}>
              {txt(shopInfo.name, 'Basic Chinese Bun')}
            </span>
          </div>
          <a href="/preorder" style={{
            background: 'linear-gradient(135deg,#C8951A,#8A6008)',
            color: '#120800', fontWeight: 900, fontSize: '.75rem',
            padding: '8px 17px', borderRadius: 99, textDecoration: 'none',
            letterSpacing: '.06em', boxShadow: '0 4px 16px rgba(200,149,26,.28)',
          }}>ສັ່ງດ່ວນ</a>
        </nav>

        {/* ══ HERO ══ */}
        <section style={{
          display: 'flex', alignItems: 'center',
          gap: 20,
          padding: '52px 24px 48px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* left warm glow */}
          <div style={{
            position: 'absolute', left: -60, top: '20%',
            width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,130,10,.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* ── text ── */}
          <div style={{ flex: 1, zIndex: 1, minWidth: 0 }}>
            <div style={{
              display: 'inline-block',
              fontSize: '.58rem', fontWeight: 800, color: '#C8951A',
              letterSpacing: '.22em', marginBottom: 14,
              paddingBottom: 6,
              borderBottom: '1px solid rgba(200,149,26,.25)',
            }}>
              BASIC CHINESE BUN
            </div>
            <h1 style={{
              margin: 0, lineHeight: 1.12, letterSpacing: '-.01em',
            }}>
              <span style={{ display: 'block', fontSize: '1.55rem', fontWeight: 700, color: 'rgba(250,240,224,.55)' }}>ສຳຜັດ</span>
              <span style={{ display: 'block', fontSize: '2.8rem', fontWeight: 900, color: '#FAF0E0', lineHeight: 1 }}>ຄວາມ</span>
              <span style={{ display: 'block', fontSize: '2.8rem', fontWeight: 900, color: '#D4A832', lineHeight: 1.1 }}>ອຮ່ອຍ</span>
            </h1>
            <p style={{ margin: '14px 0 24px', fontSize: '.73rem', color: 'rgba(250,240,224,.38)', lineHeight: 1.75, letterSpacing: '.02em' }}>
              ສາລາເປົາ ສົດໃໝ່ທຸກວັນ<br/>ນຶ່ງໃໝ່ທຸກຮອບ
            </p>
            <a href="/preorder" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'linear-gradient(135deg,#C8951A,#8A6008)',
              color: '#120800', fontWeight: 900, fontSize: '.84rem',
              padding: '12px 22px', borderRadius: 99, textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(200,149,26,.32)',
              letterSpacing: '.02em',
            }}>
              ເລືອກເມນູ <span style={{ fontSize: '1em' }}>→</span>
            </a>
          </div>

          {/* ── hero circle image ── */}
          <div style={{ flexShrink: 0, width: 150, position: 'relative', zIndex: 1 }}>
            {/* outer ring */}
            <div style={{
              position: 'absolute', inset: -7,
              borderRadius: '50%',
              border: '1px solid rgba(200,149,26,.18)',
              pointerEvents: 'none',
            }} />
            <div style={{
              width: 150, height: 150, borderRadius: '50%', overflow: 'hidden',
              border: '2px solid rgba(200,149,26,.45)',
              boxShadow: '0 24px 60px rgba(0,0,0,.75)',
            }}>
              <img src={heroImg || logoSrc} alt="bun" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', top: -10, right: -2,  width: 16, height: 16, borderRadius: '50%', background: GOLD, boxShadow: '0 4px 10px rgba(200,133,26,.5)' }} />
            <div style={{ position: 'absolute', top: '38%', right: -12, width: 10, height: 10, borderRadius: '50%', background: GOLD }} />
            <div style={{ position: 'absolute', bottom: -2, right: 14, width: 12, height: 12, borderRadius: '50%', background: GOLD, boxShadow: '0 3px 8px rgba(200,133,26,.35)' }} />
            <div style={{ position: 'absolute', bottom: 18, left: -8, width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
          </div>
        </section>

        {/* ── divider ── */}
        <div style={{ height: 1, margin: '0 24px', background: 'linear-gradient(90deg,transparent,rgba(200,149,26,.12) 25%,rgba(200,149,26,.12) 75%,transparent)' }} />

        {/* ══ MENU CARDS ══ */}
        <section style={{ padding: '32px 0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 24px', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: '.58rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.2em', marginBottom: 5 }}>MENU · ເມນູ</div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#FAF0E0' }}>ເລືອກໄດ້ເລີຍ</div>
            </div>
            <a href="/preorder" style={{ fontSize: '.72rem', color: '#C8951A', fontWeight: 700, textDecoration: 'none', opacity: .8 }}>
              ທັງໝົດ →
            </a>
          </div>

          {visibleMenus.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(250,240,224,.25)', fontSize: '.8rem' }}>
              ສິນຄ້າໝົດຊົ່ວຄາວ
            </div>
          ) : (
            <div style={{
              display: 'flex', gap: 14,
              overflowX: 'auto',
              padding: '56px 24px 32px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}>
              {visibleMenus.map(({ m, i }) => (
                <a key={i} href="/preorder" style={{
                  flexShrink: 0, scrollSnapAlign: 'start',
                  textDecoration: 'none',
                  width: 154,
                  paddingTop: 46,
                  position: 'relative',
                  display: 'block',
                }}>
                  {/* floating circle */}
                  <div style={{
                    position: 'absolute', top: 0,
                    left: '50%', transform: 'translateX(-50%)',
                    width: 92, height: 92,
                    borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid rgba(200,149,26,.35)',
                    boxShadow: '0 10px 28px rgba(0,0,0,.6), 0 0 0 5px rgba(200,149,26,.04)',
                    background: CARD_BG[i % CARD_BG.length],
                    zIndex: 2,
                  }}>
                    {images[i] && (
                      <img src={images[i]} alt={txt(m)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>

                  {/* card body */}
                  <div style={{
                    borderRadius: 20,
                    background: 'linear-gradient(160deg,#1E0E04,#160A02)',
                    border: '1px solid rgba(200,149,26,.1)',
                    boxShadow: '0 6px 24px rgba(0,0,0,.5)',
                    padding: '54px 14px 18px',
                    textAlign: 'center',
                    position: 'relative', zIndex: 1,
                  }}>
                    <div style={{ fontWeight: 900, fontSize: '.85rem', color: '#FAF0E0', lineHeight: 1.3, marginBottom: 14 }}>
                      {txt(m, '?')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#D4A832', fontWeight: 900, fontSize: '.7rem', letterSpacing: '.01em' }}>
                        {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                      </span>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#C8951A,#8A6008)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#120800', fontWeight: 900, fontSize: '1.05rem',
                        boxShadow: '0 3px 10px rgba(200,149,26,.28)',
                        flexShrink: 0,
                      }}>+</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* ── divider ── */}
        <div style={{ height: 1, margin: '0 24px', background: 'linear-gradient(90deg,transparent,rgba(200,149,26,.12) 25%,rgba(200,149,26,.12) 75%,transparent)' }} />

        {/* ══ FEATURES — large ghost numbers ══ */}
        <section style={{ padding: '44px 24px 48px', position: 'relative' }}>
          {/* section label */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: '.58rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.22em', marginBottom: 8 }}>WHY BCB</div>
            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#FAF0E0', lineHeight: 1.2 }}>
              ທຳໄມຕ້ອງ<br/>
              <span style={{ color: '#D4A832' }}>Basic Chinese Bun</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px 20px' }}>
            {FEATURES.map(({ n, title, sub, desc }) => (
              <div key={n} style={{ position: 'relative' }}>
                {/* big ghost number */}
                <div style={{
                  fontSize: '5.5rem', fontWeight: 900, lineHeight: 1,
                  color: 'rgba(200,149,26,.07)',
                  letterSpacing: '-.04em',
                  fontVariantNumeric: 'tabular-nums',
                  marginBottom: -22,
                  marginLeft: -4,
                  userSelect: 'none',
                }}>
                  {n}
                </div>
                {/* gold left accent */}
                <div style={{
                  width: 2, height: 32, borderRadius: 2,
                  background: 'linear-gradient(to bottom,#C8951A,rgba(200,149,26,0))',
                  marginBottom: 8,
                }} />
                <div style={{ fontWeight: 900, fontSize: '.86rem', color: '#FAF0E0', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: '.64rem', fontWeight: 700, color: '#C8951A', letterSpacing: '.06em', marginBottom: 6, opacity: .75 }}>{sub}</div>
                <div style={{ fontSize: '.7rem', color: 'rgba(250,240,224,.35)', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── divider ── */}
        <div style={{ height: 1, margin: '0 24px', background: 'linear-gradient(90deg,transparent,rgba(200,149,26,.12) 25%,rgba(200,149,26,.12) 75%,transparent)' }} />

        {/* ══ CTA ══ */}
        <section style={{ padding: '44px 24px 68px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.58rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.2em', marginBottom: 12 }}>ORDER NOW</div>
              <div style={{ fontWeight: 900, fontSize: '1.35rem', color: '#FAF0E0', lineHeight: 1.28, marginBottom: 20 }}>
                ຄົ້ນຫາໄສ້<br/>ທີ່ທ່ານຊອບ
              </div>
              <a href="/preorder" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'linear-gradient(135deg,#C8951A,#8A6008)',
                color: '#120800', fontWeight: 900, fontSize: '.88rem',
                padding: '13px 24px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(200,149,26,.3)',
                letterSpacing: '.02em',
              }}>
                ສັ່ງດ່ວນ <span>→</span>
              </a>
            </div>
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%',
                border: '1px solid rgba(200,149,26,.14)',
                pointerEvents: 'none',
              }} />
              <div style={{
                width: 116, height: 116, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid rgba(200,149,26,.4)',
                boxShadow: '0 16px 48px rgba(0,0,0,.7)',
              }}>
                <img src={heroImg || logoSrc} alt="bun" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', top: -8,  right: -4, width: 14, height: 14, borderRadius: '50%', background: GOLD, boxShadow: '0 4px 10px rgba(200,133,26,.45)' }} />
              <div style={{ position: 'absolute', bottom: -4, left: -2, width: 10, height: 10, borderRadius: '50%', background: GOLD }} />
              <div style={{ position: 'absolute', top: '45%', right: -14, width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <div style={{
          borderTop: '1px solid rgba(200,149,26,.06)',
          textAlign: 'center', padding: '18px 20px',
          fontSize: '.66rem', fontWeight: 600,
          color: 'rgba(250,240,224,.15)', letterSpacing: '.06em',
        }}>
          {txt(shopInfo.name, 'Basic Chinese Bun')} &nbsp;·&nbsp; {txt(shopInfo.address, 'ວຽງຈັນ, ລາວ')}
        </div>

      </div>
    </div>
  )
}
