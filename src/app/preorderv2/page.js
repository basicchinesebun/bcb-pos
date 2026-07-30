import { supabase } from '../../lib/supabase'

const GRADIENTS = [
  ['#8B4513', '#3d1f00'],
  ['#1B5E20', '#0a2e10'],
  ['#1A237E', '#0d1240'],
  ['#4A148C', '#200a40'],
  ['#1B5E20', '#0a2e10'],
  ['#BF360C', '#5c1800'],
  ['#006064', '#002a2e'],
  ['#4A148C', '#200a40'],
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
    <div style={{ minHeight: '100vh', background: '#F5EDE0', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(170deg, #1a0e07 0%, #2E1C12 60%, #3a2218 100%)',
        padding: '56px 24px 80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* bg circles */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,216,122,.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:10, left:-50, width:160, height:160, borderRadius:'50%', background:'rgba(255,216,122,.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'40%', right:'-10%', width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,.025)', pointerEvents:'none' }} />

        {/* logo */}
        <div style={{
          width: 104, height: 104, borderRadius: '50%', overflow: 'hidden',
          border: '2.5px solid rgba(255,216,122,.5)',
          boxShadow: '0 0 0 10px rgba(255,216,122,.07), 0 20px 60px rgba(0,0,0,.55)',
        }}>
          <img src={txt(shopInfo.logo) || '/logo.jpg'} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>

        {/* name + tag */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
          <div style={{ color:'#FAF2E7', fontWeight:900, fontSize:'2rem', letterSpacing:'-.02em', lineHeight:1.1 }}>
            {txt(shopInfo.name, 'Basic Chinese Bun')}
          </div>
          <div style={{ color:'rgba(255,216,122,.8)', fontSize:'.82rem', fontWeight:700, letterSpacing:'.06em' }}>
            ສາລາເປົາ · ໝົມປັງໂຕ · ສົດໃໝ່ທຸກວັນ
          </div>
        </div>

        {/* badge */}
        <div style={{
          background:'rgba(255,216,122,.12)',
          border:'1px solid rgba(255,216,122,.28)',
          borderRadius:99, padding:'7px 18px',
          fontSize:'.72rem', fontWeight:800, color:'#FFD87A', letterSpacing:'.06em',
        }}>
          ✦ &nbsp;ເປີດຮັບຄຳສັ່ງທຸກວັນ&nbsp; ✦
        </div>
      </div>

      {/* ── Wave ── */}
      <svg viewBox="0 0 400 48" preserveAspectRatio="none" style={{ display:'block', width:'100%', height:48, marginTop:-1, background:'linear-gradient(170deg,#1a0e07 0%,#2E1C12 60%,#3a2218 100%)' }}>
        <path d="M0,16 C80,48 160,0 260,28 C320,42 370,14 400,20 L400,48 L0,48Z" fill="#F5EDE0"/>
      </svg>

      {/* ── Menu section ── */}
      <div style={{ padding:'24px 20px 12px' }}>

        {/* header row */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:'.7rem', fontWeight:800, color:'#C8956A', letterSpacing:'.1em', marginBottom:4 }}>
              MENU
            </div>
            <div style={{ fontWeight:900, fontSize:'1.3rem', color:'#1a0e07', lineHeight:1 }}>
              ເລືອກສິ່ງທີ່ຊອບ 🥟
            </div>
          </div>
          {visibleMenus.length > 0 && (
            <div style={{
              background:'rgba(46,28,18,.08)',
              borderRadius:99, padding:'4px 12px',
              fontSize:'.72rem', fontWeight:800, color:'#7B4F2E',
            }}>
              {visibleMenus.length} ລາຍການ
            </div>
          )}
        </div>

        {visibleMenus.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#9E7B6A', fontWeight:700 }}>
            ສິນຄ້າໝົດຊົ່ວຄາວ
          </div>
        ) : (
          <div style={{
            display:'flex', gap:14,
            overflowX:'auto', paddingBottom:20, paddingTop:8,
            scrollSnapType:'x mandatory',
            WebkitOverflowScrolling:'touch',
            marginLeft:-4, paddingLeft:4,
          }}>
            {visibleMenus.map(({ m, i }) => {
              const [colorA, colorB] = GRADIENTS[i % GRADIENTS.length]
              return (
                <a key={i} href="/preorder" style={{ flexShrink:0, scrollSnapAlign:'start', textDecoration:'none' }}>
                  <div style={{
                    width:162, height:236,
                    borderRadius:24,
                    position:'relative', overflow:'hidden',
                    boxShadow:'0 14px 44px rgba(46,28,18,.25), 0 4px 12px rgba(46,28,18,.12)',
                    animation:`bcbFloat 3.6s ease-in-out ${(i * 0.55) % 2.8}s infinite`,
                  }}>
                    {images[i]
                      ? <img src={images[i]} alt={txt(m)} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                      : (
                          <>
                            <div style={{ position:'absolute', inset:0, background:`linear-gradient(150deg, ${colorA} 0%, ${colorB} 100%)` }} />
                            <div style={{ position:'absolute', top:26, left:'50%', transform:'translateX(-50%)', fontSize:'4rem', filter:'drop-shadow(0 4px 12px rgba(0,0,0,.4))' }}>🥟</div>
                          </>
                        )
                    }

                    {/* shine top-left */}
                    <div style={{ position:'absolute', top:0, left:0, width:'55%', height:'42%', background:'linear-gradient(135deg,rgba(255,255,255,.15) 0%,transparent 100%)', pointerEvents:'none' }} />

                    {/* gradient bottom overlay */}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(8,4,1,.9) 40%, rgba(8,4,1,.2) 68%, transparent 100%)', pointerEvents:'none' }} />

                    {/* text */}
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 16px 18px' }}>
                      <div style={{ color:'#fff', fontWeight:900, fontSize:'.92rem', lineHeight:1.25, marginBottom:5 }}>
                        {txt(m, '?')}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ color:'#FFD87A', fontWeight:800, fontSize:'.8rem' }}>
                          {Number(prices[i] ?? 0).toLocaleString()} ກີບ
                        </div>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', color:'#fff' }}>
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div style={{ padding:'16px 20px 52px', display:'flex', flexDirection:'column', gap:12 }}>

        <a href="/preorder" style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          background:'linear-gradient(135deg, #00C46B 0%, #009E56 100%)',
          color:'#fff', fontWeight:900, fontSize:'1.05rem',
          padding:'19px 0', borderRadius:99, textDecoration:'none',
          boxShadow:'0 10px 32px rgba(0,168,89,.38), 0 2px 8px rgba(0,168,89,.2)',
          letterSpacing:'.04em',
        }}>
          <span>ສັ່ງດ່ວນ</span>
          <span style={{ fontSize:'1.1em', marginTop:1 }}>→</span>
        </a>

        <a href="/preorder" style={{
          display:'block', color:'#9E7B6A', fontWeight:700,
          fontSize:'.8rem', textAlign:'center', textDecoration:'none', padding:'2px 0',
        }}>
          ເບິ່ງລາຄາ · ຊ່ອງທາງຊຳລະ · ຕິດຕໍ່ຮ້ານ
        </a>
      </div>

      {/* ── Footer ── */}
      <div style={{
        background:'#1a0e07', color:'rgba(253,246,238,.3)',
        textAlign:'center', padding:'22px 20px',
        fontSize:'.73rem', fontWeight:600, letterSpacing:'.04em',
      }}>
        {txt(shopInfo.name, 'Basic Chinese Bun')} &nbsp;·&nbsp; {txt(shopInfo.address, 'ວຽງຈັນ, ລາວ')}
      </div>
    </div>
  )
}
