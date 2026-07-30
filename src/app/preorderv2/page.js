import { supabase } from '../../lib/supabase'

const CARD_BG = [
  'linear-gradient(150deg,#8B2500,#3D0F00)',
  'linear-gradient(150deg,#0D4A1F,#042410)',
  'linear-gradient(150deg,#1A1A6B,#0A0A35)',
  'linear-gradient(150deg,#5B0B8C,#2A0542)',
  'linear-gradient(150deg,#7A3200,#380E00)',
  'linear-gradient(150deg,#004D5C,#001F25)',
  'linear-gradient(150deg,#6B1A1A,#300808)',
  'linear-gradient(150deg,#1A6B3A,#0A3520)',
]

const GOLD = 'radial-gradient(circle at 35% 30%, #F5DC8A 0%, #C8851A 48%, #7A4E08 100%)'

const FEATURES = [
  { n:'1', title:'ເຮັດໃໝ່ທຸກວັນ',  desc:'ສາລາເປົາອົບສົດໃໝ່ທຸກເຊົ້າ ບໍ່ມີ stock ຄ້າງ' },
  { n:'2', title:'ສ່ວນປະກອບດີ',    desc:'ໃຊ້ວັດຖຸດິບຄຸນນະພາບ ຄັດສັນມາຢ່າງດີ' },
  { n:'3', title:'ສາລາເປົາສົດ',    desc:'ນຶ່ງໃໝ່ທຸກຮອບ ຮ້ອນໆ ນ້ຳໃສ ກ່ຽວ' },
  { n:'4', title:'ສັ່ງລ່ວງໜ້າ',    desc:'ສັ່ງລ່ວງໜ້າ ຮັບຕາມເວລາທີ່ເລືອກ' },
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

  const heroImgs = visibleMenus.slice(0, 3).map(({ i }) => images[i]).filter(Boolean)
  const logoSrc  = txt(shopInfo.logo) || '/logo.jpg'

  return (
    <div style={{
      background: '#1A0C03',
      color: '#FAF0E0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative',
    }}>

      {/* ── page-wide bun watermark ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/bun-pattern.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        opacity: 0.045,
        filter: 'sepia(1)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ NAV ══ */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(200,149,26,.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
              border: '1.5px solid rgba(200,149,26,.5)',
              boxShadow: '0 0 12px rgba(200,149,26,.18)',
              flexShrink: 0,
            }}>
              <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '.9rem', color: '#E8BE70' }}>
              {txt(shopInfo.name, 'Basic Chinese Bun')}
            </span>
          </div>
          <a href="/preorder" style={{
            background: 'linear-gradient(135deg,#C8951A,#9A6E0E)',
            color: '#1A0C03', fontWeight: 900, fontSize: '.78rem',
            padding: '9px 18px', borderRadius: 99, textDecoration: 'none',
            letterSpacing: '.04em',
            boxShadow: '0 4px 14px rgba(200,149,26,.3)',
            flexShrink: 0,
          }}>ສັ່ງດ່ວນ</a>
        </nav>

        {/* ══ HERO — true 2-column flex, no absolute images ══ */}
        <section style={{
          minHeight: '58vh',
          display: 'flex', alignItems: 'center',
          padding: '40px 20px 40px',
          gap: 0,
          overflow: 'hidden',
          position: 'relative',
        }}>

          {/* warm glow behind image column */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%',
            background: 'radial-gradient(ellipse 80% 70% at 70% 50%, rgba(44,22,8,.95) 0%, transparent 80%)',
            pointerEvents: 'none',
          }} />

          {/* Cloud — top-left */}
          <svg viewBox="0 0 90 34" aria-hidden="true" style={{ position: 'absolute', top: 20, left: 14, width: 58, opacity: .18, pointerEvents: 'none' }}>
            <path d="M12,26 Q10,16 20,17 Q17,7 28,10 Q30,3 42,7 Q52,3 54,10 Q64,7 62,17 Q72,16 70,26Z"
              fill="none" stroke="#C8951A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* Cloud — bottom-right area */}
          <svg viewBox="0 0 60 22" aria-hidden="true" style={{ position: 'absolute', bottom: 32, right: '42%', width: 44, opacity: .12, pointerEvents: 'none' }}>
            <path d="M8,17 Q6,10 13,11 Q11,4 19,6 Q20,1 28,4 Q35,1 37,6 Q44,4 42,11 Q48,10 46,17Z"
              fill="none" stroke="#C8951A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* ── Text column (55%) ── */}
          <div style={{ flex: '0 0 55%', paddingRight: 8, zIndex: 1 }}>
            <div style={{ fontSize: '.57rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.2em', marginBottom: 12 }}>
              BASIC CHINESE BUN
            </div>
            <h1 style={{
              margin: 0, fontSize: '2.05rem', fontWeight: 900,
              color: '#FAF0E0', lineHeight: 1.18, letterSpacing: '-.02em',
            }}>
              ສຳຜັດ<br/>
              <span style={{ color: '#E8BE70' }}>ຄວາມ</span><br/>
              ອຮ່ອຍ
            </h1>
            <p style={{
              margin: '10px 0 22px', fontSize: '.75rem',
              color: 'rgba(250,240,224,.5)', lineHeight: 1.7,
            }}>
              ສາລາເປົາ<br/>ສົດໃໝ່ທຸກວັນ
            </p>
            <a href="/preorder" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg,#C8951A,#9A6E0E)',
              color: '#1A0C03', fontWeight: 900, fontSize: '.86rem',
              padding: '11px 20px', borderRadius: 99, textDecoration: 'none',
              boxShadow: '0 8px 22px rgba(200,149,26,.3)',
            }}>
              ເລືອກເມນູ →
            </a>
          </div>

          {/* ── Image column (45%) — pure flex, no absolute ── */}
          <div style={{
            flex: '0 0 45%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8,
            position: 'relative', zIndex: 1,
          }}>
            {heroImgs.length > 0 ? (
              <>
                {/* Main large circle */}
                <div style={{
                  width: '88%', maxWidth: 132,
                  aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden',
                  border: '2.5px solid rgba(200,149,26,.5)',
                  boxShadow: '0 18px 52px rgba(0,0,0,.7), 0 0 0 9px rgba(200,149,26,.05)',
                  flexShrink: 0,
                }}>
                  <img src={heroImgs[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* Second circle — shifted right */}
                {heroImgs[1] && (
                  <div style={{
                    width: '58%', maxWidth: 82,
                    aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid rgba(200,149,26,.3)',
                    boxShadow: '0 10px 28px rgba(0,0,0,.6)',
                    alignSelf: 'flex-end', marginRight: '8%',
                    marginTop: -16, flexShrink: 0,
                  }}>
                    <img src={heroImgs[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                {/* Third circle — shifted left */}
                {heroImgs[2] && (
                  <div style={{
                    width: '40%', maxWidth: 58,
                    aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden',
                    border: '1.5px solid rgba(200,149,26,.22)',
                    boxShadow: '0 6px 16px rgba(0,0,0,.5)',
                    alignSelf: 'flex-start', marginLeft: '10%',
                    marginTop: -8, flexShrink: 0,
                  }}>
                    <img src={heroImgs[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </>
            ) : (
              <div style={{
                width: '88%', maxWidth: 132,
                aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden',
                border: '2.5px solid rgba(200,149,26,.5)',
                boxShadow: '0 18px 52px rgba(0,0,0,.7)',
              }}>
                <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {/* Gold balls — absolute within this column */}
            <div style={{ position: 'absolute', top: 8, right: 6, width: 13, height: 13, borderRadius: '50%', background: GOLD, boxShadow: '0 3px 8px rgba(200,133,26,.4)' }} />
            <div style={{ position: 'absolute', top: '38%', right: 0, width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
            <div style={{ position: 'absolute', bottom: 10, right: 14, width: 11, height: 11, borderRadius: '50%', background: GOLD, boxShadow: '0 3px 7px rgba(200,133,26,.3)' }} />
            <div style={{ position: 'absolute', bottom: 22, left: 6, width: 7, height: 7, borderRadius: '50%', background: GOLD }} />
          </div>
        </section>

        {/* ── gold rule ── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(200,149,26,.15) 30%,rgba(200,149,26,.15) 70%,transparent)', margin: '0 20px' }} />

        {/* ══ MENU CARDS — floating circle done properly ══ */}
        <section style={{ padding: '28px 0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.16em', marginBottom: 4 }}>ເມນູ · MENU</div>
              <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#FAF0E0' }}>ເລືອກໄດ້ເລີຍ</div>
            </div>
            <a href="/preorder" style={{ fontSize: '.73rem', color: 'rgba(200,149,26,.75)', fontWeight: 700, textDecoration: 'none' }}>
              ເບິ່ງທັງໝົດ →
            </a>
          </div>

          {visibleMenus.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(250,240,224,.3)' }}>ສິນຄ້າໝົດຊົ່ວຄາວ</div>
          ) : (
            /* paddingTop exposes floating circles; scroll container clips bottom only */
            <div style={{
              display: 'flex', gap: 12,
              overflowX: 'auto',
              padding: '52px 20px 28px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}>
              {visibleMenus.map(({ m, i }) => (
                /* paddingTop creates room for the circle floating above card body */
                <a key={i} href="/preorder" style={{
                  flexShrink: 0, scrollSnapAlign: 'start',
                  textDecoration: 'none',
                  width: 148,
                  paddingTop: 44,
                  position: 'relative',
                  display: 'block',
                }}>
                  {/* Floating circle — sits in paddingTop space */}
                  <div style={{
                    position: 'absolute', top: 0,
                    left: '50%', transform: 'translateX(-50%)',
                    width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid rgba(200,149,26,.38)',
                    boxShadow: '0 8px 24px rgba(0,0,0,.6)',
                    background: CARD_BG[i % CARD_BG.length],
                    zIndex: 2,
                  }}>
                    {images[i] && (
                      <img src={images[i]} alt={txt(m)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{
                    borderRadius: 20,
                    background: '#221206',
                    border: '1px solid rgba(200,149,26,.12)',
                    boxShadow: '0 8px 28px rgba(0,0,0,.45)',
                    padding: '52px 14px 16px',
                    textAlign: 'center',
                    position: 'relative', zIndex: 1,
                  }}>
                    <div style={{ fontWeight: 900, fontSize: '.84rem', color: '#FAF0E0', lineHeight: 1.35, marginBottom: 12 }}>
                      {txt(m, '?')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#E8BE70', fontWeight: 900, fontSize: '.73rem' }}>
                        {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                      </span>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#C8951A,#9A6E0E)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#1A0C03', fontWeight: 900, fontSize: '1rem',
                        boxShadow: '0 3px 8px rgba(200,149,26,.3)',
                        flexShrink: 0,
                      }}>+</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* ══ FEATURES — text on canvas, no boxes ══ */}
        <section style={{ padding: '28px 20px 36px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 28, right: 20, width: 10, height: 10, borderRadius: '50%', background: GOLD, opacity: .6 }} />

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.16em', marginBottom: 6 }}>WHY BCB</div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FAF0E0' }}>ທຳໄມຕ້ອງ BCB</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 28px' }}>
            {FEATURES.map(({ n, title, desc }) => (
              <div key={n}>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, color: 'rgba(200,149,26,.12)', marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
                  {n}
                </div>
                <div style={{ fontWeight: 800, fontSize: '.84rem', color: '#E8BE70', marginBottom: 5 }}>{title}</div>
                <div style={{ fontSize: '.71rem', color: 'rgba(250,240,224,.4)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── gold rule ── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(200,149,26,.15) 30%,rgba(200,149,26,.15) 70%,transparent)', margin: '0 20px' }} />

        {/* ══ CTA ══ */}
        <section style={{ padding: '36px 20px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#FAF0E0', lineHeight: 1.3, marginBottom: 16 }}>
                ຄົ້ນຫາໄສ້<br/>ທີ່ຊອບ<br/>ສຳລັບທ່ານ
              </div>
              <a href="/preorder" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg,#C8951A,#9A6E0E)',
                color: '#1A0C03', fontWeight: 900, fontSize: '.88rem',
                padding: '12px 22px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(200,149,26,.28)',
              }}>
                ສັ່ງດ່ວນ →
              </a>
            </div>

            <div style={{ flexShrink: 0, position: 'relative' }}>
              <div style={{
                width: 110, height: 110, borderRadius: '50%', overflow: 'hidden',
                border: '2.5px solid rgba(200,149,26,.42)',
                boxShadow: '0 12px 40px rgba(0,0,0,.65), 0 0 0 8px rgba(200,149,26,.05)',
              }}>
                <img src={heroImgs[0] || logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', top: -10, right: -5, width: 14, height: 14, borderRadius: '50%', background: GOLD, boxShadow: '0 4px 10px rgba(200,133,26,.4)' }} />
              <div style={{ position: 'absolute', bottom: -5, left: -3, width: 10, height: 10, borderRadius: '50%', background: GOLD }} />
              <div style={{ position: 'absolute', top: '50%', right: -14, width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <div style={{ borderTop: '1px solid rgba(200,149,26,.07)', textAlign: 'center', padding: '20px', fontSize: '.7rem', fontWeight: 600, color: 'rgba(250,240,224,.18)', letterSpacing: '.04em' }}>
          {txt(shopInfo.name, 'Basic Chinese Bun')} &nbsp;·&nbsp; {txt(shopInfo.address, 'ວຽງຈັນ, ລາວ')}
        </div>

      </div>
    </div>
  )
}
