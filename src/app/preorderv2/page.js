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

const GOLD_BALL = 'radial-gradient(circle at 35% 30%, #F5DC8A 0%, #C8851A 48%, #7A4E08 100%)'

const FEATURES = [
  { n:'1', title:'ເຮັດໃໝ່ທຸກວັນ',   desc:'ສາລາເປົາອົບສົດໃໝ່ທຸກເຊົ້າ ບໍ່ມີ stock ຄ້າງ' },
  { n:'2', title:'ສ່ວນປະກອບດີ',     desc:'ໃຊ້ວັດຖຸດິບຄຸນນະພາບ ຄັດສັນມາຢ່າງດີ' },
  { n:'3', title:'ສາລາເປົາສົດ',     desc:'ນຶ່ງໃໝ່ທຸກຮອບ ຮ້ອນໆ ນ້ຳໃສ ກ່ຽວ' },
  { n:'4', title:'ສັ່ງລ່ວງໜ້າ',     desc:'ສັ່ງລ່ວງໜ້າ ຮັບຕາມເວລາທີ່ເລືອກ' },
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

  const heroImgs = visibleMenus.slice(0, 3).map(({ i }) => images[i]).filter(Boolean)
  const logoSrc  = txt(shopInfo.logo) || '/logo.jpg'

  return (
    <div style={{
      background: '#1A0C03',
      color: '#FAF0E0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>

      {/* ── full-page pattern watermark ── */}
      <img src="/bun-pattern.png" aria-hidden="true" alt="" style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', opacity: 0.045,
        filter: 'sepia(1)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Nav ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(200,149,26,.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
              border: '1.5px solid rgba(200,149,26,.45)',
              boxShadow: '0 0 10px rgba(200,149,26,.2)',
            }}>
              <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '.9rem', color: '#E8BE70', letterSpacing: '.01em' }}>
              {txt(shopInfo.name, 'Basic Chinese Bun')}
            </span>
          </div>
          <a href="/preorder" style={{
            background: 'linear-gradient(135deg,#C8951A,#9A6E0E)',
            color: '#1A0C03', fontWeight: 900, fontSize: '.78rem',
            padding: '9px 18px', borderRadius: 99, textDecoration: 'none',
            letterSpacing: '.04em',
            boxShadow: '0 4px 14px rgba(200,149,26,.3)',
          }}>
            ສັ່ງດ່ວນ
          </a>
        </nav>

        {/* ── Hero ── */}
        <div style={{
          padding: '36px 20px 16px',
          position: 'relative', minHeight: 300,
          display: 'flex', alignItems: 'center',
          overflow: 'hidden',
        }}>

          {/* Cloud decorations */}
          <svg viewBox="0 0 90 34" aria-hidden="true" style={{ position: 'absolute', top: 24, right: 12, width: 80, opacity: .25, pointerEvents: 'none' }}>
            <path d="M12,26 Q10,16 20,17 Q17,7 28,10 Q30,3 42,7 Q52,3 54,10 Q64,7 62,17 Q72,16 70,26Z"
              fill="none" stroke="#C8951A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg viewBox="0 0 60 22" aria-hidden="true" style={{ position: 'absolute', bottom: 28, left: 16, width: 54, opacity: .18, pointerEvents: 'none' }}>
            <path d="M8,17 Q6,10 13,11 Q11,4 19,6 Q20,1 28,4 Q35,1 37,6 Q44,4 42,11 Q48,10 46,17Z"
              fill="none" stroke="#C8951A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Gold balls — hero */}
          <div style={{ position:'absolute', top:18, right:'44%', width:12, height:12, borderRadius:'50%', background: GOLD_BALL, boxShadow:'0 4px 8px rgba(200,133,26,.35)' }} />
          <div style={{ position:'absolute', bottom:20, right:'40%', width:8,  height:8,  borderRadius:'50%', background: GOLD_BALL }} />
          <div style={{ position:'absolute', top:'45%', right:'52%', width:6,  height:6,  borderRadius:'50%', background: GOLD_BALL }} />

          {/* Text */}
          <div style={{ flex: 1, zIndex: 1, paddingRight: 8 }}>
            <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.16em', marginBottom: 10 }}>
              BASIC CHINESE BUN
            </div>
            <h1 style={{ margin: 0, fontSize: '2.05rem', fontWeight: 900, lineHeight: 1.18, letterSpacing: '-.02em', color: '#FAF0E0' }}>
              ສຳຜັດ<br/>
              <span style={{ color: '#E8BE70' }}>ຄວາມ</span><br/>
              ອຮ່ອຍ
            </h1>
            <p style={{ margin: '10px 0 22px', fontSize: '.78rem', color: 'rgba(250,240,224,.55)', lineHeight: 1.65, maxWidth: 190 }}>
              ສາລາເປົາສົດໃໝ່ທຸກວັນ<br/>ໃສ່ຫຼາຍ ອິ່ມ ສະດວກສັ່ງ
            </p>
            <a href="/preorder" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'linear-gradient(135deg,#C8951A,#9A6E0E)',
              color: '#1A0C03', fontWeight: 900, fontSize: '.88rem',
              padding: '12px 22px', borderRadius: 99, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(200,149,26,.32)',
            }}>
              ເລືອກເມນູ <span>→</span>
            </a>
          </div>

          {/* Hero images — right */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '48%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}>
            {heroImgs.length > 0 ? (
              <>
                <div style={{
                  width: 130, height: 130, borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid rgba(200,149,26,.45)',
                  boxShadow: '0 16px 48px rgba(0,0,0,.7), 0 0 0 8px rgba(200,149,26,.06)',
                  position: 'relative', zIndex: 2,
                }}>
                  <img src={heroImgs[0]} alt="bun" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
                {heroImgs[1] && (
                  <div style={{
                    width: 82, height: 82, borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid rgba(200,149,26,.3)',
                    boxShadow: '0 8px 24px rgba(0,0,0,.55)',
                    alignSelf: 'flex-end', marginRight: 16, zIndex: 1,
                  }}>
                    <img src={heroImgs[1]} alt="bun" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                )}
                {heroImgs[2] && (
                  <div style={{
                    width: 58, height: 58, borderRadius: '50%', overflow: 'hidden',
                    border: '1.5px solid rgba(200,149,26,.25)',
                    boxShadow: '0 4px 14px rgba(0,0,0,.4)',
                    alignSelf: 'flex-start', marginLeft: 10,
                  }}>
                    <img src={heroImgs[2]} alt="bun" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                )}
              </>
            ) : (
              <div style={{
                width: 140, height: 140, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid rgba(200,149,26,.4)',
                boxShadow: '0 16px 48px rgba(0,0,0,.6)',
              }}>
                <img src={logoSrc} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}
            {/* gold balls — right side */}
            <div style={{ position:'absolute', top:16, right:18, width:14, height:14, borderRadius:'50%', background:GOLD_BALL, boxShadow:'0 4px 10px rgba(200,133,26,.4)' }} />
            <div style={{ position:'absolute', top:'38%', right:8,  width:9,  height:9,  borderRadius:'50%', background:GOLD_BALL }} />
            <div style={{ position:'absolute', bottom:22, right:28, width:7,  height:7,  borderRadius:'50%', background:GOLD_BALL }} />
          </div>
        </div>

        {/* ── Menu cards ── */}
        <div style={{ padding: '28px 0 8px' }}>
          <div style={{ padding: '0 20px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.16em', marginBottom: 4 }}>ເມນູ · MENU</div>
              <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#FAF0E0' }}>ເລືອກໄດ້ເລີຍ</div>
            </div>
            <a href="/preorder" style={{ fontSize: '.73rem', color: 'rgba(200,149,26,.75)', fontWeight: 700, textDecoration: 'none' }}>
              ເບິ່ງທັງໝົດ →
            </a>
          </div>

          {visibleMenus.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(250,240,224,.3)' }}>
              ສິນຄ້າໝົດຊົ່ວຄາວ
            </div>
          ) : (
            <div style={{
              display: 'flex', gap: 14,
              overflowX: 'auto', padding: '52px 20px 24px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}>
              {visibleMenus.map(({ m, i }) => (
                <a key={i} href="/preorder" style={{ flexShrink: 0, scrollSnapAlign: 'start', textDecoration: 'none', width: 148 }}>
                  <div style={{ position: 'relative', marginTop: 0 }}>
                    {/* Floating circular image */}
                    <div style={{
                      width: 86, height: 86, borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid rgba(200,149,26,.35)',
                      boxShadow: '0 8px 28px rgba(0,0,0,.55)',
                      background: CARD_BG[i % CARD_BG.length],
                      position: 'absolute', top: -43, left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 2,
                    }}>
                      {images[i] && (
                        <img src={images[i]} alt={txt(m)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{
                      background: '#251408',
                      border: '1px solid rgba(200,149,26,.13)',
                      borderRadius: 18,
                      padding: '54px 14px 16px',
                      boxShadow: '0 8px 28px rgba(0,0,0,.4)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontWeight: 900, fontSize: '.86rem', color: '#FAF0E0', lineHeight: 1.35, marginBottom: 12 }}>
                        {txt(m, '?')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#E8BE70', fontWeight: 900, fontSize: '.82rem' }}>
                          {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                        </span>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#C8951A,#9A6E0E)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#1A0C03', fontWeight: 900, fontSize: '1rem',
                          boxShadow: '0 4px 10px rgba(200,149,26,.3)',
                          flexShrink: 0,
                        }}>+</div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Why BCB ── */}
        <div style={{ padding: '32px 20px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '.6rem', fontWeight: 800, color: '#C8951A', letterSpacing: '.16em', marginBottom: 6 }}>WHY BCB</div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FAF0E0' }}>
              {txt(shopInfo.name, 'Basic Chinese Bun')}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {FEATURES.map(({ n, title, desc }) => (
              <div key={n} style={{
                background: '#221106',
                border: '1px solid rgba(200,149,26,.1)',
                borderRadius: 18,
                padding: '18px 14px 16px',
              }}>
                <div style={{
                  fontSize: '2.6rem', fontWeight: 900, lineHeight: 1,
                  color: 'rgba(200,149,26,.14)',
                  marginBottom: 8,
                  fontVariantNumeric: 'tabular-nums',
                }}>{n}</div>
                <div style={{ fontWeight: 800, fontSize: '.85rem', color: '#E8BE70', marginBottom: 5 }}>{title}</div>
                <div style={{ fontSize: '.72rem', color: 'rgba(250,240,224,.45)', lineHeight: 1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA card ── */}
        <div style={{ margin: '0 16px 36px', position: 'relative' }}>
          <div style={{
            background: '#221106',
            border: '1px solid rgba(200,149,26,.15)',
            borderRadius: 24,
            padding: '28px 20px 28px 24px',
            display: 'flex', alignItems: 'center', gap: 12,
            overflow: 'hidden',
          }}>
            {/* bg pattern stripe */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 80% 80% at 80% 50%, rgba(200,149,26,.06) 0%, transparent 70%)',
            }} />
            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#FAF0E0', lineHeight: 1.3, marginBottom: 16 }}>
                ຄົ້ນຫາໄສ້<br/>ທີ່ຊອບ<br/>ສຳລັບທ່ານ
              </div>
              <a href="/preorder" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg,#C8951A,#9A6E0E)',
                color: '#1A0C03', fontWeight: 900, fontSize: '.85rem',
                padding: '11px 20px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 6px 18px rgba(200,149,26,.28)',
              }}>
                ສັ່ງດ່ວນ →
              </a>
            </div>

            <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid rgba(200,149,26,.35)',
                boxShadow: '0 10px 32px rgba(0,0,0,.55)',
              }}>
                <img src={heroImgs[0] || logoSrc} alt="bun" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              {/* gold balls */}
              <div style={{ position:'absolute', top:-8, right:-4, width:13, height:13, borderRadius:'50%', background:GOLD_BALL, boxShadow:'0 3px 8px rgba(200,133,26,.4)' }} />
              <div style={{ position:'absolute', bottom:-4, left:2,  width:9,  height:9,  borderRadius:'50%', background:GOLD_BALL }} />
              <div style={{ position:'absolute', top:'50%', right:-10, width:7, height:7, borderRadius:'50%', background:GOLD_BALL }} />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid rgba(200,149,26,.07)',
          textAlign: 'center', padding: '20px',
          fontSize: '.7rem', fontWeight: 600,
          color: 'rgba(250,240,224,.18)', letterSpacing: '.04em',
        }}>
          {txt(shopInfo.name, 'Basic Chinese Bun')} &nbsp;·&nbsp; {txt(shopInfo.address, 'ວຽງຈັນ, ລາວ')}
        </div>

      </div>
    </div>
  )
}
