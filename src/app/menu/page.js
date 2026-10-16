'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// The link the shop pins at the top of a Facebook live: a customer taps it,
// looks once, and decides whether it is worth coming over. So the page answers
// exactly one question — what is on the shelf right now, and how much of it —
// and answers it without a tap.
//
// Deliberately read-only. Nothing here orders, reserves or holds anything; the
// whole point is to get people to the counter.
export default function MenuPage() {
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [menus, setMenus] = useState([])
  const [prices, setPrices] = useState([])
  const [images, setImages] = useState({})
  const [stock, setStock] = useState([])
  const [branches, setBranches] = useState([])
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const parse = (v, fallback) => { try { return JSON.parse(v) } catch { return fallback } }

  // Everything but the stock changes when the owner edits the shop, which is
  // weekly at most — so it is fetched once and left alone.
  const loadAll = useCallback(async () => {
    if (!supabase) { setLoading(false); setFailed(true); return }
    const { data, error } = await supabase.from('shop_config').select('key,value')
    if (error || !data) { setLoading(false); setFailed(true); return }
    const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
    if (cfg.shop_info) setShopInfo(parse(cfg.shop_info, { name: 'Basic Chinese Bun' }))
    if (cfg.menus) setMenus(parse(cfg.menus, []))
    if (cfg.prices) setPrices(parse(cfg.prices, []))
    if (cfg.menu_images) setImages(parse(cfg.menu_images, {}))
    if (cfg.stock_shop) setStock(parse(cfg.stock_shop, []))
    if (cfg.branches) setBranches(parse(cfg.branches, []))
    setUpdatedAt(new Date())
    setFailed(false)
    setLoading(false)
  }, [])

  // Only the stock moves during service, and it is 62 bytes against the whole
  // config's 4.5 kB. During a live there can be a hundred phones sitting on
  // this page at once, so the repeating fetch is the small one — and there is
  // no realtime subscription here on purpose, because a hundred sockets is a
  // bill and a connection cap for a number that is fine fifteen seconds late.
  const loadStock = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('shop_config').select('value').eq('key', 'stock_shop').limit(1)
    if (error || !data || !data.length) { setFailed(true); return }
    const v = parse(data[0].value, null)
    if (Array.isArray(v)) { setStock(v); setUpdatedAt(new Date()); setFailed(false) }
  }, [])

  useEffect(() => {
    loadAll()
    const poll = setInterval(loadStock, 15000)
    // Phones sleep the tab the moment the customer switches back to the live.
    // Refresh on the way back rather than showing them a number from before
    // the thing they just watched sell out.
    const onVisible = () => { if (document.visibilityState === 'visible') loadStock() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [loadAll, loadStock])

  // Only what can actually be bought, biggest pile first. Sold-out items are
  // left off entirely: this page is read on a phone mid-live, and a wall of
  // grey ໝົດ cards to scroll past is the opposite of "come over, we have it".
  // The space they were taking is where the way to the shop goes instead.
  const SHOW = 8
  const inStock = menus
    .map((m, i) => ({ m, i, qty: stock[i] || 0, price: prices[i] || 0 }))
    .filter(r => r.qty > 0)
    .sort((a, b) => b.qty - a.qty)
  const shown = inStock.slice(0, SHOW)
  const moreCount = inStock.length - shown.length
  const totalPieces = inStock.reduce((s, r) => s + r.qty, 0)

  // The branch the shop is sending people to. Taken from the config the owner
  // already fills in rather than written in here, so moving or adding a shop
  // is a settings edit and not a deploy. The saved map link has a space on
  // the front of it, which an href would carry straight into a broken tap.
  const branch = branches.find(b => b.visible !== false && String(b.mapUrl || '').trim())
    || branches.find(b => b.visible !== false)
    || branches[0]
  const mapUrl = String(branch?.mapUrl || '').trim()
  const safeMapUrl = /^https?:\/\//i.test(mapUrl) ? mapUrl : ''
  const phones = [branch?.phone1, branch?.phone2].map(p => String(p || '').trim()).filter(Boolean)

  const clock = d => d
    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : ''

  const LOW = 5

  // Sixteen of the nineteen menus still carry the English name the shop was
  // seeded with — "Menu 12", "Menu 14". On the staff screen that is a harmless
  // placeholder; under a real Lao name on a link the owner pins to a live it
  // reads as a half-finished website. Show the second line only when someone
  // has actually written one.
  const realEn = (en, lo) => {
    const s = String(en || '').trim()
    if (!s) return ''
    if (/^menu\s*\d+$/i.test(s)) return ''
    if (s === String(lo || '').trim()) return ''
    return s
  }
  // Names are typed by hand on a phone and several carry double or trailing
  // spaces; collapse them rather than printing the gap.
  const tidy = s => String(s || '').replace(/\s+/g, ' ').trim()

  function Card({ r, out }) {
    const { m, i, qty, price } = r
    return (
      <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--warm-white)', border: '1.5px solid var(--cream3)' }}>
        <div className="relative w-full overflow-hidden flex items-center justify-center" style={{ aspectRatio: '1 / 1', background: 'var(--cream2)' }}>
          {images[i]
            ? <img src={images[i]} alt={tidy(m.lo) || m.en || ''} loading="lazy" className="w-full h-full object-cover" style={{ filter: out ? 'grayscale(1)' : 'none' }} />
            : <span style={{ fontSize: 44 }}>🥟</span>}
          {out && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(61,31,10,0.6)' }}>
              <span className="font-black rounded-lg" style={{ background: 'rgba(185,28,28,0.95)', color: '#fff', fontSize: 20, padding: '0.16em 0.6em' }}>
                ໝົດ
              </span>
            </div>
          )}
        </div>
        <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1.5 flex-1">
          <div className="font-bold leading-snug" style={{ color: 'var(--brown)', fontSize: 15 }}>{tidy(m.lo)}</div>
          {realEn(m.en, m.lo) && (
            <div className="font-bold leading-tight" style={{ color: 'var(--gray3)', fontSize: 11 }}>{realEn(m.en, m.lo)}</div>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <span className="font-black" style={{ color: out ? 'var(--gray3)' : 'var(--brown2)', fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
              {price.toLocaleString()} <span style={{ fontSize: 11 }}>ກີບ</span>
            </span>
            {!out && (
              // The number is the whole point of the page, so it is a filled
              // pill rather than a line of grey text — and it turns amber under
              // five, because "ເຫຼືອ 2" is the sentence that gets someone off
              // the sofa.
              <span
                className="font-black rounded-full px-2.5 py-1 whitespace-nowrap"
                style={{
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                  background: qty <= LOW ? '#b45309' : 'var(--cream2)',
                  color: qty <= LOW ? '#fff' : 'var(--brown)',
                  border: `1.5px solid ${qty <= LOW ? '#b45309' : 'var(--cream3)'}`,
                }}
              >
                ເຫຼືອ {qty}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--cream)' }}>
      <div className="px-4 pt-5 pb-4" style={{ background: 'var(--brown)' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {shopInfo.logo && (
            <img src={shopInfo.logo} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: 44, height: 44 }} />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-serif font-black leading-tight truncate" style={{ color: 'var(--cream)', fontSize: 20 }}>
              {shopInfo.name}
            </div>
            <div className="font-black tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.5)', fontSize: 10, letterSpacing: '0.18em' }}>
              ເມນູມື້ນີ້ · TODAY AT THE SHOP
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* The honesty line. A stock number with no timestamp is a number
            nobody trusts — and during a live it is the first thing someone
            asks about. */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="font-bold" style={{ color: 'var(--brown)', fontSize: 14 }}>
            {loading
              ? 'ກຳລັງໂຫຼດ...'
              : inStock.length === 0
                ? 'ມື້ນີ້ຂາຍໝົດແລ້ວ'
                : <>ມີຂາຍ <b style={{ fontSize: 16 }}>{inStock.length}</b> ລາຍການ · ລວມ <b style={{ fontSize: 16 }}>{totalPieces}</b> ກ້ອນ</>}
          </div>
          {updatedAt && (
            <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--gray3)', fontSize: 11 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: failed ? '#b45309' : '#16a34a', display: 'inline-block' }} />
              {failed ? 'ອັບເດດບໍ່ໄດ້' : `ອັບເດດ ${clock(updatedAt)}`}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map(k => (
              <div key={k} className="rounded-2xl overflow-hidden" style={{ background: 'var(--cream2)', aspectRatio: '1 / 1.45' }} />
            ))}
          </div>
        ) : failed && menus.length === 0 ? (
          <div className="text-center py-16">
            <div className="font-bold mb-3" style={{ color: 'var(--brown)' }}>ໂຫຼດເມນູບໍ່ໄດ້</div>
            <button onClick={loadAll} className="btn-outline px-5 py-2.5 text-sm">ລອງໃໝ່</button>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-16 font-bold" style={{ color: 'var(--gray3)' }}>ຍັງບໍ່ໄດ້ຕັ້ງເມນູ</div>
        ) : (
          <>
            {shown.length > 0 ? (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {shown.map(r => <Card key={r.i} r={r} out={false} />)}
              </div>
            ) : (
              <div className="rounded-2xl text-center py-10 px-4 font-bold" style={{ background: 'var(--cream2)', color: 'var(--brown)' }}>
                ມື້ນີ້ຂາຍໝົດແລ້ວ 🙏<br />
                <span style={{ color: 'var(--gray3)', fontSize: 13 }}>ພົບກັນໃໝ່ມື້ອື່ນເດີ້</span>
              </div>
            )}

            {/* The page is capped at eight so it stays one thumb-flick long,
                but the summary above counts everything on the shelf — so when
                there is more than fits, say so rather than letting the two
                numbers quietly disagree. */}
            {moreCount > 0 && (
              <div className="text-center font-bold mt-3" style={{ color: 'var(--gray3)', fontSize: 12 }}>
                ແລະ ອີກ {moreCount} ລາຍການທີ່ໜ້າຮ້ານ
              </div>
            )}
          </>
        )}

        {/* Where the sold-out wall used to be. Someone who has scrolled to the
            end of what the shop has is exactly the person deciding whether to
            come over, so this is the spot that has to answer "where are you".
            One tap opens Google Maps with the shop already pinned. */}
        {branch && (
          <div className="rounded-2xl overflow-hidden mt-7" style={{ background: 'var(--brown)' }}>
            <div className="px-5 pt-5 pb-4 text-center">
              <div className="font-black tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.45)', fontSize: 10, letterSpacing: '0.2em' }}>
                ມາຊື້ທີ່ຮ້ານ · COME TO THE SHOP
              </div>
              <div className="font-serif font-black mt-1.5" style={{ color: 'var(--cream)', fontSize: 24 }}>
                {branch.name}
              </div>
              {branch.schedule && (
                <div className="font-bold mt-1" style={{ color: 'rgba(253,246,238,0.6)', fontSize: 13 }}>
                  {branch.schedule}
                </div>
              )}
            </div>
            <div className="px-4 pb-5 flex flex-col gap-2.5">
              {safeMapUrl && (
                <a
                  href={safeMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl font-black active:scale-95 transition-transform"
                  style={{ background: 'var(--cream)', color: 'var(--brown)', minHeight: 54, fontSize: 16 }}
                >
                  📍 ເສັ້ນທາງໄປຮ້ານ · Google Maps
                </a>
              )}
              {phones.length > 0 && (
                <div className="flex gap-2.5">
                  {phones.map(ph => (
                    <a
                      key={ph}
                      href={`tel:${ph.replace(/[^\d+]/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-black active:scale-95 transition-transform"
                      style={{ border: '2px solid rgba(253,246,238,0.3)', color: 'var(--cream)', minHeight: 48, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}
                    >
                      📞 {ph}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center font-bold mt-6 pb-8" style={{ color: 'var(--gray3)', fontSize: 12, lineHeight: 1.7 }}>
          ຈຳນວນແມ່ນຂອງໜ້າຮ້ານ ແລະ ປ່ຽນແປງຕະຫຼອດເວລາ
        </div>
      </div>
    </div>
  )
}
