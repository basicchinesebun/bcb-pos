import { supabase } from '../../lib/supabase'

// BCB website palette (globals.css / tailwind.config.js)
// background: #fdf6ee (cream)   text: #3d1f0a (dark brown)
// --cream2: #f5ebe0   --cream3: #e8d5c0   --warm: #fffbf6
// --brown2: #6b3a1f   --brown3: #a0522d

const GOLD_BALL    = 'radial-gradient(circle at 35% 30%, #F5DC8A 0%, #C8851A 48%, #7A4E08 100%)'
const PEDESTAL_TOP = 'radial-gradient(ellipse at 50% 35%, #F5DC8A 0%, #C8851A 40%, #7A4E08 100%)'

const FEATURES = [
  { n:'1', title:'ວັດຖຸດິບພຣີມຽມ',   desc:'ຄັດສັນວັດຖຸດິບທີ່ດີທີ່ສຸດ ເພື່ອໃຫ້ທ່ານໄດ້ຮັບລົດຊາດທີ່ດີທີ່ສຸດທຸກຄັ້ງ' },
  { n:'2', title:'ບັນຍາກາດພິເສດ',    desc:'ສຳຜັດປະສົບການ ທີ່ງ່າຍດາຍ ພ້ອມຮັບໄດ້ທັນທີ ຕາມເວລາທີ່ທ່ານເລືອກ' },
  { n:'3', title:'ບໍລິການສ່ວນຕົວ',    desc:'ສາລາເປົາ ທຳມືໃໝ່ ນຶ່ງສົດ ຮ້ອນໆ ນ້ຳໃສທຸກຮອບ ທຸກວັນ' },
  { n:'4', title:'ທີມເຊຟຊ່ຽວຊານ',    desc:'ທີມງານຜ່ານການຝຶກ ດ້ວຍຄວາມທຸ່ມເທ ເພື່ອທ່ານທຸກໜ້ານ' },
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
      shopInfo: tryParse(cfg.shop_info,    {}),
      stock:    tryParse(cfg.stock_online, []),
    }
  } catch { return defaults() }
}
function tryParse(v, f) { try { return v ? JSON.parse(v) : f } catch { return f } }
function txt(v, f = '') {
  if (!v) return f
  if (typeof v === 'string') return v
  if (typeof v === 'object') return v.lo || v.en || f
  return f
}
function defaults() {
  return { menus:[], prices:[], images:{}, shopInfo:{}, stock:[] }
}

/* ── cloud SVG motif ── */
function Cloud({ style }) {
  return (
    <svg viewBox="0 0 96 34" aria-hidden="true" style={{ pointerEvents:'none', ...style }}>
      <path d="M14,28 Q11,16 22,18 Q19,7 31,9 Q33,2 44,5 Q55,2 57,9 Q68,7 65,18 Q76,16 73,28Z"
        fill="none" stroke="#C8951A" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4,28 Q3,20 10,21 Q9,14 16,16 Q17,10 23,12"
        fill="none" stroke="#C8951A" strokeWidth="1.1"
        strokeLinecap="round" strokeLinejoin="round" opacity=".6"/>
    </svg>
  )
}

/* ── gold sphere ── */
function Dot({ size = 12, style, className }) {
  return (
    <div className={className} style={{
      width: size, height: size, borderRadius: '50%',
      background: GOLD_BALL,
      boxShadow: size >= 14 ? `0 4px 14px rgba(200,133,26,.45)` : undefined,
      flexShrink: 0,
      ...style,
    }} />
  )
}

/* ── bun image (free-floating, no circle clip) + gold pedestal ── */
function BunOnPedestal({ src, size = 150, pedestalW = 96 }) {
  return (
    <div style={{ position:'relative', width: size, paddingBottom: 24, flexShrink: 0 }}>
      {/* free-floating image — no border-radius clip */}
      <img
        src={src} alt="bun"
        style={{
          width: size, height: size,
          objectFit: 'contain',
          display: 'block',
          position: 'relative', zIndex: 1,
          filter: 'drop-shadow(0 18px 28px rgba(61,31,10,.22))',
        }}
      />
      {/* pedestal stem */}
      <div style={{
        position:'absolute', bottom: 17, left:'50%', transform:'translateX(-50%)',
        width: 10, height: 22,
        background:'linear-gradient(90deg,#8A5008,#D4A832 40%,#8A5008)',
        zIndex: 0,
      }} />
      {/* pedestal plate */}
      <div style={{
        position:'absolute', bottom: 5, left:'50%', transform:'translateX(-50%)',
        width: pedestalW, height: 18,
        borderRadius:'50%',
        background: PEDESTAL_TOP,
        boxShadow:'0 6px 22px rgba(200,133,26,.35), inset 0 3px 0 rgba(245,220,138,.3)',
        zIndex: 2,
      }} />
    </div>
  )
}

export default async function PreorderV2Page() {
  const { menus, prices, images, shopInfo, stock } = await getShopData()

  const visible = menus
    .map((m, i) => ({ m, i }))
    .filter(({ i }) => stock.length === 0 || (stock[i] ?? 1) > 0)

  const img0 = (visible[0] && images[visible[0].i]) || null
  const img1 = (visible[1] && images[visible[1].i]) || null
  const logoSrc = txt(shopInfo.logo) || '/logo.jpg'
  const shopName = txt(shopInfo.name, 'Basic Chinese Bun')

  return (
    <div style={{
      background:'#fdf6ee',
      color:'#3d1f0a',
      fontFamily:"'Noto Sans Lao',system-ui,-apple-system,sans-serif",
      minHeight:'100vh', overflowX:'hidden',
    }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes float {
          0%,100% { transform:translateY(0px); }
          50%     { transform:translateY(-12px); }
        }
        @keyframes floatSm {
          0%,100% { transform:translateY(0px) rotate(-2deg); }
          50%     { transform:translateY(-7px) rotate(2deg); }
        }
        @keyframes pulse {
          0%,100% { transform:scale(1); opacity:1; }
          50%     { transform:scale(1.22); opacity:.7; }
        }
        @keyframes scaleIn {
          from { opacity:0; transform:scale(.86) translateY(16px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes spinSlow {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        .bcb-nav-logo { animation:scaleIn .5s ease both; }
        .bcb-nav-btn  { animation:fadeUp .5s .15s ease both; }
        .bcb-h1-1     { animation:fadeUp .65s .05s ease both; }
        .bcb-h1-2     { animation:fadeUp .65s .18s ease both; }
        .bcb-h1-3     { animation:fadeUp .65s .3s  ease both; }
        .bcb-hero-p   { animation:fadeUp .65s .4s  ease both; }
        .bcb-hero-btn { animation:fadeUp .65s .52s ease both; }
        .bcb-bun-main { animation:float 3.8s ease-in-out infinite; }
        .bcb-bun-sm   { animation:floatSm 4.4s .6s ease-in-out infinite; }
        .bcb-dot-1    { animation:pulse 2.4s ease-in-out infinite; }
        .bcb-dot-2    { animation:pulse 2.4s .4s ease-in-out infinite; }
        .bcb-dot-3    { animation:pulse 2.4s .8s ease-in-out infinite; }
        .bcb-dot-4    { animation:pulse 2.4s .3s ease-in-out infinite; }
        .bcb-dot-5    { animation:pulse 2.4s .9s ease-in-out infinite; }
        .bcb-card-0   { animation:scaleIn .55s .1s ease both; }
        .bcb-card-1   { animation:scaleIn .55s .22s ease both; }
        .bcb-card-2   { animation:scaleIn .55s .34s ease both; }
        .bcb-card-3   { animation:scaleIn .55s .46s ease both; }
        .bcb-feat-0   { animation:fadeUp .6s .1s ease both; }
        .bcb-feat-1   { animation:fadeUp .6s .22s ease both; }
        .bcb-feat-2   { animation:fadeUp .6s .34s ease both; }
        .bcb-feat-3   { animation:fadeUp .6s .46s ease both; }
        .bcb-cta      { animation:scaleIn .7s .15s ease both; }
        .bcb-cta-bun  { animation:float 3.4s .4s ease-in-out infinite; }
        .bcb-divider  {
          background:linear-gradient(90deg,transparent 0%,rgba(200,149,26,.6) 30%,rgba(245,220,138,.9) 50%,rgba(200,149,26,.6) 70%,transparent 100%);
          background-size:200% auto;
          animation:shimmer 2.8s linear infinite;
        }
        .bcb-footer   { animation:fadeUp .5s .2s ease both; }
      `}</style>

      {/* ════ NAV ════ */}
      <nav style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'15px 22px',
        borderBottom:'1px solid #e8d5c0',
        background:'#fdf6ee',
      }}>
        <div className="bcb-nav-logo" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:'50%', overflow:'hidden',
            border:'1.5px solid #e8d5c0', flexShrink:0,
          }}>
            <img src={logoSrc} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <span style={{ fontWeight:900, fontSize:'.95rem', color:'#3d1f0a', letterSpacing:'.08em' }}>
            BCB
          </span>
        </div>
        <a href="/preorder" className="bcb-nav-btn" style={{
          background:'#3d1f0a',
          color:'#fdf6ee', fontWeight:900, fontSize:'.76rem',
          padding:'9px 20px', borderRadius:99, textDecoration:'none',
          letterSpacing:'.06em',
        }}>ສັ່ງດ່ວນ</a>
      </nav>

      {/* ════ HERO ════ */}
      <section style={{ padding:'36px 22px 32px', position:'relative', overflow:'hidden', background:'#fdf6ee' }}>

        {/* subtle gold glow top-right */}
        <div style={{
          position:'absolute', top:-60, right:-40,
          width:260, height:260, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(200,149,26,.10) 0%,transparent 65%)',
          pointerEvents:'none',
        }} />

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>

          {/* ── LEFT text ── */}
          <div style={{ flex:1, zIndex:1, minWidth:0 }}>

            <h1 style={{ margin:'0 0 12px', lineHeight:1.15 }}>
              <span className="bcb-h1-1" style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#3d1f0a', letterSpacing:'-.02em' }}>
                ສຳຜັດ
              </span>
              <span className="bcb-h1-2" style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#3d1f0a', letterSpacing:'-.02em' }}>
                ສຸນທຣີ
              </span>
              <span className="bcb-h1-3" style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#C8951A', letterSpacing:'-.02em' }}>
                ຊາລາເປົາ
              </span>
            </h1>

            <p className="bcb-hero-p" style={{ margin:'0 0 22px', fontSize:'.7rem', color:'rgba(61,31,10,.45)', lineHeight:1.85, maxWidth:190 }}>
              ສາລາເປົາທຳມື ສົດໃໝ່ ນຶ່ງທຸກຮອບ ດ້ວຍວັດຖຸດິບຄຸນນະພາບ ສຳລັບທ່ານໂດຍສະເພາະ
            </p>

            <a href="/preorder" className="bcb-hero-btn" style={{
              display:'inline-flex', alignItems:'center', gap:8,
              border:'1.5px solid #3d1f0a',
              color:'#3d1f0a', fontWeight:900, fontSize:'.83rem',
              padding:'11px 22px', borderRadius:99, textDecoration:'none',
              letterSpacing:'.04em',
            }}>
              ເລືອກເມນູ →
            </a>
          </div>

          {/* ── RIGHT: buns + gold balls + cloud ── */}
          <div style={{ flexShrink:0, width:158, position:'relative', height:240, zIndex:1 }}>

            {/* cloud SVG top-right */}
            <Cloud style={{ position:'absolute', top:-4, right:-4, width:60, opacity:.3 }} />

            {/* secondary small bun image — top-left, free-floating */}
            {img1 && (
              <img
                src={img1} alt="bun2"
                className="bcb-bun-sm"
                style={{
                  position:'absolute', top:8, left:0,
                  width:78, height:78,
                  objectFit:'contain',
                  filter:'drop-shadow(0 8px 16px rgba(61,31,10,.2))',
                  zIndex:1,
                }}
              />
            )}

            {/* main large bun with pedestal — bottom right */}
            <div className="bcb-bun-main" style={{ position:'absolute', bottom:0, right:0, zIndex:2 }}>
              <BunOnPedestal src={img0 || logoSrc} size={148} pedestalW={90} />
            </div>

            {/* gold balls */}
            <Dot size={18} style={{ position:'absolute', top:0,   right:20 }} className="bcb-dot-1" />
            <Dot size={11} style={{ position:'absolute', top:60,  right:-4 }} className="bcb-dot-2" />
            <Dot size={14} style={{ position:'absolute', top:120, right:-8 }} className="bcb-dot-3" />
            <Dot size={8}  style={{ position:'absolute', top:30,  left:60 }}  className="bcb-dot-4" />
            <Dot size={9}  style={{ position:'absolute', bottom:60, left:-4 }} className="bcb-dot-5" />
          </div>
        </div>
      </section>

      {/* thin gold divider */}
      <div className="bcb-divider" style={{ height:1, margin:'0 22px' }} />

      {/* ════ MENU CARDS ════ */}
      <section style={{ background:'#fffbf6', paddingBottom:8 }}>

        {/* scroll row */}
        <div style={{
          display:'flex', gap:14,
          overflowX:'auto',
          padding:'62px 22px 8px',
          scrollSnapType:'x mandatory',
          WebkitOverflowScrolling:'touch',
          msOverflowStyle:'none', scrollbarWidth:'none',
        }}>
          {visible.length === 0 ? (
            <p style={{ padding:'20px', color:'rgba(61,31,10,.3)', fontSize:'.8rem' }}>ສິນຄ້າໝົດຊົ່ວຄາວ</p>
          ) : visible.map(({ m, i }, vi) => (
            <a key={i} href="/preorder" className={`bcb-card-${vi}`} style={{
              flexShrink:0, scrollSnapAlign:'start',
              textDecoration:'none',
              width:166, paddingTop:52,
              position:'relative', display:'block',
            }}>
              {/* floating bun image — free-floating, no circle clip */}
              <div style={{
                position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
                width:104, height:104,
                zIndex:2, display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {images[i] ? (
                  <img
                    src={images[i]} alt={txt(m)}
                    style={{
                      width:104, height:104,
                      objectFit:'contain',
                      filter:'drop-shadow(0 10px 18px rgba(61,31,10,.25))',
                    }}
                  />
                ) : (
                  <div style={{
                    width:80, height:80, borderRadius:'50%',
                    background:'#e8d5c0', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'1.8rem',
                  }}>🥟</div>
                )}
                {/* price badge */}
                <div style={{
                  position:'absolute', top:4, left:4,
                  background:'#3d1f0a',
                  color:'#fdf6ee', fontWeight:900, fontSize:'.56rem',
                  padding:'3px 8px', borderRadius:99,
                }}>
                  {Number(prices[i] ?? 0).toLocaleString()}
                </div>
              </div>

              {/* card body */}
              <div style={{
                borderRadius:22,
                background:'#fdf6ee',
                border:'1px solid #e8d5c0',
                boxShadow:'0 4px 16px rgba(61,31,10,.07)',
                padding:'60px 14px 18px',
                textAlign:'center', position:'relative', zIndex:1,
              }}>
                <div style={{ fontWeight:900, fontSize:'.88rem', color:'#3d1f0a', lineHeight:1.3, marginBottom:6 }}>
                  {txt(m,'?')}
                </div>
                <div style={{ fontSize:'.63rem', color:'rgba(61,31,10,.4)', lineHeight:1.65, marginBottom:14 }}>
                  ສາລາເປົາ ສົດໃໝ່<br/>ຄຸນນະພາບສູງ
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ color:'#C8951A', fontWeight:900, fontSize:'.78rem' }}>
                    {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                  </span>
                  <div style={{
                    width:30, height:30, borderRadius:'50%',
                    background:'#3d1f0a',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fdf6ee', fontWeight:900, fontSize:'1.1rem',
                    flexShrink:0,
                  }}>+</div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* "view all" link */}
        <div style={{ textAlign:'center', padding:'16px 0 28px' }}>
          <a href="/preorder" style={{ fontSize:'.73rem', color:'rgba(61,31,10,.4)', fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>
            ເບິ່ງທັງໝົດ →
          </a>
        </div>
      </section>

      {/* thin gold divider */}
      <div className="bcb-divider" style={{ height:1, margin:'0 22px' }} />

      {/* ════ FEATURES — ghost numbers ════ */}
      <section style={{ padding:'52px 22px 60px', position:'relative', overflow:'hidden', background:'#fdf6ee' }}>

        {/* section label */}
        <div style={{ textAlign:'center', marginBottom:44, position:'relative', zIndex:1 }}>
          <span style={{ fontWeight:900, fontSize:'.76rem', color:'rgba(200,149,26,.65)', letterSpacing:'.4em' }}>
            {shopName.toUpperCase()}
          </span>
        </div>

        {/* scattered gold balls */}
        <Dot size={10} style={{ position:'absolute', top:40,   left:14,  opacity:.55 }} />
        <Dot size={16} style={{ position:'absolute', bottom:40, right:14, opacity:.7 }} />
        <Dot size={8}  style={{ position:'absolute', top:'50%', right:8,  opacity:.5 }} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'52px 20px', position:'relative', zIndex:1 }}>
          {FEATURES.map(({ n, title, desc }, fi) => (
            <div key={n} className={`bcb-feat-${fi}`}>
              {/* ghost number */}
              <div style={{
                fontSize:'8rem', fontWeight:900, lineHeight:0.82,
                color:'rgba(61,31,10,.055)',
                letterSpacing:'-.05em',
                fontVariantNumeric:'tabular-nums',
                marginLeft:-8, marginBottom:10,
                userSelect:'none',
              }}>
                {n}
              </div>
              <div style={{ fontWeight:900, fontSize:'.92rem', color:'#3d1f0a', marginBottom:8, lineHeight:1.3 }}>
                {title}
              </div>
              <div style={{ fontSize:'.69rem', color:'rgba(61,31,10,.45)', lineHeight:1.75 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════ CTA CARD — dark statement card ════ */}
      <div className="bcb-cta" style={{ padding:'0 16px 60px', background:'#fdf6ee' }}>
        <div style={{
          borderRadius:24,
          background:'#3d1f0a',
          boxShadow:'0 8px 40px rgba(61,31,10,.2)',
          padding:'36px 24px',
          position:'relative', overflow:'hidden',
        }}>
          {/* cloud SVG */}
          <Cloud style={{ position:'absolute', bottom:18, left:12, width:56, opacity:.18 }} />

          <div style={{ display:'flex', alignItems:'center', gap:18 }}>

            {/* left: headline + button */}
            <div style={{ flex:1 }}>
              <h2 style={{ margin:'0 0 20px', fontSize:'1.5rem', fontWeight:900, color:'#fdf6ee', lineHeight:1.28 }}>
                ຮ່ວມຄົ້ນຫາ<br/>
                ຊາລາເປົາໄສ້<br/>
                <span style={{ color:'#D4A832' }}>ທີ່ໃຊ່ສຳລັບທ່ານ?</span>
              </h2>
              <a href="/preorder" style={{
                display:'inline-flex', alignItems:'center', gap:7,
                background:'#fdf6ee',
                color:'#3d1f0a', fontWeight:900, fontSize:'.86rem',
                padding:'12px 22px', borderRadius:99, textDecoration:'none',
                letterSpacing:'.03em',
              }}>
                ຮ່ວມຄົ້ນຫາ
              </a>
            </div>

            {/* right: bun free-floating + gold balls + cloud */}
            <div style={{ flexShrink:0, position:'relative', paddingTop:8 }}>
              <Cloud style={{ position:'absolute', top:-16, right:-8, width:44, opacity:.22 }} />

              <div className="bcb-cta-bun"><BunOnPedestal src={img0 || logoSrc} size={124} pedestalW={78} /></div>

              {/* gold balls */}
              <Dot size={15} style={{ position:'absolute', top:-10, right:6 }} />
              <Dot size={9}  style={{ position:'absolute', top:'38%', right:-12 }} />
              <Dot size={11} style={{ position:'absolute', bottom:8, left:-6 }} />
              <Dot size={7}  style={{ position:'absolute', top:10, left:-2 }} />
            </div>
          </div>
        </div>
      </div>

      {/* ════ FOOTER ════ */}
      <div className="bcb-footer" style={{
        borderTop:'1px solid #e8d5c0',
        textAlign:'center', padding:'18px 20px',
        background:'#fdf6ee',
        fontSize:'.64rem', fontWeight:600,
        color:'rgba(61,31,10,.3)', letterSpacing:'.07em',
      }}>
        {shopName} &nbsp;·&nbsp; {txt(shopInfo.address,'ວຽງຈັນ, ລາວ')}
      </div>

    </div>
  )
}
