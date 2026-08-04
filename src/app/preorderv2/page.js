'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const GOLD_BALL    = 'radial-gradient(circle at 35% 30%, #F5DC8A 0%, #C8851A 48%, #7A4E08 100%)'
const PEDESTAL_TOP = 'radial-gradient(ellipse at 50% 35%, #F5DC8A 0%, #C8851A 40%, #7A4E08 100%)'

const FEATURES = [
  { n:'1', title:'ວັດຖຸດິບພຣີມຽມ',   desc:'ຄັດສັນວັດຖຸດິບທີ່ດີທີ່ສຸດ ເພື່ອໃຫ້ທ່ານໄດ້ຮັບລົດຊາດທີ່ດີທີ່ສຸດທຸກຄັ້ງ' },
  { n:'2', title:'ບັນຍາກາດພິເສດ',    desc:'ສຳຜັດປະສົບການ ທີ່ງ່າຍດາຍ ພ້ອມຮັບໄດ້ທັນທີ ຕາມເວລາທີ່ທ່ານເລືອກ' },
  { n:'3', title:'ບໍລິການສ່ວນຕົວ',    desc:'ສາລາເປົາ ທຳມືໃໝ່ ນຶ່ງສົດ ຮ້ອນໆ ນ້ຳໃສທຸກຮອບ ທຸກວັນ' },
  { n:'4', title:'ທີມເຊຟຊ່ຽວຊານ',    desc:'ທີມງານຜ່ານການຝຶກ ດ້ວຍຄວາມທຸ່ມເທ ເພື່ອທ່ານທຸກໜ້ານ' },
]

function tryParse(v, f) { try { return v ? JSON.parse(v) : f } catch { return f } }
function txt(v, f = '') {
  if (!v) return f
  if (typeof v === 'string') return v
  if (typeof v === 'object') return v.lo || v.en || f
  return f
}

function useReveal(threshold = 0.12, immediate = false) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    // Hero (immediate=true): trigger after 2 paint frames so CSS transition fires
    if (immediate) {
      let raf1 = requestAnimationFrame(() => {
        let raf2 = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(raf2)
      })
      return () => cancelAnimationFrame(raf1)
    }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        // RAF ensures browser painted the hidden state before we reveal
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
        obs.disconnect()
      }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, immediate])
  return [ref, visible]
}

/* 3D tilt card — mouse + touch */
function TiltCard({ children, style, className }) {
  const ref = useRef(null)
  const onMove = useCallback(e => {
    const card = ref.current
    if (!card) return
    const r = card.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    const x = (cx - r.left) / r.width - 0.5
    const y = (cy - r.top) / r.height - 0.5
    const deg = e.touches ? 8 : 12
    card.style.transform = `perspective(600px) rotateX(${-y * deg}deg) rotateY(${x * deg}deg) scale(1.04)`
    card.style.boxShadow = `${-x * 14}px ${-y * 14}px 30px rgba(61,31,10,.12)`
  }, [])
  const onLeave = useCallback(() => {
    const card = ref.current
    if (!card) return
    card.style.transform = ''
    card.style.boxShadow = ''
  }, [])
  return (
    <div ref={ref} className={className} style={{ transition:'transform .15s ease, box-shadow .15s ease', transformStyle:'preserve-3d', willChange:'transform', ...style }}
      onMouseMove={onMove} onMouseLeave={onLeave}
      onTouchMove={onMove} onTouchEnd={onLeave}
    >{children}</div>
  )
}

function Cloud({ style }) {
  return (
    <svg viewBox="0 0 96 34" aria-hidden="true" style={{ pointerEvents:'none', ...style }}>
      <path d="M14,28 Q11,16 22,18 Q19,7 31,9 Q33,2 44,5 Q55,2 57,9 Q68,7 65,18 Q76,16 73,28Z"
        fill="none" stroke="#C8951A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4,28 Q3,20 10,21 Q9,14 16,16 Q17,10 23,12"
        fill="none" stroke="#C8951A" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity=".6"/>
    </svg>
  )
}

function Dot({ size = 12, style, className }) {
  return (
    <div className={className} style={{
      width: size, height: size, borderRadius: '50%', background: GOLD_BALL,
      boxShadow: size >= 14 ? '0 4px 14px rgba(200,133,26,.45)' : undefined,
      flexShrink: 0, ...style,
    }} />
  )
}

function BunOnPedestal({ src, size = 150, pedestalW = 96 }) {
  return (
    <div style={{ position:'relative', width: size, paddingBottom: 24, flexShrink: 0 }}>
      <img src={src} alt="bun" style={{
        width: size, height: size, objectFit:'contain', display:'block',
        position:'relative', zIndex:1, filter:'drop-shadow(0 18px 28px rgba(61,31,10,.22))',
      }} />
      <div style={{ position:'absolute', bottom:17, left:'50%', transform:'translateX(-50%)', width:10, height:22, background:'linear-gradient(90deg,#8A5008,#D4A832 40%,#8A5008)', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:5, left:'50%', transform:'translateX(-50%)', width: pedestalW, height:18, borderRadius:'50%', background: PEDESTAL_TOP, boxShadow:'0 6px 22px rgba(200,133,26,.35), inset 0 3px 0 rgba(245,220,138,.3)', zIndex:2 }} />
    </div>
  )
}

export default function PreorderV2Page() {
  const [menus, setMenus]       = useState([])
  const [prices, setPrices]     = useState([])
  const [images, setImages]     = useState({})
  const [shopInfo, setShopInfo] = useState({})
  const [stock, setStock]       = useState([])

  const [heroRef,  heroVis]  = useReveal(0.05, true)
  const [menuRef,  menuVis]  = useReveal(0.08)
  const [featRef,  featVis]  = useReveal(0.08)
  const [ctaRef,   ctaVis]   = useReveal(0.12)
  const [footRef,  footVis]  = useReveal(0.2)

  useEffect(() => {
    if (!supabase) return
    supabase.from('shop_config').select('*').then(({ data }) => {
      if (!data) return
      const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
      setMenus(tryParse(cfg.menus, []))
      setPrices(tryParse(cfg.prices, []))
      setImages(tryParse(cfg.menu_images, {}))
      setShopInfo(tryParse(cfg.shop_info, {}))
      setStock(tryParse(cfg.stock_online, []))
    })
  }, [])

  const visible = menus
    .map((m, i) => ({ m, i }))
    .filter(({ i }) => stock.length === 0 || (stock[i] ?? 1) > 0)

  const img0 = (visible[0] && images[visible[0].i]) || null
  const img1 = (visible[1] && images[visible[1].i]) || null
  const logoSrc  = txt(shopInfo.logo) || '/logo.jpg'
  const shopName = txt(shopInfo.name, 'Basic Chinese Bun')

  return (
    <div style={{ background:'#fdf6ee', color:'#3d1f0a', fontFamily:"'Noto Sans Lao',system-ui,-apple-system,sans-serif", minHeight:'100vh', overflowX:'hidden' }}>

      <style>{`
        @keyframes float3d {
          0%,100% { transform:translateY(0px) rotate3d(1,.3,0,0deg); }
          50%     { transform:translateY(-14px) rotate3d(1,.3,0,4deg); }
        }
        @keyframes floatSm {
          0%,100% { transform:translateY(0px); }
          50%     { transform:translateY(-9px); }
        }
        @keyframes slideLeft {
          from { opacity:0; transform:translateX(-28px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(200,149,26,.45); }
          50%     { box-shadow:0 0 0 14px rgba(200,149,26,0); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }

        .bcb-float    { animation:float3d 3.4s ease-in-out infinite; }
        .bcb-float-sm { animation:floatSm 2.9s .5s ease-in-out infinite; }
        .bcb-float-cta{ animation:float3d 3.1s .4s ease-in-out infinite; }
        .bcb-dot-1    { animation:floatSm 3.1s .1s ease-in-out infinite; }
        .bcb-dot-2    { animation:floatSm 2.6s .6s ease-in-out infinite; }
        .bcb-dot-3    { animation:floatSm 2.9s 1.2s ease-in-out infinite; }
        .bcb-dot-4    { animation:floatSm 3.3s .3s ease-in-out infinite; }
        .bcb-dot-5    { animation:floatSm 2.7s .9s ease-in-out infinite; }
        .bcb-logo-orb { animation:glowPulse 2.5s ease-in-out infinite; }
        .bcb-divider  {
          background:linear-gradient(90deg,transparent,rgba(200,149,26,.6) 30%,rgba(245,220,138,.9) 50%,rgba(200,149,26,.6) 70%,transparent);
          background-size:200% auto;
          animation:shimmer 2.8s linear infinite;
        }

        /* scroll-reveal */
        .rv   { opacity:0; transform:translateY(28px);    transition:opacity .65s ease, transform .65s ease; }
        .rv-s { opacity:0; transform:scale(.88) translateY(16px); transition:opacity .55s ease, transform .55s ease; }
        .rv-l { opacity:0; transform:translateX(-22px);   transition:opacity .6s ease, transform .6s ease; }
        .rv-r { opacity:0; transform:translateX(22px);    transition:opacity .6s ease, transform .6s ease; }
        .rv.in, .rv-s.in, .rv-l.in, .rv-r.in { opacity:1; transform:none; }

        /* hero text — slideLeft */
        .bcb-sl { opacity:0; transform:translateX(-28px); transition:opacity .65s ease, transform .65s ease; }
        .bcb-sl.in { opacity:1; transform:none; }

        .d0 { transition-delay:0s; }
        .d1 { transition-delay:.1s; }
        .d2 { transition-delay:.2s; }
        .d3 { transition-delay:.3s; }
        .d4 { transition-delay:.4s; }
        .d5 { transition-delay:.5s; }

        /* hover effects */
        .bcb-hero-btn { transition:background .2s, color .2s; }
        .bcb-hero-btn:hover { background:#3d1f0a !important; color:#fdf6ee !important; }
        .bcb-nav-btn:hover { transform:scale(1.05); }
        .bcb-card-plus { transition:transform .2s ease, background .2s ease; }
        .bcb-card-wrap:hover .bcb-card-plus { transform:scale(1.12) rotate(90deg) !important; background:#C8951A !important; }
        .bcb-card-img  { transition:transform .3s ease; }
        .bcb-card-wrap:hover .bcb-card-img { transform:translateY(-6px); }
        .bcb-cta-btn:hover { transform:scale(1.04); }
      `}</style>

      {/* ════ NAV — sticky frosted glass ════ */}
      <nav style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 22px',
        borderBottom:'1px solid #e8d5c0',
        background:'rgba(253,246,238,.92)',
        backdropFilter:'blur(14px)',
        WebkitBackdropFilter:'blur(14px)',
        position:'sticky', top:0, zIndex:100,
      }}>
        <div className="rv-s in d0" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="bcb-logo-orb" style={{
            width:32, height:32, borderRadius:'50%',
            background: GOLD_BALL,
            border:'1.5px solid #e8d5c0', flexShrink:0,
          }} />
          <span style={{ fontWeight:900, fontSize:'.95rem', color:'#3d1f0a', letterSpacing:'.08em' }}>BCB</span>
        </div>
        <a href="/preorder" className="bcb-nav-btn rv in d2" style={{
          background:'#3d1f0a', color:'#fdf6ee', fontWeight:900, fontSize:'.76rem',
          padding:'9px 20px', borderRadius:99, textDecoration:'none', letterSpacing:'.06em',
          display:'inline-block', transition:'transform .2s',
        }}>ສັ່ງດ່ວນ</a>
      </nav>

      {/* ════ HERO ════ */}
      <section ref={heroRef} style={{ padding:'38px 22px 40px', position:'relative', overflow:'hidden', background:'#fdf6ee' }}>
        <div style={{ position:'absolute', top:-60, right:-40, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(200,149,26,.10) 0%,transparent 65%)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>

          {/* LEFT — slideLeft stagger */}
          <div style={{ flex:1, zIndex:1, minWidth:0 }}>
            <h1 style={{ margin:'0 0 12px', lineHeight:1.15 }}>
              <span className={`bcb-sl ${heroVis?'in':''} d0`} style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#3d1f0a', letterSpacing:'-.02em' }}>ສຳຜັດ</span>
              <span className={`bcb-sl ${heroVis?'in':''} d1`} style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#3d1f0a', letterSpacing:'-.02em' }}>ສຸນທຣີ</span>
              <span className={`bcb-sl ${heroVis?'in':''} d2`} style={{ display:'block', fontSize:'2.4rem', fontWeight:900, color:'#C8951A', letterSpacing:'-.02em' }}>ຊາລາເປົາ</span>
            </h1>
            <p className={`rv ${heroVis?'in':''} d3`} style={{ margin:'0 0 22px', fontSize:'.7rem', color:'rgba(61,31,10,.45)', lineHeight:1.85, maxWidth:190 }}>
              ສາລາເປົາທຳມື ສົດໃໝ່ ນຶ່ງທຸກຮອບ ດ້ວຍວັດຖຸດິບຄຸນນະພາບ ສຳລັບທ່ານໂດຍສະເພາະ
            </p>
            <a href="/preorder" className={`bcb-hero-btn rv ${heroVis?'in':''} d4`} style={{
              display:'inline-flex', alignItems:'center', gap:8,
              border:'1.5px solid #3d1f0a', color:'#3d1f0a', fontWeight:900, fontSize:'.83rem',
              padding:'11px 22px', borderRadius:99, textDecoration:'none', letterSpacing:'.04em',
            }}>ເລືອກເມນູ →</a>
          </div>

          {/* RIGHT — buns float3d */}
          <div style={{ flexShrink:0, width:158, position:'relative', height:248, zIndex:1 }}>
            <Cloud style={{ position:'absolute', top:-4, right:-4, width:60, opacity:.3 }} />

            {img1 && (
              <img src={img1} alt="bun2" className="bcb-float-sm"
                style={{ position:'absolute', top:8, left:0, width:78, height:78, objectFit:'contain', filter:'drop-shadow(0 8px 16px rgba(61,31,10,.2))', zIndex:1 }} />
            )}

            <div className="bcb-float" style={{ position:'absolute', bottom:0, right:0, zIndex:2 }}>
              <BunOnPedestal src={img0 || logoSrc} size={148} pedestalW={90} />
            </div>

            <Dot size={18} style={{ position:'absolute', top:0,    right:20 }} className="bcb-dot-1" />
            <Dot size={11} style={{ position:'absolute', top:60,   right:-4 }} className="bcb-dot-2" />
            <Dot size={14} style={{ position:'absolute', top:120,  right:-8 }} className="bcb-dot-3" />
            <Dot size={8}  style={{ position:'absolute', top:30,   left:60  }} className="bcb-dot-4" />
            <Dot size={9}  style={{ position:'absolute', bottom:60,left:-4  }} className="bcb-dot-5" />
          </div>
        </div>
      </section>

      <div className="bcb-divider" style={{ height:1, margin:'0 22px' }} />

      {/* ════ MENU CARDS ════ */}
      <section ref={menuRef} style={{ background:'#fffbf6', paddingBottom:8 }}>
        <div style={{ display:'flex', gap:14, overflowX:'auto', padding:'62px 22px 8px', scrollSnapType:'x mandatory', WebkitOverflowScrolling:'touch', msOverflowStyle:'none', scrollbarWidth:'none' }}>
          {visible.length === 0 ? (
            <p style={{ padding:'20px', color:'rgba(61,31,10,.3)', fontSize:'.8rem' }}>ສິນຄ້າໝົດຊົ່ວຄາວ</p>
          ) : visible.map(({ m, i }, vi) => (
            <a key={i} href="/preorder"
              className={`bcb-card-wrap rv-s ${menuVis?'in':''} d${vi}`}
              style={{ flexShrink:0, scrollSnapAlign:'start', textDecoration:'none', width:166, paddingTop:52, position:'relative', display:'block' }}
            >
              {/* bun image floats up on hover */}
              <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:104, height:104, zIndex:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {images[i] ? (
                  <img src={images[i]} alt={txt(m)} className="bcb-card-img"
                    style={{ width:104, height:104, objectFit:'contain', filter:'drop-shadow(0 10px 18px rgba(61,31,10,.25))' }} />
                ) : (
                  <div className="bcb-card-img" style={{ width:80, height:80, borderRadius:'50%', background:'#e8d5c0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem' }}>🥟</div>
                )}
                <div style={{ position:'absolute', top:4, left:4, background:'#3d1f0a', color:'#fdf6ee', fontWeight:900, fontSize:'.56rem', padding:'3px 8px', borderRadius:99 }}>
                  {Number(prices[i] ?? 0).toLocaleString()}
                </div>
              </div>

              {/* 3D tilt card body */}
              <TiltCard style={{ borderRadius:22, background:'#fdf6ee', border:'1px solid #e8d5c0', boxShadow:'0 4px 16px rgba(61,31,10,.07)', padding:'60px 14px 18px', textAlign:'center', position:'relative', zIndex:1 }}>
                <div style={{ fontWeight:900, fontSize:'.88rem', color:'#3d1f0a', lineHeight:1.3, marginBottom:6 }}>{txt(m,'?')}</div>
                <div style={{ fontSize:'.63rem', color:'rgba(61,31,10,.4)', lineHeight:1.65, marginBottom:14 }}>ສາລາເປົາ ສົດໃໝ່<br/>ຄຸນນະພາບສູງ</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ color:'#C8951A', fontWeight:900, fontSize:'.78rem' }}>{Number(prices[i] ?? 0).toLocaleString()} ກີບ</span>
                  <div className="bcb-card-plus" style={{ width:30, height:30, borderRadius:'50%', background:'#3d1f0a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fdf6ee', fontWeight:900, fontSize:'1.1rem', flexShrink:0 }}>+</div>
                </div>
              </TiltCard>
            </a>
          ))}
        </div>
        <div className={`rv ${menuVis?'in':''} d5`} style={{ textAlign:'center', padding:'16px 0 28px' }}>
          <a href="/preorder" style={{ fontSize:'.73rem', color:'rgba(61,31,10,.4)', fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>ເບິ່ງທັງໝົດ →</a>
        </div>
      </section>

      <div className="bcb-divider" style={{ height:1, margin:'0 22px' }} />

      {/* ════ FEATURES ════ */}
      <section ref={featRef} style={{ padding:'52px 22px 60px', position:'relative', overflow:'hidden', background:'#fdf6ee' }}>
        <div className={`rv ${featVis?'in':''} d0`} style={{ textAlign:'center', marginBottom:44, position:'relative', zIndex:1 }}>
          <span style={{ fontWeight:900, fontSize:'.76rem', color:'rgba(200,149,26,.7)', letterSpacing:'.4em' }}>
            {shopName.toUpperCase()}
          </span>
        </div>

        <Dot size={10} style={{ position:'absolute', top:40,    left:14,  opacity:.55 }} className="bcb-dot-1" />
        <Dot size={16} style={{ position:'absolute', bottom:40, right:14, opacity:.7  }} className="bcb-dot-3" />
        <Dot size={8}  style={{ position:'absolute', top:'50%', right:8,  opacity:.5  }} className="bcb-dot-5" />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'52px 20px', position:'relative', zIndex:1 }}>
          {FEATURES.map(({ n, title, desc }, fi) => (
            <div key={n} className={`rv ${featVis?'in':''} d${fi+1}`}>
              <div style={{ fontSize:'8rem', fontWeight:900, lineHeight:0.82, color:'rgba(61,31,10,.055)', letterSpacing:'-.05em', fontVariantNumeric:'tabular-nums', marginLeft:-8, marginBottom:10, userSelect:'none' }}>{n}</div>
              <div style={{ fontWeight:900, fontSize:'.92rem', color:'#3d1f0a', marginBottom:8, lineHeight:1.3 }}>{title}</div>
              <div style={{ fontSize:'.69rem', color:'rgba(61,31,10,.45)', lineHeight:1.75 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════ CTA CARD ════ */}
      <div ref={ctaRef} className={`rv-s ${ctaVis?'in':''} d1`} style={{ padding:'0 16px 60px', background:'#fdf6ee' }}>
        <div style={{ borderRadius:24, background:'#3d1f0a', boxShadow:'0 8px 40px rgba(61,31,10,.2)', padding:'36px 24px', position:'relative', overflow:'hidden' }}>
          <Cloud style={{ position:'absolute', bottom:18, left:12, width:56, opacity:.18 }} />
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ flex:1 }}>
              <h2 className={`rv-l ${ctaVis?'in':''} d2`} style={{ margin:'0 0 20px', fontSize:'1.5rem', fontWeight:900, color:'#fdf6ee', lineHeight:1.28 }}>
                ຮ່ວມຄົ້ນຫາ<br/>ຊາລາເປົາໄສ້<br/>
                <span style={{ color:'#D4A832' }}>ທີ່ໃຊ່ສຳລັບທ່ານ?</span>
              </h2>
              <a href="/preorder" className={`bcb-cta-btn rv ${ctaVis?'in':''} d4`} style={{
                display:'inline-flex', alignItems:'center', gap:7, background:'#fdf6ee',
                color:'#3d1f0a', fontWeight:900, fontSize:'.86rem',
                padding:'12px 22px', borderRadius:99, textDecoration:'none', letterSpacing:'.03em',
                transition:'transform .2s',
              }}>ຮ່ວມຄົ້ນຫາ</a>
            </div>
            <div className={`rv-r ${ctaVis?'in':''} d2`} style={{ flexShrink:0, position:'relative', paddingTop:8 }}>
              <Cloud style={{ position:'absolute', top:-16, right:-8, width:44, opacity:.22 }} />
              <div className="bcb-float-cta"><BunOnPedestal src={img0 || logoSrc} size={124} pedestalW={78} /></div>
              <Dot size={15} style={{ position:'absolute', top:-10,    right:6   }} className="bcb-dot-1" />
              <Dot size={9}  style={{ position:'absolute', top:'38%',  right:-12 }} className="bcb-dot-3" />
              <Dot size={11} style={{ position:'absolute', bottom:8,   left:-6   }} className="bcb-dot-5" />
              <Dot size={7}  style={{ position:'absolute', top:10,     left:-2   }} className="bcb-dot-2" />
            </div>
          </div>
        </div>
      </div>

      {/* ════ FOOTER ════ */}
      <div ref={footRef} className={`rv ${footVis?'in':''} d0`} style={{
        borderTop:'1px solid #e8d5c0', textAlign:'center', padding:'18px 20px',
        background:'#fdf6ee', fontSize:'.64rem', fontWeight:600,
        color:'rgba(61,31,10,.3)', letterSpacing:'.07em',
      }}>
        {shopName} &nbsp;·&nbsp; {txt(shopInfo.address,'ວຽງຈັນ, ລາວ')}
      </div>

    </div>
  )
}
