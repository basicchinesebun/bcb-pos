import { supabase } from '../../lib/supabase'

const GOLD     = 'radial-gradient(circle at 35% 30%, #F5DC8A 0%, #C8851A 48%, #7A4E08 100%)'
const CARD_BG  = [
  'linear-gradient(150deg,#6B1800,#2A0800)',
  'linear-gradient(150deg,#0A3B18,#041A0A)',
  'linear-gradient(150deg,#12125A,#08082A)',
  'linear-gradient(150deg,#4A0870,#200336)',
  'linear-gradient(150deg,#612800,#2C0C00)',
  'linear-gradient(150deg,#003D4A,#001820)',
  'linear-gradient(150deg,#581515,#280606)',
  'linear-gradient(150deg,#155830,#071E10)',
]

const FEATURES = [
  { n:'1', title:'ວັດຖຸດິບພຣີມຽມ',   desc:'ຄັດສັນວັດຖຸດິບທີ່ດີທີ່ສຸດ ເພື່ອໃຫ້ທ່ານໄດ້ຮັບລົດຊາດທີ່ດີທີ່ສຸດທຸກຄັ້ງ' },
  { n:'2', title:'ບັນຍາກາດພິເສດ',    desc:'ສຳຜັດປະສົບການການສັ່ງ ທີ່ງ່າຍດາຍ ຮ້ອງລໍ ພ້ອມຮັບໄດ້ທັນທີ' },
  { n:'3', title:'ບໍລິການສ່ວນຕົວ',    desc:'ສາລາເປົາ ທຳມືໃໝ່ ທຸກຮອບ ນຶ່ງສົດ ຮ້ອນໆ ນ້ຳໃສທຸກວັນ' },
  { n:'4', title:'ທີມເຊຟຜູ້ຊ່ຽວຊານ', desc:'ທີມງານຜ່ານການຝຶກເຊຟໂດຍສະເພາະ ທຸ່ມເທເພື່ອທ່ານ' },
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

  const img0 = (visibleMenus[0] && images[visibleMenus[0].i]) || null
  const img1 = (visibleMenus[1] && images[visibleMenus[1].i]) || null
  const logoSrc = txt(shopInfo.logo) || '/logo.jpg'
  const shopName = txt(shopInfo.name, 'Basic Chinese Bun')

  return (
    <div style={{
      background: '#2B1506',
      color: '#FAF0E0',
      fontFamily: "'Noto Sans Lao', system-ui, -apple-system, sans-serif",
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative',
    }}>

      {/* ── bun-pattern watermark ── */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/bun-pattern.png)',
        backgroundSize: '200%',
        backgroundPosition: '60% 30%',
        opacity: 0.04,
        filter: 'sepia(1) brightness(0.55)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ══════ NAV ══════ */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 22px',
          borderBottom: '1px solid rgba(200,149,26,.1)',
        }}>
          {/* logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
              border: '1.5px solid rgba(200,149,26,.5)', flexShrink: 0,
            }}>
              <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '.85rem', color: '#D4A832', letterSpacing: '.06em' }}>
              BCB
            </span>
          </div>
          {/* order button */}
          <a href="/preorder" style={{
            background: 'linear-gradient(135deg,#C8951A,#8A6008)',
            color: '#1A0800', fontWeight: 900, fontSize: '.76rem',
            padding: '9px 20px', borderRadius: 99, textDecoration: 'none',
            letterSpacing: '.05em', boxShadow: '0 4px 16px rgba(200,149,26,.3)',
          }}>ສັ່ງດ່ວນ</a>
        </nav>

        {/* ══════ HERO ══════ */}
        <section style={{ padding: '40px 22px 36px', position: 'relative', overflow: 'hidden' }}>

          {/* top-right ambient glow */}
          <div style={{
            position: 'absolute', top: -40, right: -60,
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,120,10,.18) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

            {/* ── LEFT: headline + desc + CTA ── */}
            <div style={{ flex: 1, zIndex: 1, minWidth: 0 }}>
              <h1 style={{
                margin: '0 0 14px',
                fontSize: '2.2rem', fontWeight: 900,
                color: '#FAF0E0', lineHeight: 1.18,
                letterSpacing: '-.01em',
              }}>
                ສຳຜັດ<br/>
                ສຸນທຣີ<br/>
                <span style={{ color: '#D4A832' }}>ຊາລາເປົາ</span>
              </h1>
              <p style={{
                margin: '0 0 24px',
                fontSize: '.72rem', color: 'rgba(250,240,224,.42)',
                lineHeight: 1.8, maxWidth: 220,
              }}>
                ສາລາເປົາທຳມື ນຶ່ງສົດໃໝ່ ທຸກເຊົ້າ ເຮັດດ້ວຍໃຈ ເສີຣ໌ຟດ້ວຍຮັກ — ຄຸນນະພາບທີ່ທ່ານໄວ້ວາງໃຈ
              </p>
              {/* outlined CTA — matching reference */}
              <a href="/preorder" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1.5px solid rgba(200,149,26,.6)',
                color: '#D4A832', fontWeight: 900, fontSize: '.84rem',
                padding: '11px 22px', borderRadius: 99, textDecoration: 'none',
                letterSpacing: '.04em',
                background: 'rgba(200,149,26,.06)',
              }}>
                ເລືອກເມນູ →
              </a>
            </div>

            {/* ── RIGHT: two bun circles + gold balls + cloud ── */}
            <div style={{ flexShrink: 0, width: 170, position: 'relative', height: 220 }}>

              {/* cloud SVG top-right */}
              <svg viewBox="0 0 90 32" aria-hidden="true" style={{
                position: 'absolute', top: 0, right: 0, width: 58, opacity: .3, pointerEvents: 'none',
              }}>
                <path d="M12,26 Q10,16 20,17 Q18,8 28,10 Q30,3 40,6 Q50,3 52,10 Q62,8 60,17 Q68,16 66,26Z"
                  fill="none" stroke="#C8951A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              {/* Main large circle */}
              <div style={{
                position: 'absolute', top: 20, right: 0,
                width: 160, height: 160, borderRadius: '50%', overflow: 'hidden',
                border: '2.5px solid rgba(200,149,26,.5)',
                boxShadow: '0 20px 55px rgba(0,0,0,.75), 0 0 0 8px rgba(200,149,26,.06)',
              }}>
                <img src={img0 || logoSrc} alt="bun" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Second smaller circle */}
              {img1 && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid rgba(200,149,26,.38)',
                  boxShadow: '0 10px 30px rgba(0,0,0,.6)',
                }}>
                  <img src={img1} alt="bun2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* gold balls */}
              <div style={{ position: 'absolute', top: 6,  right: 20, width: 16, height: 16, borderRadius: '50%', background: GOLD, boxShadow: '0 4px 12px rgba(200,133,26,.5)' }} />
              <div style={{ position: 'absolute', top: 55, right: -8, width: 11, height: 11, borderRadius: '50%', background: GOLD }} />
              <div style={{ position: 'absolute', top: 130, right: -6, width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
              <div style={{ position: 'absolute', bottom: 30, left: 74, width: 13, height: 13, borderRadius: '50%', background: GOLD, boxShadow: '0 3px 10px rgba(200,133,26,.4)' }} />
              <div style={{ position: 'absolute', top: 0, left: 30, width: 7, height: 7, borderRadius: '50%', background: GOLD }} />
            </div>
          </div>
        </section>

        {/* ══════ MENU CARDS ══════ */}
        <section style={{ padding: '8px 0 4px' }}>

          <div style={{
            display: 'flex', gap: 14,
            overflowX: 'auto',
            padding: '56px 22px 28px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}>
            {visibleMenus.length === 0 ? (
              <div style={{ padding: '20px', color: 'rgba(250,240,224,.3)', fontSize: '.8rem' }}>ສິນຄ້າໝົດຊົ່ວຄາວ</div>
            ) : visibleMenus.map(({ m, i }) => (
              <a key={i} href="/preorder" style={{
                flexShrink: 0, scrollSnapAlign: 'start',
                textDecoration: 'none',
                width: 162, paddingTop: 50,
                position: 'relative', display: 'block',
              }}>
                {/* floating circle image */}
                <div style={{
                  position: 'absolute', top: 0,
                  left: '50%', transform: 'translateX(-50%)',
                  width: 100, height: 100,
                  borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid rgba(200,149,26,.4)',
                  boxShadow: '0 10px 30px rgba(0,0,0,.65)',
                  background: CARD_BG[i % CARD_BG.length],
                  zIndex: 2,
                }}>
                  {images[i] && (
                    <img src={images[i]} alt={txt(m)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {/* price badge — top-left of circle */}
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: 'linear-gradient(135deg,#C8951A,#8A6008)',
                    color: '#1A0800', fontWeight: 900, fontSize: '.58rem',
                    padding: '3px 7px', borderRadius: 99,
                    letterSpacing: '.02em', lineHeight: 1.2,
                    boxShadow: '0 2px 6px rgba(0,0,0,.4)',
                  }}>
                    {Number(prices[i] ?? 0).toLocaleString()}
                  </div>
                </div>

                {/* card body */}
                <div style={{
                  borderRadius: 22,
                  background: 'linear-gradient(160deg,#1E0D04,#150902)',
                  border: '1px solid rgba(200,149,26,.11)',
                  boxShadow: '0 6px 24px rgba(0,0,0,.5)',
                  padding: '58px 14px 18px',
                  textAlign: 'center',
                  position: 'relative', zIndex: 1,
                }}>
                  <div style={{ fontWeight: 900, fontSize: '.86rem', color: '#FAF0E0', lineHeight: 1.3, marginBottom: 6 }}>
                    {txt(m, '?')}
                  </div>
                  <div style={{ fontSize: '.64rem', color: 'rgba(250,240,224,.35)', lineHeight: 1.6, marginBottom: 14 }}>
                    ສາລາເປົາທຳມື<br/>ຄຸນນະພາບສູງ
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#D4A832', fontWeight: 900, fontSize: '.76rem' }}>
                      {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                    </span>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#C8951A,#8A6008)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#1A0800', fontWeight: 900, fontSize: '1.1rem',
                      boxShadow: '0 3px 10px rgba(200,149,26,.3)',
                      flexShrink: 0,
                    }}>+</div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div style={{ textAlign: 'center', paddingBottom: 28 }}>
            <a href="/preorder" style={{ fontSize: '.73rem', color: 'rgba(200,149,26,.6)', fontWeight: 600, textDecoration: 'none', letterSpacing: '.02em' }}>
              ເບິ່ງທັງໝົດ →
            </a>
          </div>
        </section>

        {/* ── divider ── */}
        <div style={{ height: 1, margin: '0 22px', background: 'linear-gradient(90deg,transparent,rgba(200,149,26,.13) 20%,rgba(200,149,26,.13) 80%,transparent)' }} />

        {/* ══════ FEATURES — ghost numbers ══════ */}
        <section style={{ padding: '48px 22px 56px', position: 'relative' }}>

          {/* BUNSENSE center label */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontWeight: 900, fontSize: '.72rem', color: 'rgba(200,149,26,.55)', letterSpacing: '.35em' }}>
              {shopName.toUpperCase()}
            </div>
          </div>

          {/* steamer decoration — center background */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 140, height: 140,
            backgroundImage: 'url(/bun-pattern.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.05,
            filter: 'sepia(1)',
            pointerEvents: 'none',
            borderRadius: 12,
          }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px 24px', position: 'relative' }}>
            {FEATURES.map(({ n, title, desc }) => (
              <div key={n}>
                {/* very large ghost number */}
                <div style={{
                  fontSize: '7rem', fontWeight: 900, lineHeight: 0.85,
                  color: 'rgba(200,149,26,.09)',
                  letterSpacing: '-.05em',
                  fontVariantNumeric: 'tabular-nums',
                  marginLeft: -6, marginBottom: 8,
                  userSelect: 'none',
                }}>
                  {n}
                </div>
                <div style={{ fontWeight: 900, fontSize: '.9rem', color: '#FAF0E0', marginBottom: 8, lineHeight: 1.3 }}>
                  {title}
                </div>
                <div style={{ fontSize: '.7rem', color: 'rgba(250,240,224,.35)', lineHeight: 1.7 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* scattered gold balls */}
          <div style={{ position: 'absolute', top: 60, left: 14, width: 10, height: 10, borderRadius: '50%', background: GOLD, opacity: .7 }} />
          <div style={{ position: 'absolute', bottom: 80, right: 18, width: 14, height: 14, borderRadius: '50%', background: GOLD, boxShadow: '0 4px 10px rgba(200,133,26,.35)' }} />
          <div style={{ position: 'absolute', top: '50%', right: 10, width: 7, height: 7, borderRadius: '50%', background: GOLD, opacity: .6 }} />
        </section>

        {/* ── divider ── */}
        <div style={{ height: 1, margin: '0 22px', background: 'linear-gradient(90deg,transparent,rgba(200,149,26,.13) 20%,rgba(200,149,26,.13) 80%,transparent)' }} />

        {/* ══════ CTA ══════ */}
        <section style={{
          margin: '0',
          padding: '44px 22px 60px',
          background: 'linear-gradient(180deg,#2B1506 0%,#221004 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* cloud SVG left */}
          <svg viewBox="0 0 90 32" aria-hidden="true" style={{
            position: 'absolute', bottom: 40, left: 14, width: 52, opacity: .2, pointerEvents: 'none',
          }}>
            <path d="M12,26 Q10,16 20,17 Q18,8 28,10 Q30,3 40,6 Q50,3 52,10 Q62,8 60,17 Q68,16 66,26Z"
              fill="none" stroke="#C8951A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>

            {/* left text */}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '1.55rem', fontWeight: 900, color: '#FAF0E0', lineHeight: 1.25 }}>
                ຮ່ວມຄົ້ນຫາ<br/>
                ຊາລາເປົາໄສ້<br/>
                ທີ່ໃຊ່ສຳລັບທ່ານ
              </h2>
              <a href="/preorder" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'linear-gradient(135deg,#C8951A,#8A6008)',
                color: '#1A0800', fontWeight: 900, fontSize: '.86rem',
                padding: '13px 24px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 8px 28px rgba(200,149,26,.3)',
                letterSpacing: '.03em',
              }}>
                ຮ່ວມຄົ້ນຫ້າ
              </a>
            </div>

            {/* right: big circle + gold balls + cloud */}
            <div style={{ flexShrink: 0, position: 'relative', width: 140 }}>
              {/* cloud top-right */}
              <svg viewBox="0 0 70 25" aria-hidden="true" style={{
                position: 'absolute', top: -14, right: -8, width: 44, opacity: .28, pointerEvents: 'none',
              }}>
                <path d="M8,20 Q7,12 14,13 Q12,6 20,8 Q22,2 29,4 Q36,2 38,8 Q45,6 43,13 Q50,12 48,20Z"
                  fill="none" stroke="#C8951A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              <div style={{
                width: 130, height: 130, borderRadius: '50%', overflow: 'hidden',
                border: '2.5px solid rgba(200,149,26,.45)',
                boxShadow: '0 20px 55px rgba(0,0,0,.7), 0 0 0 8px rgba(200,149,26,.05)',
              }}>
                <img src={img0 || logoSrc} alt="bun" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* gold balls */}
              <div style={{ position: 'absolute', top: -12, right: 10, width: 15, height: 15, borderRadius: '50%', background: GOLD, boxShadow: '0 4px 12px rgba(200,133,26,.5)' }} />
              <div style={{ position: 'absolute', top: '35%', right: -14, width: 10, height: 10, borderRadius: '50%', background: GOLD }} />
              <div style={{ position: 'absolute', bottom: -6, right: 16, width: 12, height: 12, borderRadius: '50%', background: GOLD, boxShadow: '0 3px 8px rgba(200,133,26,.4)' }} />
              <div style={{ position: 'absolute', bottom: 20, left: -8, width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
            </div>
          </div>
        </section>

        {/* ══════ FOOTER ══════ */}
        <div style={{
          borderTop: '1px solid rgba(200,149,26,.07)',
          textAlign: 'center', padding: '18px 20px',
          fontSize: '.64rem', fontWeight: 600,
          color: 'rgba(250,240,224,.15)', letterSpacing: '.07em',
        }}>
          {shopName} &nbsp;·&nbsp; {txt(shopInfo.address, 'ວຽງຈັນ, ລາວ')}
        </div>

      </div>
    </div>
  )
}
