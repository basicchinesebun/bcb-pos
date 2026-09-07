'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DisplayPage() {
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [qrImage, setQrImage] = useState(null)
  const [order, setOrder] = useState({ items: [], total: 0 })
  const [menus, setMenus] = useState([])
  const [prices, setPrices] = useState([])
  const [images, setImages] = useState({})
  const [stock, setStock] = useState([])

  useEffect(() => {
    if (!supabase) return
    supabase.from('shop_config').select('key,value').then(({ data }) => {
      if (!data) return
      const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
      if (cfg.shop_info) try { setShopInfo(JSON.parse(cfg.shop_info)) } catch (_) {}
      if (cfg.qr_image) setQrImage(cfg.qr_image)
      if (cfg.display_order) try { setOrder(JSON.parse(cfg.display_order)) } catch (_) {}
      if (cfg.menus) try { setMenus(JSON.parse(cfg.menus)) } catch (_) {}
      if (cfg.prices) try { setPrices(JSON.parse(cfg.prices)) } catch (_) {}
      if (cfg.menu_images) try { setImages(JSON.parse(cfg.menu_images)) } catch (_) {}
      if (cfg.stock_shop) try { setStock(JSON.parse(cfg.stock_shop)) } catch (_) {}
    })
    const ch = supabase.channel('customer-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config' }, payload => {
        const key = payload.new?.key
        const val = payload.new?.value
        if (key === 'display_order') { try { setOrder(JSON.parse(val)) } catch (_) {} }
        else if (key === 'qr_image') setQrImage(val)
        else if (key === 'shop_info') { try { setShopInfo(JSON.parse(val)) } catch (_) {} }
        else if (key === 'menus') { try { setMenus(JSON.parse(val)) } catch (_) {} }
        else if (key === 'prices') { try { setPrices(JSON.parse(val)) } catch (_) {} }
        else if (key === 'menu_images') { try { setImages(JSON.parse(val)) } catch (_) {} }
        else if (key === 'stock_shop') { try { setStock(JSON.parse(val)) } catch (_) {} }
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const hasOrder = order.items && order.items.length > 0

  // The board fits exactly 8 cards (4 x 2). Shops carry more menu items than
  // that, and nobody is standing at the customer screen to scroll it, so page
  // through the whole menu on a timer instead of only ever showing the first 8.
  const PAGE_SIZE = 8
  const pageCount = Math.max(1, Math.ceil(menus.length / PAGE_SIZE))
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (pageCount <= 1) { setPage(0); return }
    const t = setInterval(() => setPage(p => (p + 1) % pageCount), 8000)
    return () => clearInterval(t)
  }, [pageCount])

  const safePage = page % pageCount
  const pageMenus = menus
    .map((m, i) => ({ m, i }))
    .slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="h-dvh overflow-hidden flex flex-col select-none px-6 py-4 md:px-10 md:py-5" style={{ background: 'var(--brown)' }}>
      <div className="font-serif font-black text-center mb-2 flex-shrink-0" style={{ fontSize: 'clamp(20px,3vw,34px)', color: 'var(--cream)' }}>
        {shopInfo.name}
      </div>

      {!hasOrder ? (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="text-center font-black mb-2 flex-shrink-0" style={{ fontSize: 'clamp(13px,1.4vw,18px)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(253,246,238,0.55)' }}>
            ເມນູມື້ນີ້ · Today's Menu
          </div>
          {menus.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
              <div className="text-sm font-bold" style={{ color: 'rgba(253,246,238,0.4)' }}>ຍັງບໍ່ໄດ້ຕັ້ງເມນູ</div>
              {qrImage && (
                <img src={qrImage} alt="QR ຊຳລະເງິນ" className="rounded-2xl" style={{ width: 'min(50vw, 320px)', background: '#fff', padding: 16 }} />
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden grid gap-2.5 grid-cols-4 grid-rows-2">
                {pageMenus.map(({ m, i }) => {
                  const left = stock[i] || 0
                  const isOut = left <= 0
                  return (
                    <div key={i} className="rounded-xl overflow-hidden flex flex-col h-full" style={{ background: 'var(--warm-white)', opacity: isOut ? 0.45 : 1 }}>
                      <div className="relative flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--cream2)' }}>
                        {images[i] ? (
                          <img src={images[i]} alt={m.lo} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-3xl">🥟</span>
                        )}
                        {!isOut && (
                          <span
                            className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full font-black"
                            style={{ background: 'rgba(61,31,10,0.85)', color: 'var(--cream)', fontSize: 'clamp(10px,0.9vw,13px)' }}
                          >
                            ເຫຼືອ {left}
                          </span>
                        )}
                      </div>
                      <div className="px-2.5 py-1.5 flex-shrink-0 min-w-0">
                        <div className="font-bold leading-tight truncate" style={{ color: 'var(--brown)', fontSize: 'clamp(11px,1vw,14px)' }}>{m.lo}</div>
                        <div className="font-black mt-0.5" style={{ color: isOut ? 'var(--gray3)' : 'var(--brown2)', fontSize: 'clamp(12px,1.15vw,16px)' }}>
                          {isOut ? 'ໝົດ' : `${(prices[i] || 0).toLocaleString()} ກີບ`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {pageCount > 1 && (
                <div className="flex-shrink-0 flex justify-center gap-1.5 pt-2">
                  {Array.from({ length: pageCount }).map((_, p) => (
                    <span
                      key={p}
                      className="rounded-full transition-all"
                      style={{
                        width: p === safePage ? 18 : 6, height: 6,
                        background: p === safePage ? 'var(--cream)' : 'rgba(253,246,238,0.3)',
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 w-full max-w-5xl mx-auto grid gap-8 items-center" style={{ gridTemplateColumns: qrImage ? '1fr 1.15fr' : '1fr' }}>
          <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--warm-white)' }}>
            <div className="px-6 py-4 text-xs font-black tracking-widest uppercase" style={{ background: 'var(--cream2)', color: 'var(--gray3)' }}>
              ລາຍການ · Your Order
            </div>
            <div className="px-6 py-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between py-3 border-b border-[#f5ebe0]" style={{ fontSize: 'clamp(16px,2vw,22px)' }}>
                  <span className="font-bold" style={{ color: 'var(--brown)' }}>{it.name} × {it.qty}</span>
                  <span className="font-black" style={{ color: 'var(--brown)' }}>{(it.sub || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-5 flex justify-between items-center" style={{ background: '#3d1f0a' }}>
              <span className="font-black tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.6)', fontSize: 'clamp(12px,1.4vw,16px)' }}>ລວມ · TOTAL</span>
              <span className="font-serif font-black" style={{ color: 'var(--cream)', fontSize: 'clamp(28px,4vw,48px)' }}>{(order.total || 0).toLocaleString()} ກີບ</span>
            </div>
          </div>
          {qrImage && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl p-6" style={{ background: 'var(--warm-white)' }}>
              <div className="text-sm font-black tracking-widest uppercase" style={{ color: 'var(--gray3)' }}>ສະແກນຊຳລະ</div>
              <img src={qrImage} alt="QR" className="rounded-xl" style={{ width: '100%', maxWidth: 460 }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
