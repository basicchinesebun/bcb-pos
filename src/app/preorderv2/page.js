'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const PALETTE = [
  '#7B3F00', '#1B4F2A', '#1A2D5A', '#4a1942',
  '#2d4a1a', '#5c2d00', '#1a3d4a', '#3d1f4a',
]

function MenuCard({ menu, price, image, color, index }) {
  return (
    <div style={{
      flexShrink: 0,
      width: 150,
      height: 200,
      borderRadius: 20,
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 20px 50px rgba(46,28,18,.3), 0 6px 16px rgba(46,28,18,.15)',
      animation: `bcbFloat 3.2s ease-in-out ${(index * 0.45) % 2}s infinite`,
    }}>
      {image
        ? <img src={image} alt={menu} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: color }} />
      }

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,.72) 40%, transparent 70%)',
      }} />

      {!image && (
        <div style={{
          position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
          fontSize: '3.6rem', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.35))',
        }}>🥟</div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px 16px' }}>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: '.88rem', lineHeight: 1.25, marginBottom: 3 }}>
          {menu}
        </div>
        <div style={{ color: '#FFD87A', fontWeight: 800, fontSize: '.78rem' }}>
          {Number(price).toLocaleString()} ກີບ
        </div>
      </div>
    </div>
  )
}

export default function PreorderV2Page() {
  const [menus, setMenus]   = useState([])
  const [prices, setPrices] = useState([])
  const [images, setImages] = useState({})
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [stock, setStock]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.from('shop_config').select('*').then(({ data }) => {
      if (!data) { setLoading(false); return }
      try {
        const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
        try { if (cfg.menus)        setMenus(JSON.parse(cfg.menus)) }        catch (_) {}
        try { if (cfg.prices)       setPrices(JSON.parse(cfg.prices)) }      catch (_) {}
        try { if (cfg.menu_images)  setImages(JSON.parse(cfg.menu_images)) } catch (_) {}
        try { if (cfg.shop_info)    setShopInfo(JSON.parse(cfg.shop_info)) } catch (_) {}
        try { if (cfg.stock_online) setStock(JSON.parse(cfg.stock_online)) } catch (_) {}
      } catch (_) {}
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const visibleMenus = menus.map((m, i) => ({ m, i })).filter(({ i }) => stock.length === 0 || (stock[i] ?? 1) > 0)

  return (
    <div style={{ minHeight: '100svh', background: '#FAF2E7', fontFamily: 'system-ui, sans-serif' }}>

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
          <img src={shopInfo.logo || '/logo.jpg'} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ color: '#FAF2E7', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '.01em' }}>
            {shopInfo.name || 'Basic Chinese Bun'}
          </div>
          <div style={{ color: 'rgba(253,246,238,.5)', fontSize: '.88rem', marginTop: 6, fontWeight: 600 }}>
            ສາລາເປົາ · ໝົມປັງໂຕ · ສົດໃໝ່ທຸກວັນ
          </div>
        </div>
      </div>

      <svg viewBox="0 0 400 32" style={{ display: 'block', background: '#2E1C12', marginBottom: -1 }}>
        <path d="M0,0 Q100,32 200,16 Q300,0 400,24 L400,32 L0,32Z" fill="#FAF2E7" />
      </svg>

      <div style={{ padding: '32px 20px 20px' }}>
        <p style={{ fontWeight: 900, fontSize: '1.1rem', color: '#2E1C12', marginBottom: 6 }}>
          ເລືອກໄດ້ຫຼາຍຮົດ 🥟
        </p>
        <p style={{ fontSize: '.82rem', color: '#9E7B6A', marginBottom: 28 }}>
          ເລື່ອນເບິ່ງເມນູທັງໝົດ
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9E7B6A', fontWeight: 700 }}>
            ກຳລັງໂຫຼດ...
          </div>
        ) : visibleMenus.length === 0 ? (
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
              <div key={i} style={{ scrollSnapAlign: 'start' }}>
                <MenuCard
                  menu={m}
                  price={prices[i] ?? 0}
                  image={images[i] || null}
                  color={PALETTE[i % PALETTE.length]}
                  index={i}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 20px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <a href="/preorder" style={{
          display: 'block',
          background: '#00A859',
          color: '#fff',
          fontWeight: 900,
          fontSize: '1rem',
          textAlign: 'center',
          padding: '17px 0',
          borderRadius: 99,
          textDecoration: 'none',
          boxShadow: '0 6px 24px rgba(0,168,89,.35)',
          letterSpacing: '.02em',
        }}>
          ສັ່ງດ່ວນ →
        </a>
        <a href="/preorder" style={{
          display: 'block',
          color: '#9E7B6A',
          fontWeight: 700,
          fontSize: '.82rem',
          textAlign: 'center',
          textDecoration: 'none',
        }}>
          ເບິ່ງລາຄາ · ຊ່ອງທາງຊຳລະ · ຕິດຕໍ່ຮ້ານ
        </a>
      </div>

      <div style={{
        background: '#2E1C12', color: 'rgba(253,246,238,.4)',
        textAlign: 'center', padding: '20px', fontSize: '.75rem', fontWeight: 600,
      }}>
        {shopInfo.name || 'Basic Chinese Bun'} · {shopInfo.address || 'ວຽງຈັນ, ລາວ'}
      </div>
    </div>
  )
}
