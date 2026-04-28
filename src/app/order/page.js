'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import ContactSection from '../../components/ContactSection'
import ClosedOverlay from '../../components/ClosedOverlay'

const EMOJIS = ['🥟','🍫','🍵','🧁','🍞','🥐','🍮']

const QUICK_BAGS = [
  { id: 'single',  icon: '🛍',     label: 'ຖຸງດຽວ',       desc: 'ທຸກຢ່າງໃນ 1 ຖຸງ' },
  { id: 'bytype',  icon: '🛍🛍',   label: 'ແຍກຕາມເມນູ',   desc: 'ແຕ່ລະເມນູ 1 ຖຸງ' },
  { id: 'each',    icon: '🛍🛍🛍', label: 'ແຍກທຸກກ້ອນ',   desc: '1 ກ້ອນ 1 ຖຸງ' },
]

export default function OrderPage() {
  const [step, setStep] = useState(1)
  const [menus, setMenus] = useState([])
  const [prices, setPrices] = useState([])
  const [stock, setStock] = useState([])
  // alias for clarity
  const stockShop = stock
  const [shopOpen, setShopOpen] = useState(true) // walkinOn flag
  const [images, setImages] = useState({})
  const [qrImage, setQrImage] = useState(null)
  const [selected, setSelected] = useState({})
  const [bagPacks, setBagPacks] = useState([{}])
  const [packToast, setPackToast] = useState(null)
  const [expandedBags, setExpandedBags] = useState(new Set())
  const [qnum, setQnum] = useState(null)
  const [isOnline, setIsOnline] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [branches, setBranches] = useState([])

  // Load shop data
  useEffect(() => {
    loadShopData()
    // Real-time stock + menu listener
    const channel = supabase
      .channel('shop-walkin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config' }, () => loadShopData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function loadShopData() {
    try {
      const { data, error } = await supabase.from('shop_config').select('*')
      if (error) throw error
      const cfg = {}
      data.forEach(row => { cfg[row.key] = row.value })

      setMenus(cfg.menus ? JSON.parse(cfg.menus) : [
        { lo: 'ຊາລາເປົາໝູສັບ', en: 'Pork Steamed Bun' },
        { lo: 'ໝັນໂຖ Dark Chocolate', en: 'Dark Choc Mantou' },
        { lo: 'ໝັນໂຖ Matcha', en: 'Matcha Mantou' },
        { lo: 'ເມນູ 4', en: 'Menu 4' },
        { lo: 'ເມນູ 5', en: 'Menu 5' },
        { lo: 'ເມນູ 6', en: 'Menu 6' },
        { lo: 'ເມນູ 7', en: 'Menu 7' },
      ])
      setPrices(cfg.prices ? JSON.parse(cfg.prices) : [15000,15000,15000,15000,15000,15000,15000])
      setStock(cfg.stock_shop ? JSON.parse(cfg.stock_shop) : [0,0,0,0,0,0,0])
      setImages(cfg.menu_images ? JSON.parse(cfg.menu_images) : {})
      setQrImage(cfg.qr_image || null)
      setShopInfo(cfg.shop_info ? JSON.parse(cfg.shop_info) : { name: 'Basic Chinese Bun' })
      if (cfg.branches) setBranches(JSON.parse(cfg.branches))
      // Read walkinOn from settings
      if (cfg.settings) {
        const s = JSON.parse(cfg.settings)
        setShopOpen(s.walkinOn !== false) // default true
      }
    } catch (e) {
      console.error('loadShopData error:', e)
    }
  }

  const totalItems = Object.values(selected).reduce((s, q) => s + q, 0)
  const totalPrice = Object.entries(selected).reduce((s, [i, q]) => s + (prices[+i] || 0) * q, 0)

  function selectMenu(i) {
    if ((stock[i] || 0) === 0) return
    if (!selected[i]) {
      setSelected(prev => ({ ...prev, [i]: 1 }))
    }
  }

  function changeQty(e, i, d) {
    e.stopPropagation()
    const cur = selected[i] || 0
    const max = stock[i] || 0
    const next = Math.max(0, Math.min(max, cur + d))
    setSelected(prev => {
      const n = { ...prev }
      if (next === 0) delete n[i]
      else n[i] = next
      return n
    })
    if (document.activeElement) document.activeElement.blur()
  }

  function showPackToast(msg) {
    setPackToast(msg)
    setTimeout(() => setPackToast(null), 2000)
  }

  function addItemToBag(n, idx) {
    const itemOrdered = selected[idx] || 0
    const itemPackedTotal = bagPacks.reduce((s, b) => s + (b[idx] || 0), 0)
    if (itemPackedTotal >= itemOrdered) {
      showPackToast('ຄົບແລ້ວ · Order limit reached')
      return
    }
    setBagPacks(prev => {
      const a = prev.map(b => ({ ...b }))
      a[n] = { ...a[n], [idx]: (a[n][idx] || 0) + 1 }
      return a
    })
  }

  async function submitOrder() {
    if (bagPacks.every(b => !Object.keys(b).length)) return
    setSubmitting(true)
    try {
      // Get next queue number using RPC
      const { data: qnumData, error: qErr } = await supabase.rpc('next_queue_number')
      if (qErr) throw qErr
      const nextQ = qnumData

      const items = Object.entries(selected).map(([i, qty]) => ({
        menuIdx: +i,
        name: menus[+i]?.lo || '',
        qty,
        price: prices[+i] || 0,
        sub: (prices[+i] || 0) * qty,
      }))
      const packingLabel = bagPacks
        .map((b, i) => { const t = bagText(b); return t ? `ຖຸງ ${i + 1}: ${t}` : null })
        .filter(Boolean)
        .join(' | ')

      const { error } = await supabase.from('orders').insert({
        qnum: nextQ,
        type: 'walkin',
        status: 'pending',
        items: JSON.stringify(items),
        total: totalPrice,
        bag_type: null,
        bag_label: packingLabel,
        done: false,
        cancelled: false,
      })
      if (error) throw error

      // Decrement stock
      const newStock = [...stock]
      Object.entries(selected).forEach(([i, qty]) => {
        newStock[+i] = Math.max(0, (newStock[+i] || 0) - qty)
      })
      await supabase.from('shop_config').upsert({ key: 'stock_shop', value: JSON.stringify(newStock) })

      setQnum(nextQ)
      setStep(4)
    } catch (e) {
      console.error('submitOrder error:', e)
      alert('❌ ເກີດບັນຫາ: ' + (e.message || 'unknown'))
    } finally {
      setSubmitting(false)
    }
  }

  function resetOrder() {
    setSelected({})
    setBagPacks([{}])
    setQnum(null)
    setStep(1)
  }

  function handleQuickBag(id) {
    if (id === 'single') {
      const bag = {}
      Object.entries(selected).forEach(([idx, qty]) => { bag[idx] = qty })
      setBagPacks([bag])
    } else if (id === 'bytype') {
      const packs = Object.entries(selected).map(([idx, qty]) => ({ [idx]: qty }))
      setBagPacks(packs.length ? packs : [{}])
    } else {
      const packs = []
      Object.entries(selected).forEach(([idx, qty]) => {
        for (let i = 0; i < qty; i++) packs.push({ [idx]: 1 })
      })
      setBagPacks(packs.length ? packs : [{}])
    }
    setStep(3)
  }

  function bagText(bag) {
    return Object.entries(bag)
      .filter(([, qty]) => qty > 0)
      .map(([idx, qty]) => `${menus[+idx]?.lo || ''} ×${qty}`)
      .join(', ')
  }

  const totalOrdered = Object.values(selected).reduce((s, v) => s + v, 0)
  const totalPacked = bagPacks.reduce((s, bag) => s + Object.values(bag).reduce((ss, v) => ss + v, 0), 0)

  const bagLabel = bagPacks
    .map((b, i) => { const t = bagText(b); return t ? `ຖຸງ ${i + 1}: ${t}` : null })
    .filter(Boolean)
    .join(' / ')
  const selectedItems = Object.entries(selected).map(([i, qty]) => ({
    name: menus[+i]?.lo || '',
    qty,
    sub: (prices[+i] || 0) * qty,
  }))

  return (
    <div
      className={`flex flex-col${step !== 3 ? ' overflow-hidden' : ''}`}
      style={{ background: 'var(--cream)', ...(step === 3 ? { minHeight: '100dvh' } : { height: '100dvh' }) }}
    >
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-red-700 text-white text-center py-2 text-sm font-black">
          ⚠ ບໍ່ມີອິນເຕີເນັດ · Offline
        </div>
      )}
      {/* Closed overlay — covers entire screen when walk-in is OFF */}
      {!shopOpen && (
        <ClosedOverlay
          shopInfo={shopInfo}
          branches={branches}
          subtitle="ບໍ່ຮັບ Walk-in ໃນຕອນນີ້"
        />
      )}

      {/* ─── STEP 1: Menu ─── */}
      {step === 1 && (
        <>
          <div className="sticky top-0 z-10 relative text-center py-4" style={{ background: 'var(--brown)' }}>
            <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>
              {shopInfo.name}
            </div>
            <div className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.55)' }}>
              ເລືອກເມນູ · Walk-in
            </div>
            <a href="/contact"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all"
              style={{ background: 'rgba(253,246,238,0.15)', color: 'var(--cream)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </a>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center text-xs font-black tracking-widest uppercase mb-4" style={{ color: 'var(--gray3)' }}>
              ແຕະເພື່ອເລືອກ · Tap to select
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {menus.map((m, i) => {
                const qty = selected[i] || 0
                const s = stock[i] || 0
                const isOut = s === 0
                const isSel = qty > 0
                const img = images[i]
                const isLastLoneMobile = menus.length % 2 === 1 && i === menus.length - 1
                const isLastLoneMd = menus.length % 3 === 1 && i === menus.length - 1
                let loneClass = ''
                if (isLastLoneMobile) loneClass += ' col-span-2 w-1/2 mx-auto'
                if (isLastLoneMobile || isLastLoneMd) loneClass += ' md:col-span-1 md:w-full md:mx-0'
                if (isLastLoneMd) loneClass += ' md:col-start-2'
                if (isLastLoneMobile || isLastLoneMd) loneClass += ' lg:col-start-auto'
                return (
                  <div
                    key={i}
                    onClick={() => selectMenu(i)}
                    className={`rounded-2xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                      isOut ? 'opacity-50 cursor-not-allowed border-[#e8d5c0]' :
                      isSel ? 'border-[#3d1f0a] shadow-[0_0_0_2px_#3d1f0a]' : 'border-[#e8d5c0]'
                    }${loneClass}`}
                    style={{ background: 'var(--warm-white)' }}
                  >
                    {/* Image */}
                    <div className="aspect-square relative overflow-hidden" style={{ background: 'var(--cream2)' }}>
                      {img ? (
                        <img src={img} alt={m.lo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                          {EMOJIS[i] || '🍱'}
                        </div>
                      )}
                      {isOut && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(61,31,10,0.55)' }}>
                          <span className="text-white font-black text-sm px-2 py-1 rounded-lg" style={{ background: 'rgba(185,28,28,0.9)' }}>
                            ໝົດ
                          </span>
                        </div>
                      )}
                      {isSel && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                          {qty}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <div className="text-sm font-black leading-tight" style={{ color: 'var(--brown)' }}>{m.lo}</div>
                      <div className="text-sm font-black mt-1" style={{ color: 'var(--brown2)' }}>
                        {isOut ? 'ໝົດ' : `${(prices[i] || 0).toLocaleString()} ກີບ`}
                      </div>
                    </div>

                    {/* Qty row */}
                    {isSel && (
                      <div className="flex items-center justify-between px-2 py-2 border-t border-[#e8d5c0]" style={{ background: 'var(--cream2)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={e => changeQty(e, i, -1)} className="w-8 h-8 rounded-full border-2 border-[#3d1f0a] flex items-center justify-center text-lg font-black" style={{ background: 'var(--warm-white)', color: 'var(--brown)' }}>−</button>
                        <span className="font-black text-base" style={{ color: 'var(--brown)' }}>{qty}</span>
                        <button onClick={e => changeQty(e, i, 1)} className="w-8 h-8 rounded-full border-2 border-[#3d1f0a] flex items-center justify-center text-lg font-black" style={{ background: 'var(--warm-white)', color: 'var(--brown)' }}>+</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-4 border-t-2 border-[#e8d5c0]" style={{ background: 'var(--warm-white)' }}>
            <button
              className="btn-primary"
              disabled={totalItems === 0}
              onClick={() => setStep(2)}
            >
              ຕໍ່ໄປ · Next →
            </button>
          </div>
        </>
      )}

      {/* ─── STEP 2: Bag ─── */}
      {step === 2 && (
        <>
          {/* Pack toast */}
          {packToast && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-base font-black text-white shadow-xl pointer-events-none"
              style={{ background: 'var(--brown)' }}>
              {packToast}
            </div>
          )}

          {/* Header */}
          <div className="text-center px-4 py-4" style={{ background: 'var(--brown)', flexShrink: 0 }}>
            <div className="font-serif text-2xl font-black" style={{ color: 'var(--cream)' }}>ເລືອກຖົງເຈ້ຍ</div>
            <div className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.55)' }}>Paper Bag Selection</div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4" style={{ minHeight: 0 }}>

            {/* ── Quick Select ── */}
            <div className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: 'var(--gray3)' }}>
              ⚡ ເລືອກດ່ວນ · Quick Select
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {QUICK_BAGS.map(opt => (
                <button key={opt.id} onClick={() => handleQuickBag(opt.id)}
                  className="rounded-2xl p-4 text-center active:scale-95 transition-all"
                  style={{ background: 'var(--warm-white)', border: '2px solid #e8d5c0', boxShadow: '0 2px 8px rgba(61,31,10,0.08)' }}>
                  <div className="text-3xl mb-2">{opt.icon}</div>
                  <div className="font-black text-sm leading-tight" style={{ color: 'var(--brown)' }}>{opt.label}</div>
                  <div className="text-xs font-bold mt-1" style={{ color: 'var(--gray3)' }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-t-2 border-[#e8d5c0]" />
              <span className="text-xs font-black tracking-widest px-2" style={{ color: 'var(--gray3)' }}>ຫຼື ຈັດເອງ · OR PACK CUSTOM</span>
              <div className="flex-1 border-t-2 border-[#e8d5c0]" />
            </div>

            {/* ── Progress tracker ── */}
            <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-4"
              style={{ background: 'var(--cream2)', border: '2px solid #e8d5c0' }}>
              <div className="flex-1">
                <div className="flex justify-between text-xs font-black mb-2" style={{ color: 'var(--brown)' }}>
                  <span>ຈັດແລ້ວ · Packed</span>
                  <span>{totalPacked} / {totalOrdered}</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: '#e8d5c0' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: totalOrdered > 0 ? `${Math.min(100, (totalPacked / totalOrdered) * 100)}%` : '0%',
                      background: totalPacked >= totalOrdered && totalOrdered > 0 ? '#16a34a' : 'var(--brown)',
                    }} />
                </div>
              </div>
              <div className="flex-shrink-0 text-center w-14">
                <div className="font-black text-3xl leading-none"
                  style={{ color: totalPacked >= totalOrdered && totalOrdered > 0 ? '#16a34a' : 'var(--brown)' }}>
                  {totalOrdered - totalPacked}
                </div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>ເຫຼືອ</div>
              </div>
            </div>

            {/* ── Custom Bag Cards ── */}
            <div className="flex flex-col gap-4">
              {bagPacks.map((bag, n) => {
                const filled = Object.values(bag).some(v => v > 0)
                return (
                  <div key={n} className="rounded-2xl overflow-hidden"
                    style={{
                      border: `2px solid ${filled ? 'var(--brown)' : '#e8d5c0'}`,
                      background: 'var(--warm-white)',
                      boxShadow: '0 2px 12px rgba(61,31,10,0.07)',
                    }}>

                    {/* Bag header */}
                    <div className="flex items-start gap-3 px-5 py-3"
                      style={{ background: filled ? 'var(--cream2)' : 'var(--warm-white)' }}>
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mt-0.5"
                        style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                        {n + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-base" style={{ color: 'var(--brown)' }}>ຖຸງທີ {n + 1}</div>
                        {filled ? (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Object.entries(bag).filter(([, qty]) => qty > 0).map(([idx, qty]) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
                                style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                                {menus[+idx]?.lo} ×{qty}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm font-bold mt-0.5" style={{ color: '#c9b9a8' }}>
                            ຍັງຫວ່າງ — ແຕະລາຍການຂ້າງລຸ່ມ
                          </div>
                        )}
                      </div>
                      {filled && (
                        <button
                          onClick={() => setBagPacks(prev => { const a = prev.map(b => ({ ...b })); a[n] = {}; return a })}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5"
                          style={{ border: '2px solid #fca5a5', color: '#ef4444', background: '#fff5f5' }}>
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Item buttons with images + per-item limit */}
                    <div className="flex flex-wrap gap-3 px-5 py-4 border-t border-[#e8d5c0]">
                      {Object.entries(selected).map(([idx]) => {
                        const img = images[+idx]
                        const name = menus[+idx]?.lo || ''
                        const itemOrdered = selected[+idx] || 0
                        const itemPackedTotal = bagPacks.reduce((s, b) => s + (b[idx] || 0), 0)
                        const itemRemaining = itemOrdered - itemPackedTotal
                        const qtyInThisBag = bag[idx] || 0
                        const isDisabled = itemRemaining <= 0
                        return (
                          <button key={idx}
                            disabled={isDisabled}
                            onClick={() => addItemToBag(n, idx)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-transform ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                            style={{
                              background: 'var(--cream)',
                              border: `2px solid ${qtyInThisBag > 0 ? 'var(--brown)' : '#e8d5c0'}`,
                              boxShadow: '0 1px 4px rgba(61,31,10,0.08)',
                              color: 'var(--brown)',
                            }}>
                            {img
                              ? <img src={img} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt={name} />
                              : <span className="text-2xl flex-shrink-0 leading-none">{EMOJIS[+idx] || '🍱'}</span>
                            }
                            <span className="font-black text-sm">{name}</span>
                            {qtyInThisBag > 0 && (
                              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                                style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                                {qtyInThisBag}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Add Bag button ── */}
            <div className="flex justify-end mt-4 mb-2">
              <button
                onClick={() => setBagPacks(prev => [...prev, {}])}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-base active:scale-95 transition-all"
                style={{ background: 'var(--brown)', color: 'var(--cream)', boxShadow: '0 4px 12px rgba(61,31,10,0.25)' }}>
                ➕ ເພີ່ມຖຸງ
              </button>
            </div>
          </div>

          {/* Always-visible bottom bar */}
          <div className="px-4 pt-3 pb-5 border-t-2 border-[#e8d5c0] flex flex-col gap-2"
            style={{ background: 'var(--warm-white)', flexShrink: 0 }}>
            {bagPacks.every(b => !Object.keys(b).length) && (
              <div className="text-center text-sm font-bold mb-1" style={{ color: 'var(--gray3)' }}>
                ເລືອກດ່ວນ ຫຼື ໃສ່ຢ່າງໜ້ອຍ 1 ຖຸງ
              </div>
            )}
            <button
              className="btn-primary py-4 text-lg font-black"
              disabled={bagPacks.every(b => !Object.keys(b).length)}
              onClick={() => setStep(3)}>
              ✓ ຢືນຢັນ · Confirm
            </button>
            <button className="btn-outline py-3 text-base" onClick={() => setStep(1)}>← ກັບຄືນ · Back</button>
          </div>
        </>
      )}

      {/* ─── STEP 3: Summary + QR ─── */}
      {step === 3 && (
        <>
          {/* Sub-header — scrolls with page */}
          <div className="text-center py-4" style={{ background: 'var(--brown)' }}>
            <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>ສະຫຼຸບ · ຊຳລະເງິນ</div>
          </div>

          {/* Natural-flow content — browser window scrollbar */}
          <div className="p-4 flex flex-col gap-4">

            {/* 1. Items — inner scroll, shows 3 rows before scrolling */}
            <div className="rounded-2xl overflow-hidden border-2 border-[#e8d5c0]" style={{ background: 'var(--warm-white)' }}>
              <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#e8d5c0]">
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--gray3)' }}>ລາຍການ · Items</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--cream2)', color: 'var(--brown)' }}>
                  {totalItems} ກ້ອນ
                </span>
              </div>
              {/* maxHeight = 3 rows × 61px (py-3 + h-9 + border) */}
              <div className="overflow-y-auto" style={{ maxHeight: 183 }}>
                {Object.entries(selected).map(([i, qty]) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#f5ebe0] last:border-0">
                    {images[+i]
                      ? <img src={images[+i]} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" alt="" />
                      : <span className="text-2xl flex-shrink-0 leading-none w-9 text-center">{EMOJIS[+i] || '🍱'}</span>}
                    <span className="flex-1 text-sm font-bold" style={{ color: 'var(--brown)' }}>{menus[+i]?.lo}</span>
                    <span className="text-sm font-black flex-shrink-0" style={{ color: 'var(--brown)' }}>×{qty}</span>
                    <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color: 'var(--gray3)' }}>{((prices[+i] || 0) * qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Total price — large, above QR */}
            <div className="rounded-2xl overflow-hidden border-2 border-[#3d1f0a]">
              <div className="px-5 py-5 flex items-center justify-between" style={{ background: 'var(--brown)' }}>
                <div>
                  <div className="text-xs font-black tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.6)' }}>ລວມທັງໝົດ</div>
                  <div className="text-xs font-black tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.6)' }}>TOTAL AMOUNT</div>
                </div>
                <div className="text-right">
                  <div className="font-serif font-black leading-none" style={{ fontSize: 38, color: 'var(--cream)' }}>
                    {totalPrice.toLocaleString()}
                  </div>
                  <div className="text-sm font-black mt-1" style={{ color: 'rgba(253,246,238,0.65)' }}>ກີບ (LAK)</div>
                </div>
              </div>

              {/* 3. QR code — directly below total, never cut off */}
              <div className="px-4 pt-5 pb-5 text-center" style={{ background: 'var(--warm-white)' }}>
                <div className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: 'var(--gray3)' }}>ສະແກນ QR ຊຳລະ · Scan to Pay</div>
                <div className="w-56 h-56 mx-auto rounded-2xl border-2 border-[#3d1f0a] overflow-hidden flex items-center justify-center" style={{ background: 'var(--cream)' }}>
                  {qrImage
                    ? <img src={qrImage} alt="QR" className="w-full h-full object-contain" />
                    : <div className="text-sm font-bold text-center p-4" style={{ color: 'var(--gray3)' }}>QR ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ</div>}
                </div>
              </div>
            </div>

          </div>

          {/* Submit bar — sticky at bottom of viewport while page scrolls */}
          <div className="sticky bottom-0 p-4 border-t-2 border-[#e8d5c0] flex flex-col gap-2" style={{ background: 'var(--warm-white)' }}>
            <button className="btn-primary" onClick={submitOrder} disabled={submitting}>
              {submitting ? 'ກຳລັງສົ່ງ...' : 'ຮັບບັດຄິວ · Get Ticket'}
            </button>
            <button className="btn-outline" onClick={() => setStep(2)}>← ກັບຄືນ</button>
          </div>
        </>
      )}

      {/* ─── STEP 4: Ticket ─── */}
      {step === 4 && qnum && (
        <>
          <div className="sticky top-0 z-10 text-center py-4" style={{ background: 'var(--brown)' }}>
            <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>ບັດຄິວ · Queue Ticket</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-[#3d1f0a] shadow-xl animate-bounce-in">
              <div className="text-center py-5" style={{ background: 'var(--brown)' }}>
                <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>{shopInfo.name}</div>
                <div className="text-xs tracking-widest uppercase mt-1" style={{ color: 'rgba(253,246,238,0.5)' }}>Queue Ticket</div>
              </div>
              <div className="text-center py-6 px-4" style={{ background: 'var(--warm-white)' }}>
                <div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: 'var(--gray3)' }}>ເລກຄິວ · QUEUE</div>
                <div className="font-serif font-black leading-none mb-4" style={{ fontSize: 80, color: 'var(--brown)' }}>
                  {String(qnum).padStart(3, '0')}
                </div>
                <div className="rounded-xl p-3 text-sm font-bold text-left leading-loose" style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
                  {selectedItems.map((it, i) => (
                    <div key={i}>{it.name} × {it.qty}</div>
                  ))}
                  {bagLabel && <div className="text-xs mt-1" style={{ color: 'var(--gray3)' }}>{bagLabel}</div>}
                </div>
                <div className="flex justify-between text-xs font-bold mt-3 px-1" style={{ color: 'var(--gray3)' }}>
                  <span>ລວມ: {totalPrice.toLocaleString()} ກີບ</span>
                  <span>{new Date().toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="text-center py-3 text-xs font-bold" style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
                ກະລຸນາລໍຖ້າການຮຽກຄິວ
              </div>
            </div>
            <ContactSection />
          </div>

          <div className="p-4 border-t-2 border-[#e8d5c0]" style={{ background: 'var(--warm-white)' }}>
            <button className="btn-primary" onClick={resetOrder}>+ ອໍເດີໃໝ່ · New Order</button>
          </div>
        </>
      )}
    </div>
  )
}
