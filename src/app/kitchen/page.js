'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const EMOJIS = ['🥟','🍫','🍵','🧁','🍞','🥐','🍮']
const CARD_W = 'min(360px, calc(100vw - 24px))'

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [menus, setMenus] = useState([])
  const [images, setImages] = useState({})
  const [liveStatus, setLiveStatus] = useState('connecting')
  const [filter, setFilter] = useState('all')
  // The order the ✕ is asking about, and the tray-clearing screen.
  const [cancelAsk, setCancelAsk] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSel, setBulkSel] = useState(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    if (!supabase) return
    loadOrders()
    loadConfig()
    const channel = supabase
      .channel('kitchen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe(status => setLiveStatus(status === 'SUBSCRIBED' ? 'live' : 'connecting'))
    // The socket is the fast path, but when it drops the board went a full
    // minute before noticing a new order. Poll often enough that nobody is
    // left waiting on it, and refetch whenever the screen is looked at again.
    const fallback = setInterval(loadOrders, 10000)
    // Keep retrying the menu until it lands, then just keep it fresh. It is a
    // handful of rows, so the cost of asking again is nothing next to a
    // kitchen packing from a board with no pictures on it.
    const configRetry = setInterval(() => {
      if (!configOkRef.current) loadConfig()
    }, 5000)
    const configRefresh = setInterval(loadConfig, 300000)
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      loadOrders()
      if (!configOkRef.current) loadConfig()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(fallback)
      clearInterval(configRetry)
      clearInterval(configRefresh)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  async function loadOrders() {
    const { data } = await supabase.from('orders')
      .select('*').eq('done', false).eq('cancelled', false).neq('status', 'rejected')
      .order('created_at', { ascending: true })
    if (data) setOrders(data)
  }

  // Menu names and photos were fetched once, at mount, and never again. When
  // that single call failed — the database paused, the wifi dropped — the
  // board ran all day with no photos: orders kept arriving, because those are
  // polled, so nothing looked broken enough for anyone to reload it.
  const configOkRef = useRef(false)
  async function loadConfig() {
    const { data, error } = await supabase.from('shop_config').select('*')
    if (error || !data) return
    const cfg = {}
    data.forEach(r => { cfg[r.key] = r.value })
    if (cfg.shop_info) try { setShopInfo(JSON.parse(cfg.shop_info)) } catch { }
    let menuCount = 0
    if (cfg.menus) try { const m = JSON.parse(cfg.menus); setMenus(m); menuCount = m.length } catch { }
    if (cfg.menu_images) try { setImages(JSON.parse(cfg.menu_images)) } catch { }
    configOkRef.current = menuCount > 0
  }

  // Take the card off the board first, then tell the server. Waiting for the
  // round trip left the card sitting there looking unresponsive, so it got
  // tapped again — and by then the list had shifted, so the second tap landed
  // on the next order and marked someone else's food done.
  async function markDone(o) {
    setOrders(prev => prev.filter(x => x.id !== o.id))
    const { error } = await supabase.from('orders')
      .update({ done: true, done_at: new Date().toISOString() }).eq('id', o.id)
    if (error) { await loadOrders(); alert('ບັນທຶກບໍ່ສຳເລັດ: ' + error.message); return }
    // Publish the number for the /queue board customers look at. Only the
    // staff page did this, so with the kitchen screen doing the finishing the
    // board never advanced — current_queue had never once been written.
    await supabase.from('shop_config')
      .upsert({ key: 'current_queue', value: String(o.qnum) }, { onConflict: 'key' })
  }

  // A tray out of the steamer clears a run of queue numbers at once. Tapping ✓
  // on each card is fine for one order and hopeless for twenty, which is how
  // the board came to be left un-cleared for a whole service.
  async function markDoneMany(list) {
    if (!list.length) return
    setBulkBusy(true)
    const ids = list.map(o => o.id)
    setOrders(prev => prev.filter(x => !ids.includes(x.id)))
    const doneAt = new Date().toISOString()
    const { error } = await supabase.from('orders')
      .update({ done: true, done_at: doneAt }).in('id', ids)
    if (error) { await loadOrders(); alert('ບັນທຶກບໍ່ສຳເລັດ: ' + error.message) }
    else {
      // Publish the highest number cleared, so the board customers watch
      // jumps straight to where the counter actually is.
      const top = list.reduce((m, o) => Math.max(m, o.qnum || 0), 0)
      if (top) await supabase.from('shop_config')
        .upsert({ key: 'current_queue', value: String(top) }, { onConflict: 'key' })
    }
    setBulkBusy(false); setBulkOpen(false); setBulkSel(new Set())
  }

  async function markCancel(o) {
    setOrders(prev => prev.filter(x => x.id !== o.id))
    const { error } = await supabase.from('orders').update({ cancelled: true }).eq('id', o.id)
    if (error) { await loadOrders(); alert('ບັນທຶກບໍ່ສຳເລັດ: ' + error.message); return }
    // Cancelling here used to stop at the order row, so the buns came off the
    // stock when the order was placed and never went back on. The shelf then
    // held more than the till believed and the menu read ໝົດ with trays still
    // full. Hand them back the same way every other path does: negative deltas
    // through deduct_stock, which takes the row lock, so a sale landing at the
    // same moment is not overwritten.
    try {
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
      const deltas = {}
      items.forEach(it => {
        // menuIdx is what every order carries now; fall back to the name for
        // anything written before it did.
        const idx = Number.isInteger(it.menuIdx)
          ? it.menuIdx
          : menus.findIndex(m => normName(m.lo || m) === normName(it.name || ''))
        if (idx >= 0 && it.qty > 0) deltas[idx] = (deltas[idx] || 0) - it.qty
      })
      if (Object.keys(deltas).length) {
        await supabase.rpc('deduct_stock', {
          p_key: o.type === 'online' ? 'stock_online' : 'stock_shop',
          p_deltas: deltas,
        })
      }
      // The staff page logs who cancelled what; the board did not, so orders
      // cancelled from the kitchen left no trace to reconcile against.
      await supabase.from('audit_log').insert({
        staff_name: 'ຄົວ', action: 'cancel_order',
        detail: `#${String(o.qnum).padStart(4, '0')} — ຍົກເລີກຈາກຈໍຄົວ`,
      })
    } catch (_) { /* the order is already cancelled; stock is best-effort */ }
  }

  function applyFilter(list) {
    if (filter === 'all') return list
    return list.filter(o => o.type === filter)
  }

  const confirmed = applyFilter(orders.filter(o => o.status === 'confirmed'))
  const pending   = applyFilter(orders.filter(o => o.type === 'online' && o.status === 'pending'))

  const TABS = [
    { key: 'all',    label: 'ທັງໝົດ' },
    { key: 'online', label: '🌐 Online' },
    { key: 'walkin', label: '🏪 Walk-in' },
  ]

  const sharedProps = { onDone: markDone, onAskCancel: setCancelAsk, menus, images }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <div style={{ background: 'var(--brown)', flexShrink: 0 }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-serif text-lg font-black" style={{ color: 'var(--cream)' }}>🍳 Kitchen Display</div>
            <div className="text-xs" style={{ color: 'rgba(253,246,238,0.6)' }}>{shopInfo.name}</div>
          </div>
          <div className="flex items-center gap-2">
            {confirmed.length > 0 && (
              <button
                onClick={() => { setBulkSel(new Set()); setBulkOpen(true) }}
                className="px-3 py-2 rounded-xl text-sm font-black flex items-center gap-1.5"
                style={{ background: 'var(--cream)', color: 'var(--brown)', touchAction: 'manipulation' }}>
                ✓ ສຳເລັດຫຼາຍໃບ
                <span className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: 'var(--cream3)' }}>{confirmed.length}</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
              style={{ background: liveStatus === 'live' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)', color: liveStatus === 'live' ? '#16a34a' : '#92400e' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: liveStatus === 'live' ? '#22c55e' : '#f59e0b' }} />
              {liveStatus === 'live' ? 'LIVE' : '...'}
            </div>
          </div>
        </div>
        {/* Filter tabs */}
        <div className="flex px-4 pb-2 gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="px-3 py-1 rounded-full text-xs font-black transition-colors"
              style={{
                background: filter === t.key ? 'var(--cream)' : 'rgba(253,246,238,0.15)',
                color: filter === t.key ? 'var(--brown)' : 'rgba(253,246,238,0.8)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asked before anything happens, because ✕ sits beside ✓ and the board
          is used with wet hands. Names the order so the answer is to the card
          that was actually pressed. */}
      {cancelAsk && (() => {
        const items = (() => { try { return typeof cancelAsk.items === 'string' ? JSON.parse(cancelAsk.items) : cancelAsk.items || [] } catch { return [] } })()
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(61,31,10,0.6)' }} onClick={() => setCancelAsk(null)}>
            <div className="w-full max-w-md rounded-2xl p-5" style={{ background: 'var(--warm-white)' }}
              onClick={e => e.stopPropagation()}>
              <div className="text-lg font-black mb-1" style={{ color: 'var(--brown)' }}>ຍົກເລີກອໍເດີນີ້ແທ້ບໍ?</div>
              <div className="font-serif text-3xl font-black my-2" style={{ color: 'var(--brown)' }}>
                #{String(cancelAsk.qnum).padStart(4, '0')}
              </div>
              <div className="text-sm font-bold leading-6 mb-1" style={{ color: 'var(--gray3)' }}>
                {items.map(it => `${it.name} ×${it.qty}`).join(', ')}
              </div>
              <div className="text-xs font-bold mb-4" style={{ color: 'var(--gray3)' }}>
                ສິນຄ້າຈະຖືກຄືນເຂົ້າສະຕ໋ອກ · ກູ້ຄືນໄດ້ທີ່ໜ້າ Staff
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCancelAsk(null)}
                  className="py-4 rounded-xl font-black text-base"
                  style={{ background: 'var(--cream2)', color: 'var(--brown)', border: '2px solid var(--cream3)', touchAction: 'manipulation' }}>
                  ບໍ່ ກັບຄືນ
                </button>
                <button onClick={() => { const o = cancelAsk; setCancelAsk(null); markCancel(o) }}
                  className="py-4 rounded-xl font-black text-base text-white"
                  style={{ background: '#b91c1c', touchAction: 'manipulation' }}>
                  ✕ ຍົກເລີກ
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Clear a tray's worth at once. Only orders already being made are
          listed, so nothing here can be a preorder that has not been steamed. */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--cream)' }}>
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'var(--brown)' }}>
            <button onClick={() => setBulkOpen(false)} className="text-2xl font-black w-9" style={{ color: 'var(--cream)' }}>✕</button>
            <div className="flex-1 font-serif text-lg font-black" style={{ color: 'var(--cream)' }}>✓ ສຳເລັດຫຼາຍໃບ</div>
            <button
              onClick={() => setBulkSel(prev => prev.size === confirmed.length ? new Set() : new Set(confirmed.map(o => o.id)))}
              className="px-3 py-2 rounded-xl text-sm font-black"
              style={{ background: 'rgba(253,246,238,0.15)', color: 'var(--cream)' }}>
              {bulkSel.size === confirmed.length ? 'ເອົາອອກທັງໝົດ' : 'ເລືອກທັງໝົດ'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {confirmed.map(o => {
              const on = bulkSel.has(o.id)
              const items = (() => { try { return typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [] } catch { return [] } })()
              return (
                <button key={o.id}
                  onClick={() => setBulkSel(prev => { const n = new Set(prev); n.has(o.id) ? n.delete(o.id) : n.add(o.id); return n })}
                  className="flex items-center gap-3 p-3 rounded-2xl text-left"
                  style={{ background: 'var(--warm-white)', border: `2px solid ${on ? 'var(--brown)' : 'var(--cream3)'}`, touchAction: 'manipulation' }}>
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg grid place-items-center text-lg font-black"
                    style={{ background: on ? 'var(--brown)' : 'var(--cream2)', color: on ? 'var(--cream)' : 'var(--cream3)', border: '2px solid var(--cream3)' }}>
                    {on ? '✓' : ''}
                  </span>
                  <span className="font-serif text-2xl font-black flex-shrink-0" style={{ color: 'var(--brown)' }}>
                    {String(o.qnum).padStart(4, '0')}
                  </span>
                  <span className="text-xs font-bold flex-1 min-w-0 leading-5" style={{ color: 'var(--gray3)' }}>
                    {items.map(it => `${it.name} ×${it.qty}`).join(', ')}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex-shrink-0 p-3 flex items-center gap-3" style={{ background: 'var(--warm-white)', borderTop: '2px solid var(--cream3)' }}>
            <span className="text-sm font-black" style={{ color: 'var(--gray3)' }}>ເລືອກ {bulkSel.size} ໃບ</span>
            <button
              disabled={bulkBusy || bulkSel.size === 0}
              onClick={() => markDoneMany(confirmed.filter(o => bulkSel.has(o.id)))}
              className="flex-1 py-4 rounded-xl font-black text-base disabled:opacity-40"
              style={{ background: '#15803d', color: '#fff', touchAction: 'manipulation' }}>
              {bulkBusy ? '...' : `✓ ສຳເລັດ ${bulkSel.size} ໃບ`}
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile: vertical scroll (original layout) ── */}
      <div className="md:hidden flex-1 overflow-y-auto p-3">
        {confirmed.length === 0 && pending.length === 0 && (
          <div className="flex items-center justify-center h-64 text-xl font-black" style={{ color: 'var(--cream3)' }}>
            ຍັງບໍ່ມີອໍເດີ
          </div>
        )}
        {pending.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#92400e' }}>⏳ ລໍຖ້າຢືນຢັນ</div>
            <div className="flex flex-col gap-3">
              {pending.map(o => <OrderCard key={o.id} o={o} {...sharedProps} />)}
            </div>
          </div>
        )}
        {confirmed.length > 0 && (
          <div>
            <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: '#16a34a' }}>🔥 ກຳລັງເຮັດ</div>
            <div className="flex flex-col gap-3">
              {confirmed.map(o => <OrderCard key={o.id} o={o} {...sharedProps} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Tablet/Desktop: horizontal swipe ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {confirmed.length === 0 && pending.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xl font-black" style={{ color: 'var(--cream3)' }}>
            ຍັງບໍ່ມີອໍເດີ
          </div>
        ) : (
          <div className="h-full flex gap-3 px-3 py-3"
            style={{ overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>

            {/* ── Pending section ── */}
            {pending.map((o, i) => (
              <div key={o.id} className="flex-shrink-0 flex flex-col"
                style={{ width: CARD_W, scrollSnapAlign: 'start', overflowY: 'auto', height: '100%' }}>
                {i === 0 && (
                  <div className="text-xs font-black tracking-widest uppercase mb-2 flex-shrink-0" style={{ color: '#92400e' }}>
                    ⏳ ລໍຖ້າຢືນຢັນ
                  </div>
                )}
                <OrderCard o={o} {...sharedProps} />
              </div>
            ))}

            {/* ── Divider between sections ── */}
            {pending.length > 0 && confirmed.length > 0 && (
              <div className="flex-shrink-0 self-stretch flex items-center justify-center" style={{ width: 28 }}>
                <div className="h-full w-px" style={{ background: 'var(--cream3)' }} />
              </div>
            )}

            {/* ── Confirmed section ── */}
            {confirmed.map((o, i) => (
              <div key={o.id} className="flex-shrink-0 flex flex-col"
                style={{ width: CARD_W, scrollSnapAlign: 'start', overflowY: 'auto', height: '100%' }}>
                {i === 0 && (
                  <div className="text-xs font-black tracking-widest uppercase mb-2 flex-shrink-0" style={{ color: '#16a34a' }}>
                    🔥 ກຳລັງເຮັດ
                  </div>
                )}
                <OrderCard o={o} {...sharedProps} />
              </div>
            ))}

            {/* trailing spacer */}
            <div className="flex-shrink-0" style={{ width: 12 }} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── helpers ─────────────────────────── */

// Menu names are typed by hand and pick up stray spaces; nothing that
// compares them should care about those.
function normName(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim()
}

function parseBagLabel(bagLabel) {
  if (!bagLabel) return []
  return bagLabel.split(' | ').map(part => {
    const colonIdx = part.indexOf(': ')
    const header   = colonIdx >= 0 ? part.slice(0, colonIdx) : part
    const contents = colonIdx >= 0 ? part.slice(colonIdx + 2) : ''
    const itemList = contents.split(', ').map(s => {
      const m = s.match(/^(.+)\s×(\d+)$/)
      return m ? { name: m[1].trim(), qty: parseInt(m[2]) } : { name: s, qty: 1 }
    }).filter(it => it.name)
    return { header, items: itemList }
  }).filter(b => b.items.length > 0)
    // Renumber. Orders saved before the numbering bug was fixed carry headers
    // like "ຖົງ 1 | ຖົງ 3", and on the packing screen that reads as a missing
    // bag — someone goes looking for a bag 2 that was never packed.
    .map((b, i) => ({ ...b, header: b.header.replace(/\d+/, String(i + 1)) }))
}

function OrderCard({ o, onDone, onAskCancel, menus, images }) {
  const [slipOpen, setSlipOpen] = useState(false)
  // A second tap landing before React has removed the card would fire the
  // action twice. Latch on the first one.
  const [busy, setBusy] = useState(false)
  const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
  const cust  = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
  const time  = new Date(o.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
  const mins  = Math.floor((Date.now() - new Date(o.created_at)) / 60000)
  const isUrgent = mins >= 10
  const bags  = parseBagLabel(o.bag_label)

  function getItemImage(name) {
    // Match on normalised whitespace. Several menu names carry a trailing
    // space ("ໝັນໂຖ Matcha "), and the bag label is parsed with .trim(), so an
    // exact comparison never matched and those items fell back to a generic
    // icon on the packing screen while the same items showed their photo in
    // the order list above.
    const idx = menus.findIndex(m => normName(m.lo || m) === normName(name))
    if (idx >= 0 && images[idx]) return { img: images[idx], emoji: EMOJIS[idx] || '🍱' }
    return { img: null, emoji: '🍱' }
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden flex flex-col flex-shrink-0"
        style={{ background: 'var(--warm-white)', border: `2px solid ${isUrgent ? '#ef4444' : 'var(--brown)'}` }}>

        {/* Queue number header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: 'var(--brown)' }}>
          <div className="font-serif text-4xl font-black" style={{ color: 'var(--cream)' }}>
            #{String(o.qnum).padStart(4, '0')}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.7)' }}>{time}</div>
            <div className="text-xs font-black mt-0.5" style={{ color: isUrgent ? '#ef4444' : 'rgba(253,246,238,0.6)' }}>
              {mins} ນາທີ{isUrgent ? ' ⚠' : ''}
            </div>
            <div className="text-xs mt-0.5 font-bold" style={{ color: 'rgba(253,246,238,0.8)' }}>
              {o.type === 'online' ? '🌐 Online' : '🏪 Walk-in'}
            </div>
          </div>
        </div>

        <div className="flex-1 p-3 flex flex-col gap-3">

          {/* Items summary */}
          <div className="flex flex-col gap-1">
            {items.map((it, i) => {
              const { img, emoji } = getItemImage(it.name)
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'var(--cream2)' }}>
                    {img ? <img src={img} className="w-full h-full object-cover" alt={it.name} />
                         : <span className="text-lg">{emoji}</span>}
                  </div>
                  <span className="font-black text-base flex-1" style={{ color: 'var(--brown)' }}>{it.name}</span>
                  <span className="font-black text-2xl" style={{ color: 'var(--brown2)' }}>×{it.qty}</span>
                </div>
              )
            })}
          </div>

          {/* Total price */}
          {o.total > 0 && (
            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--cream3)' }}>
              <span className="text-sm font-black" style={{ color: 'var(--brown3)' }}>ລວມ</span>
              <span className="text-lg font-black" style={{ color: 'var(--brown)' }}>{o.total.toLocaleString()} ກີບ</span>
            </div>
          )}

          {/* Payment slip */}
          {o.slip_url && (
            <button onClick={() => setSlipOpen(true)}
              className="flex items-center gap-2 rounded-xl overflow-hidden w-full text-left"
              style={{ border: '2px solid var(--cream3)', background: 'var(--cream2)' }}>
              <img src={o.slip_url} className="w-16 h-16 object-cover flex-shrink-0" alt="slip" />
              <div className="px-2 flex-1">
                <div className="text-xs font-black" style={{ color: 'var(--brown)' }}>🧾 ສລິບໂອນເງິນ</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>ກົດເພື່ອຂະຫຍາຍ</div>
              </div>
            </button>
          )}

          {/* Bag breakdown */}
          {bags.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--cream3)' }}>
              <div className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--brown3)' }}>🛍 ແຍກຖົງ</div>
              {bags.map((bag, bi) => {
                // The "not bagged yet" group is items that were ordered but
                // never assigned to a bag. It has to look different from a
                // real bag, or it gets packed as one and the count is wrong.
                const unbagged = !/\d/.test(bag.header)
                return (
                <div key={bi} className="rounded-xl overflow-hidden" style={{ border: `2px solid ${unbagged ? '#f59e0b' : 'var(--cream3)'}` }}>
                  <div className="px-3 py-2 font-black text-sm" style={{ background: unbagged ? '#b45309' : 'var(--brown)', color: 'var(--cream)' }}>
                    {unbagged ? '' : '🛍 '}{bag.header}
                  </div>
                  <div className="p-2 flex flex-col gap-2">
                    {bag.items.map((it, ii) => {
                      const { img, emoji } = getItemImage(it.name)
                      return (
                        <div key={ii} className="flex items-center gap-3">
                          <div className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                            style={{ width: 64, height: 64, background: 'var(--cream2)' }}>
                            {img ? <img src={img} className="w-full h-full object-cover" alt={it.name} />
                                 : <span style={{ fontSize: 32 }}>{emoji}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black leading-tight" style={{ fontSize: 18, color: 'var(--brown)' }}>{it.name}</div>
                          </div>
                          <div className="font-black flex-shrink-0" style={{ fontSize: 40, color: 'var(--brown)', lineHeight: 1 }}>
                            {it.qty}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Customer info */}
          {cust && (
            <div className="pt-2 border-t text-xs font-bold leading-5" style={{ borderColor: 'var(--cream3)', color: 'var(--gray3)' }}>
              👤 {cust.name}{cust.phone ? ` · 📞 ${cust.phone}` : ''}{cust.time ? ` · ⏰ ${cust.time}` : (cust.date ? ` · 📅 ${cust.date}` : '')}
            </div>
          )}
        </div>

        {/* Buttons. ✓ fires on the first touch because it is pressed all day.
            ✕ destroys a real order and sits right beside it, so it asks first —
            one slip with floury hands used to be enough to lose an order. */}
        <div className="grid grid-cols-2 gap-2 p-3 border-t flex-shrink-0" style={{ borderColor: 'var(--cream3)' }}>
          <button
            onClick={() => { if (busy) return; onAskCancel(o) }}
            disabled={busy}
            className="py-4 rounded-xl text-sm font-black bg-red-50 text-red-600 disabled:opacity-40"
            style={{ border: '1.5px solid #fca5a5', touchAction: 'manipulation' }}>
            ✕ ຍົກເລີກ
          </button>
          <button
            onClick={() => { if (busy) return; setBusy(true); onDone(o) }}
            disabled={busy}
            className="py-4 rounded-xl text-sm font-black bg-green-50 text-green-700 disabled:opacity-40"
            style={{ border: '1.5px solid #86efac', touchAction: 'manipulation' }}>
            {busy ? '...' : '✓ ສຳເລັດ'}
          </button>
        </div>
      </div>

      {/* Slip full-screen viewer */}
      {slipOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => setSlipOpen(false)}>
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
            <button className="text-white text-xl font-black">← ປິດ</button>
            <span className="text-white text-sm font-black">🧾 ສລິບ #{String(o.qnum).padStart(4,'0')}</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={o.slip_url} className="max-w-full max-h-full object-contain rounded-xl" alt="payment slip" />
          </div>
        </div>
      )}
    </>
  )
}
