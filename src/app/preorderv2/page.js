import { supabase } from '../../lib/supabase'

const GOLD_BALL = 'radial-gradient(circle at 35% 30%, #F5DC8A 0%, #C8851A 48%, #7A4E08 100%)'
const PEDESTAL_TOP = 'radial-gradient(ellipse at 50% 35%, #F5DC8A 0%, #C8851A 40%, #7A4E08 100%)'

const CARD_BG = [
  '#3D1200','#0D3A16','#12124F','#440870',
  '#522000','#003542','#4A1010','#104A28',
]

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
function Dot({ size = 12, style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: GOLD_BALL,
      boxShadow: size >= 14 ? `0 4px 14px rgba(200,133,26,.55)` : undefined,
      flexShrink: 0,
      ...style,
    }} />
  )
}

/* ── bun image + gold pedestal ── */
function BunOnPedestal({ src, size = 150, pedestalW = 96 }) {
  return (
    <div style={{ position:'relative', width: size, paddingBottom: 20, flexShrink: 0 }}>
      {/* image circle */}
      <div style={{
        width: size, height: size, borderRadius:'50%', overflow:'hidden',
        border:'2.5px solid rgba(200,149,26,.5)',
        boxShadow:'0 20px 55px rgba(0,0,0,.75), 0 0 0 10px rgba(200,149,26,.06)',
        position:'relative', zIndex:1,
      }}>
        <img src={src} alt="bun" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      </div>
      {/* pedestal stem */}
      <div style={{
        position:'absolute', bottom: 14, left:'50%', transform:'translateX(-50%)',
        width: 10, height: 20,
        background:'linear-gradient(90deg,#8A5008,#D4A832 40%,#8A5008)',
        zIndex: 0,
      }} />
      {/* pedestal plate */}
      <div style={{
        position:'absolute', bottom: 4, left:'50%', transform:'translateX(-50%)',
        width: pedestalW, height: 17,
        borderRadius:'50%',
        background: PEDESTAL_TOP,
        boxShadow:'0 6px 22px rgba(200,133,26,.5), inset 0 3px 0 rgba(245,220,138,.3)',
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
      background:'#1E0B02',
      color:'#FAF0E0',
      fontFamily:"'Noto Sans Lao',system-ui,-apple-system,sans-serif",
      minHeight:'100vh', overflowX:'hidden',
    }}>

      {/* bun-pattern watermark */}
      <div style={{
        position:'fixed', inset:0,
        backgroundImage:'url(/bun-pattern.png)',
        backgroundSize:'220%', backgroundPosition:'60% 50%',
        opacity:0.038, filter:'sepia(1) brightness(.5)',
        pointerEvents:'none', zIndex:0,
      }} />

      <div style={{ position:'relative', zIndex:1 }}>

        {/* ════ NAV ════ */}
        <nav style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'15px 22px',
          borderBottom:'1px solid rgba(200,149,26,.08)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', overflow:'hidden',
              border:'1.5px solid rgba(200,149,26,.5)', flexShrink:0,
            }}>
              <img src={logoSrc} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <span style={{ fontWeight:900, fontSize:'.95rem', color:'#D4A832', letterSpacing:'.08em' }}>
              BCB
            </span>
          </div>
          <a href="/preorder" style={{
            background:'linear-gradient(135deg,#C8951A,#8A6008)',
            color:'#1A0800', fontWeight:900, fontSize:'.76rem',
            padding:'9px 20px', borderRadius:99, textDecoration:'none',
            letterSpacing:'.06em', boxShadow:'0 4px 16px rgba(200,149,26,.3)',
          }}>ສັ່ງດ່ວນ</a>
        </nav>

        {/* ════ HERO ════ */}
        <section style={{ padding:'36px 22px 32px', position:'relative', overflow:'hidden' }}>

          {/* ambient glow top-right */}
          <div style={{
            position:'absolute', top:-80, right:-60,
            width:320, height:320, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(210,130,10,.2) 0%,transparent 65%)',
            pointerEvents:'none',
          }} />

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>

            {/* ── LEFT text ── */}
            <div style={{ flex:1, zIndex:1, minWidth:0 }}>

              <h1 style={{ margin:'0 0 12px', lineHeight:1.15 }}>
                <span style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#FAF0E0', letterSpacing:'-.02em' }}>
                  ສຳຜັດ
                </span>
                <span style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#FAF0E0', letterSpacing:'-.02em' }}>
                  ສຸນທຣີ
                </span>
                <span style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#D4A832', letterSpacing:'-.02em' }}>
                  ຊາລາເປົາ
                </span>
              </h1>

              <p style={{ margin:'0 0 22px', fontSize:'.7rem', color:'rgba(250,240,224,.4)', lineHeight:1.85, maxWidth:190 }}>
                ສາລາເປົາທຳມື ສົດໃໝ່ ນຶ່ງທຸກຮອບ ດ້ວຍວັດຖຸດິບຄຸນນະພາບ ສຳລັບທ່ານໂດຍສະເພາະ
              </p>

              {/* outlined button — matching reference */}
              <a href="/preorder" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                border:'1.5px solid rgba(200,149,26,.65)',
                color:'#D4A832', fontWeight:900, fontSize:'.83rem',
                padding:'11px 22px', borderRadius:99, textDecoration:'none',
                letterSpacing:'.04em',
                background:'rgba(200,149,26,.07)',
              }}>
                ເລືອກເມນູ →
              </a>
            </div>

            {/* ── RIGHT: buns + gold balls + cloud ── */}
            <div style={{ flexShrink:0, width:158, position:'relative', height:240, zIndex:1 }}>

              {/* cloud SVG top-right */}
              <Cloud style={{ position:'absolute', top:-4, right:-4, width:60, opacity:.35 }} />

              {/* secondary small circle — top-left (behind main) */}
              {img1 && (
                <div style={{
                  position:'absolute', top:8, left:0,
                  width:78, height:78, borderRadius:'50%', overflow:'hidden',
                  border:'2px solid rgba(200,149,26,.35)',
                  boxShadow:'0 8px 24px rgba(0,0,0,.55)',
                  zIndex:1,
                }}>
                  <img src={img1} alt="bun2" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              )}

              {/* main large bun with pedestal — bottom right */}
              <div style={{ position:'absolute', bottom:0, right:0, zIndex:2 }}>
                <BunOnPedestal src={img0 || logoSrc} size={148} pedestalW={90} />
              </div>

              {/* gold balls */}
              <Dot size={18} style={{ position:'absolute', top:0,   right:20 }} />
              <Dot size={11} style={{ position:'absolute', top:60,  right:-4 }} />
              <Dot size={14} style={{ position:'absolute', top:120, right:-8, boxShadow:'0 4px 12px rgba(200,133,26,.45)' }} />
              <Dot size={8}  style={{ position:'absolute', top:30,  left:60 }} />
              <Dot size={9}  style={{ position:'absolute', bottom:60, left:-4 }} />
            </div>
          </div>
        </section>

        {/* ════ MENU CARDS ════ */}
        <section style={{ paddingBottom:8 }}>

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
              <p style={{ padding:'20px', color:'rgba(250,240,224,.3)', fontSize:'.8rem' }}>ສິນຄ້າໝົດຊົ່ວຄາວ</p>
            ) : visible.map(({ m, i }) => (
              <a key={i} href="/preorder" style={{
                flexShrink:0, scrollSnapAlign:'start',
                textDecoration:'none',
                width:166, paddingTop:52,
                position:'relative', display:'block',
              }}>
                {/* floating circle */}
                <div style={{
                  position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
                  width:104, height:104, borderRadius:'50%', overflow:'hidden',
                  border:'2px solid rgba(200,149,26,.4)',
                  boxShadow:'0 10px 30px rgba(0,0,0,.65)',
                  background: CARD_BG[i % CARD_BG.length],
                  zIndex:2,
                }}>
                  {images[i] && (
                    <img src={images[i]} alt={txt(m)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  )}
                  {/* price badge on circle */}
                  <div style={{
                    position:'absolute', top:7, left:7,
                    background:'linear-gradient(135deg,#C8951A,#8A5008)',
                    color:'#1A0800', fontWeight:900, fontSize:'.56rem',
                    padding:'3px 8px', borderRadius:99,
                    boxShadow:'0 2px 6px rgba(0,0,0,.4)',
                  }}>
                    {Number(prices[i] ?? 0).toLocaleString()}
                  </div>
                </div>

                {/* card body */}
                <div style={{
                  borderRadius:22,
                  background:'linear-gradient(160deg,#220E04,#190A02)',
                  border:'1px solid rgba(200,149,26,.11)',
                  boxShadow:'0 8px 28px rgba(0,0,0,.5)',
                  padding:'60px 14px 18px',
                  textAlign:'center', position:'relative', zIndex:1,
                }}>
                  <div style={{ fontWeight:900, fontSize:'.88rem', color:'#FAF0E0', lineHeight:1.3, marginBottom:6 }}>
                    {txt(m,'?')}
                  </div>
                  <div style={{ fontSize:'.63rem', color:'rgba(250,240,224,.33)', lineHeight:1.65, marginBottom:14 }}>
                    ສາລາເປົາ ສົດໃໝ່<br/>ຄຸນນະພາບສູງ
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ color:'#D4A832', fontWeight:900, fontSize:'.78rem' }}>
                      {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                    </span>
                    <div style={{
                      width:30, height:30, borderRadius:'50%',
                      background:'linear-gradient(135deg,#C8951A,#8A5008)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#1A0800', fontWeight:900, fontSize:'1.1rem',
                      boxShadow:'0 4px 12px rgba(200,149,26,.3)', flexShrink:0,
                    }}>+</div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* "view all" link */}
          <div style={{ textAlign:'center', padding:'16px 0 28px' }}>
            <a href="/preorder" style={{ fontSize:'.73rem', color:'rgba(200,149,26,.55)', fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>
              ເບິ່ງທັງໝົດ →
            </a>
          </div>
        </section>

        {/* thin gold divider */}
        <div style={{ height:1, margin:'0 22px', background:'linear-gradient(90deg,transparent,rgba(200,149,26,.14) 25%,rgba(200,149,26,.14) 75%,transparent)' }} />

        {/* ════ FEATURES — ghost numbers ════ */}
        <section style={{ padding:'52px 22px 60px', position:'relative', overflow:'hidden' }}>

          {/* "BUNSENSE" centered label */}
          <div style={{ textAlign:'center', marginBottom:44, position:'relative', zIndex:1 }}>
            <span style={{ fontWeight:900, fontSize:'.76rem', color:'rgba(200,149,26,.5)', letterSpacing:'.4em' }}>
              {shopName.toUpperCase()}
            </span>
          </div>

          {/* bamboo-steamer-like center decoration */}
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            width:160, height:160,
            borderRadius:16,
            backgroundImage:'url(/bun-pattern.png)',
            backgroundSize:'cover', backgroundPosition:'center',
            opacity:0.07, filter:'sepia(1) brightness(.6)',
            pointerEvents:'none', zIndex:0,
          }} />

          {/* scattered gold balls in features section */}
          <Dot size={10} style={{ position:'absolute', top:40,   left:14,  opacity:.65 }} />
          <Dot size={16} style={{ position:'absolute', bottom:40, right:14 }} />
          <Dot size={8}  style={{ position:'absolute', top:'50%', right:8,  opacity:.6 }} />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'52px 20px', position:'relative', zIndex:1 }}>
            {FEATURES.map(({ n, title, desc }) => (
              <div key={n}>
                {/* very large ghost number */}
                <div style={{
                  fontSize:'8rem', fontWeight:900, lineHeight:0.82,
                  color:'rgba(200,149,26,.08)',
                  letterSpacing:'-.05em',
                  fontVariantNumeric:'tabular-nums',
                  marginLeft:-8, marginBottom:10,
                  userSelect:'none',
                }}>
                  {n}
                </div>
                <div style={{ fontWeight:900, fontSize:'.92rem', color:'#FAF0E0', marginBottom:8, lineHeight:1.3 }}>
                  {title}
                </div>
                <div style={{ fontSize:'.69rem', color:'rgba(250,240,224,.33)', lineHeight:1.75 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════ CTA CARD — rounded card, lighter bg ════ */}
        <div style={{ padding:'0 16px 60px' }}>
          <div style={{
            borderRadius:24,
            background:'#2E1507',
            border:'1px solid rgba(200,149,26,.14)',
            boxShadow:'0 8px 40px rgba(0,0,0,.5)',
            padding:'36px 24px',
            position:'relative', overflow:'hidden',
          }}>
            {/* cloud SVG left-bottom */}
            <Cloud style={{ position:'absolute', bottom:18, left:12, width:56, opacity:.22 }} />

            <div style={{ display:'flex', alignItems:'center', gap:18 }}>

              {/* left: headline + button */}
              <div style={{ flex:1 }}>
                <h2 style={{ margin:'0 0 20px', fontSize:'1.5rem', fontWeight:900, color:'#FAF0E0', lineHeight:1.28 }}>
                  ຮ່ວມຄົ້ນຫາ<br/>
                  ຊາລາເປົາໄສ້<br/>
                  <span style={{ color:'#D4A832' }}>ທີ່ໃຊ່ສຳລັບທ່ານ?</span>
                </h2>
                <a href="/preorder" style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  background:'linear-gradient(135deg,#C8951A,#8A5008)',
                  color:'#1A0800', fontWeight:900, fontSize:'.86rem',
                  padding:'12px 22px', borderRadius:99, textDecoration:'none',
                  boxShadow:'0 8px 28px rgba(200,149,26,.28)',
                  letterSpacing:'.03em',
                }}>
                  ຮ່ວມຄົ້ນຫ້າ
                </a>
              </div>

              {/* right: bun on pedestal + gold balls + cloud */}
              <div style={{ flexShrink:0, position:'relative', paddingTop:8 }}>
                {/* cloud top-right */}
                <Cloud style={{ position:'absolute', top:-16, right:-8, width:44, opacity:.28 }} />

                <BunOnPedestal src={img0 || logoSrc} size={124} pedestalW={78} />

                {/* gold balls */}
                <Dot size={15} style={{ position:'absolute', top:-10, right:6 }} />
                <Dot size={9}  style={{ position:'absolute', top:'38%', right:-12 }} />
                <Dot size={11} style={{ position:'absolute', bottom:8, left:-6, boxShadow:'0 3px 10px rgba(200,133,26,.4)' }} />
                <Dot size={7}  style={{ position:'absolute', top:10, left:-2 }} />
              </div>
            </div>
          </div>
        </div>

        {/* ════ FOOTER ════ */}
        <div style={{
          borderTop:'1px solid rgba(200,149,26,.07)',
          textAlign:'center', padding:'18px 20px',
          fontSize:'.64rem', fontWeight:600,
          color:'rgba(250,240,224,.14)', letterSpacing:'.07em',
        }}>
          {shopName} &nbsp;·&nbsp; {txt(shopInfo.address,'ວຽງຈັນ, ລາວ')}
        </div>

      </div>
    </div>
  )
}
