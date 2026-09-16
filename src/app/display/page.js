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
    // Everything except display_order — menus, prices, images, the QR — only
    // changes when staff edit the shop, so it doesn't belong in the fast loop.
    async function refreshAll() {
      const { data } = await supabase.from('shop_config').select('key,value')
      if (!data) return
      const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
      if (cfg.shop_info) try { setShopInfo(JSON.parse(cfg.shop_info)) } catch (_) {}
      if (cfg.qr_image) setQrImage(cfg.qr_image)
      if (cfg.display_order) try { setOrder(JSON.parse(cfg.display_order)) } catch (_) {}
      if (cfg.menus) try { setMenus(JSON.parse(cfg.menus)) } catch (_) {}
      if (cfg.prices) try { setPrices(JSON.parse(cfg.prices)) } catch (_) {}
      if (cfg.menu_images) try { setImages(JSON.parse(cfg.menu_images)) } catch (_) {}
      if (cfg.stock_shop) try { setStock(JSON.parse(cfg.stock_shop)) } catch (_) {}
    }
    // The one row the customer is actually waiting on.
    async function refreshOrder() {
      const { data } = await supabase.from('shop_config').select('value')
        .in('key', ['display_order', 'stock_shop'])
      if (!data) return
      for (const row of data) {
        try {
          const v = JSON.parse(row.value)
          if (Array.isArray(v)) setStock(v)
          else setOrder(v)
        } catch (_) {}
      }
    }
    refreshAll()
    // This screen runs unattended all day, so it can't depend on the realtime
    // socket staying up — if it drops, the board silently freezes on whatever
    // it last received (a finished order's QR, for instance). Poll as a floor.
    //
    // Split by how fast each thing has to move, because this interval runs
    // every open hour of every day and the whole config is ~4.5 kB: fetching
    // all of it every 2s is ~3 GB a month, most of a free tier's egress, to
    // re-read menu names that change once a week. The order itself is a few
    // hundred bytes, so that can be quick.
    const fast = setInterval(refreshOrder, 2000)
    const slow = setInterval(refreshAll, 60000)
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
    return () => { clearInterval(fast); clearInterval(slow); supabase.removeChannel(ch) }
  }, [])

  // This board faces the customer and nobody is meant to operate it, so take
  // away everything a stray touch, a nudged mouse or an idle timer can do to
  // it: no context menu, no text selection drag, no pinch zoom, no going back
  // a page, and no screen blanking mid-service.
  useEffect(() => {
    const block = e => e.preventDefault()
    document.addEventListener('contextmenu', block)
    document.addEventListener('dragstart', block)
    document.addEventListener('gesturestart', block)

    let lock = null
    let released = false
    const acquireLock = async () => {
      if (released || !navigator.wakeLock) return
      try { lock = await navigator.wakeLock.request('screen') } catch { }
    }
    // The lock is dropped whenever the screen is hidden, so take it again on
    // the way back rather than quietly losing it for the rest of the day.
    const onVisible = () => { if (document.visibilityState === 'visible') acquireLock() }
    acquireLock()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      released = true
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('dragstart', block)
      document.removeEventListener('gesturestart', block)
      document.removeEventListener('visibilitychange', onVisible)
      try { lock?.release() } catch { }
    }
  }, [])

  const hasOrder = order.items && order.items.length > 0
  // QR goes up for every payment method. It was hidden on cash sales for a
  // while on the theory that it was clutter, but at the counter the customer
  // often switches to transferring once they see the total — and staff want
  // it there without having to re-ring the sale.
  const showQr = !!qrImage

  // The board fits exactly 8 cards (4 x 2) and stays on one page — no
  // rotation. Shops carry more items than that, so order them the same way
  // /preorder does: anything in stock floats to the front, sold-out items
  // sink to the back and fall off the board entirely once there are enough
  // in-stock items to fill it.
  const pageMenus = menus
    .map((m, i) => ({ m, i }))
    .sort((a, b) => ((stock[a.i] || 0) === 0 ? 1 : 0) - ((stock[b.i] || 0) === 0 ? 1 : 0))
    .slice(0, 8)

  return (
    <div className="h-dvh overflow-hidden flex flex-col select-none px-6 py-4 md:px-10 md:py-5" style={{ background: 'var(--brown)', touchAction: 'none', cursor: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}>
      <div className="font-serif font-black text-center mb-2 flex-shrink-0" style={{ fontSize: 'clamp(20px,3vw,34px)', color: 'var(--cream)' }}>
        {shopInfo.name}
      </div>

      {order.qrOnly && qrImage ? (
        /* QR-only mode: staff put the payment code up on its own, with no
           order attached, so someone can scan and pay without anything being
           rung up first. Fills the screen — it is meant to be scanned from
           across a counter. */
        <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-0">
          <div className="font-black tracking-widest uppercase flex-shrink-0"
            style={{ fontSize: 'clamp(13px,1.6vw,20px)', letterSpacing: '0.2em', color: 'rgba(253,246,238,0.55)' }}>
            ສະແກນເພື່ອຈ່າຍເງິນ · SCAN TO PAY
          </div>
          <img src={qrImage} alt="QR ຊຳລະເງິນ" className="rounded-2xl flex-shrink min-h-0"
            style={{ height: 'min(62vh, 62vw)', width: 'auto', maxWidth: '90vw', objectFit: 'contain', background: '#fff', padding: 18 }} />
        </div>
      ) : !hasOrder ? (
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
            <div className="flex-1 min-h-0 overflow-hidden grid gap-2.5 grid-cols-4 grid-rows-2">
              {pageMenus.map(({ m, i }) => {
                const isOut = (stock[i] || 0) <= 0
                return (
                    // Sold-out used to be signalled by fading the whole card to
                    // 45%, which on a board read from across the room just made
                    // it hard to see rather than obviously sold out. Mark it the
                    // way /order and /preorder do instead: a dark wash over the
                    // photo with ໝົດ across the middle, and leave the card at
                    // full strength so the label itself stays legible.
                    <div key={i} className="rounded-xl overflow-hidden flex flex-col h-full" style={{ background: 'var(--warm-white)' }}>
                      <div className="relative flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--cream2)' }}>
                        {images[i] ? (
                          <img src={images[i]} alt={m.lo} className="w-full h-full object-cover" loading="lazy" style={{ filter: isOut ? 'grayscale(1)' : 'none' }} />
                        ) : (
                          <span className="text-3xl">🥟</span>
                        )}
                        {isOut && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(61,31,10,0.6)' }}>
                            <span
                              className="font-black rounded-lg"
                              style={{
                                background: 'rgba(185,28,28,0.95)',
                                color: '#fff',
                                fontSize: 'clamp(16px,2.2vw,34px)',
                                padding: '0.18em 0.6em',
                                letterSpacing: '0.04em',
                              }}
                            >
                              ໝົດ
                            </span>
                          </div>
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
          )}
        </div>
      ) : (
        <div className="flex-1 w-full max-w-5xl mx-auto grid gap-8 items-center" style={{ gridTemplateColumns: showQr ? '1fr 1.15fr' : '1fr' }}>
          <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--warm-white)' }}>
            {order.qnum ? (
              <div className="px-6 py-3 text-center" style={{ background: 'var(--cream2)' }}>
                <div className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--gray3)' }}>ເລກຄິວ · QUEUE</div>
                <div className="font-serif font-black leading-none" style={{ color: 'var(--brown)', fontSize: 'clamp(36px,5vw,64px)' }}>
                  {String(order.qnum).padStart(4, '0')}
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 text-xs font-black tracking-widest uppercase" style={{ background: 'var(--cream2)', color: 'var(--gray3)' }}>
                ລາຍການ · Your Order
              </div>
            )}
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
          {showQr && (
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
