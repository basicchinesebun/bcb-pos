'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import ContactSection from '../../components/ContactSection'
import ClosedOverlay from '../../components/ClosedOverlay'

const EMOJIS = ['🥟','🍫','🍵','🧁','🍞','🥐','🍮']

const QUICK_BAGS = [
  { id: 'single',  icon: '🛍',     label: 'ຖົງດຽວ',       desc: 'ທຸກຢ່າງໃນ 1 ຖົງ' },
  { id: 'bytype',  icon: '🛍🛍',   label: 'ແຍກຕາມເມນູ',   desc: 'ແຕ່ລະເມນູ 1 ຖົງ' },
  { id: 'each',    icon: '🛍🛍🛍', label: 'ແຍກທຸກກ້ອນ',   desc: '1 ກ້ອນ 1 ຖົງ' },
]

const STATUS_MAP = {
  pending:   { label: '⏳ ລໍຖ້າຢືນຢັນ', cls: 'bg-orange-50 text-orange-700' },
  confirmed: { label: '✓ ຢືນຢັນແລ້ວ',   cls: 'bg-green-50 text-green-700' },
  rejected:  { label: '✕ ປະຕິເສດ',       cls: 'bg-red-50 text-red-700' },
  done:      { label: '✓ ສຳເລັດ',        cls: 'bg-green-100 text-green-800' },
}

// Step labels: 0=CustomerInfo, 1=Menu, 3=Time, 4=Payment, 5=Status (step 2 bag is auto-skipped)
const STEPS = ['ຂໍ້ມູນ', 'ເລືອກເມນູ', 'ເວລາ', 'ຊຳລະ', 'ສະຖານະ']
const STEP_DISPLAY = { 0: 1, 1: 2, 3: 3, 4: 4, 5: 5 }

export default function PreOrderPage() {
  const [step, setStep] = useState(0)
  const [menus, setMenus] = useState([])
  const [prices, setPrices] = useState([])
  const [stock, setStock] = useState([])
  const [shopOpen, setShopOpen] = useState(true)
  const [images, setImages] = useState({})
  const [qrImage, setQrImage] = useState(null)
  const [selected, setSelected] = useState({})
  const [bagPacks, setBagPacks] = useState([{}])
  const [packToast, setPackToast] = useState(null)
  const [expandedBags, setExpandedBags] = useState(new Set())
  const [form, setForm] = useState({ name: '', phone: '20', time: '' })
  const [pickupTimeRange, setPickupTimeRange] = useState({ start: '15:30', end: '19:30' })
  const [slip, setSlip] = useState(null)
  const [slipPreview, setSlipPreview] = useState(null)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [histPhone, setHistPhone] = useState('')
  const [history, setHistory] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [noticeImage, setNoticeImage] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatVH, setChatVH] = useState(null)
  const [chatCustomer, setChatCustomer] = useState(null) // { name, phone, qnum }
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', phone: '' })
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [blockedIps, setBlockedIps] = useState([])
  const [blockedFp, setBlockedFp] = useState([])
  const chatBottomRef = useRef(null)

  // Load saved customer info on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bcb-customer')
      if (saved) {
        const { name, phone } = JSON.parse(saved)
        setForm(f => ({ ...f, name: name || '', phone: phone || '20' }))
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    loadShopData()
    const timer = setTimeout(() => setLoading(false), 6000)
    const channel = supabase
      .channel('preorder-stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config' }, loadShopData)
      .subscribe()

    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      supabase.removeChannel(channel)
      clearTimeout(timer)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (!currentOrder?.id || !supabase) return
    const channel = supabase
      .channel('order-status-' + currentOrder.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${currentOrder.id}`
      }, payload => { setCurrentOrder(payload.new) })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [currentOrder?.id])

  function openChat(customer) {
    setChatCustomer(customer)
    setChatMessages([])
    setChatOpen(true)
  }

  useEffect(() => {
    if (!chatOpen || !chatCustomer?.phone || !supabase) return
    const phone = chatCustomer.phone
    supabase.from('messages').select('*').eq('phone', phone)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setChatMessages(data) })
    const ch = supabase.channel('chat-cust-' + phone)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `phone=eq.${phone}` },
        payload => setChatMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [chatOpen, chatCustomer?.phone])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // iOS Safari keyboard: track visualViewport height so chat overlay resizes with keyboard
  useEffect(() => {
    if (!chatOpen) { setChatVH(null); return }
    function update() { setChatVH((window.visualViewport?.height ?? window.innerHeight) + 'px') }
    update()
    window.visualViewport?.addEventListener('resize', update)
    return () => window.visualViewport?.removeEventListener('resize', update)
  }, [chatOpen])

  function applyCfg(cfg) {
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
    setStock(cfg.stock_online ? JSON.parse(cfg.stock_online) : [0,0,0,0,0,0,0])
    setImages(cfg.menu_images ? JSON.parse(cfg.menu_images) : {})
    setQrImage(cfg.qr_image || null)
    setShopInfo(cfg.shop_info ? JSON.parse(cfg.shop_info) : { name: 'Basic Chinese Bun' })
    if (cfg.notice_image) setNoticeImage(cfg.notice_image)
    if (cfg.branches) setBranches(JSON.parse(cfg.branches))
    if (cfg.settings) {
      const s = JSON.parse(cfg.settings)
      setShopOpen(s.onlineOn !== false)
      if (s.pickupTimeStart || s.pickupTimeEnd) {
        setPickupTimeRange({ start: s.pickupTimeStart || '15:30', end: s.pickupTimeEnd || '19:00' })
      }
    }
    if (cfg.blocked_ips) try { setBlockedIps(JSON.parse(cfg.blocked_ips)) } catch (_) {}
    if (cfg.blocked_fp) try { setBlockedFp(JSON.parse(cfg.blocked_fp)) } catch (_) {}
  }

  async function loadShopData() {
    try {
      const raw = localStorage.getItem('bcb-shop-config')
      if (raw) { applyCfg(JSON.parse(raw)); setLoading(false) }
    } catch (_) {}
    if (!supabase) { setLoading(false); return }
    const { data } = await supabase.from('shop_config').select('*')
    if (!data) { setLoading(false); return }
    const cfg = {}
    data.forEach(r => { cfg[r.key] = r.value })
    try { localStorage.setItem('bcb-shop-config', JSON.stringify(cfg)) } catch (_) {}
    applyCfg(cfg)
    setLoading(false)
  }

  const totalPrice = Object.entries(selected).reduce((s, [i, q]) => s + (prices[+i] || 0) * q, 0)
  const totalOrdered = Object.values(selected).reduce((s, v) => s + v, 0)
  const totalPacked = bagPacks.reduce((s, bag) => s + Object.values(bag).reduce((ss, v) => ss + v, 0), 0)

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

  // Phone slip photos come in at full camera resolution (often several MB, some
  // even 16-bit PNGs some banking-app screenshots produce) — staff end up
  // downloading and decoding that full size just to see a small thumbnail,
  // which is what makes slip/menu image loading feel so slow. Re-encode to a
  // normal 8-bit JPEG capped at 1280px wide before upload; text stays legible
  // for verification but the file drops to a fraction of the size.
  function compressSlipImage(file, maxW = 1280, quality = 0.85) {
    return new Promise(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  function handleSlip(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.size) {
      // Some phones (esp. Android photo pickers on cloud-backed / just-captured
      // images) hand over a File stub before the actual bytes are ready, which
      // uploads as an empty file with no error — leaving staff an unviewable slip.
      alert('ໂຫລດຮູບບໍ່ສຳເລັດ (ໄຟລ໌ວ່າງເປົ່າ) ກະລຸນາລອງເລືອກຮູບສະລິບໃໝ່ອີກຄັ້ງ')
      e.target.value = ''
      return
    }
    setSlip(file)
    const reader = new FileReader()
    reader.onload = ev => setSlipPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function submitOrder() {
    if (!slip) { alert('ກະລຸນາອັບໂຫລດສະລິບ'); return }
    if (!slip.size) { alert('ຮູບສະລິບວ່າງເປົ່າ ກະລຸນາອັບໂຫລດຮູບໃໝ່ອີກຄັ້ງ'); return }
    if (!form.name || !form.phone || !form.time) {
      alert('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ')
      return
    }
    setSubmitting(true)
    try {
      const compressedSlip = await compressSlipImage(slip)
      const ext = compressedSlip.type === 'image/jpeg' ? 'jpg' : (slip.name.split('.').pop() || 'jpg')
      const fileName = `slips/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('bcb - upload')
        .upload(fileName, compressedSlip, { contentType: compressedSlip.type || 'image/jpeg' })
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('bcb - upload').getPublicUrl(fileName)
      const slipUrl = urlData.publicUrl

      const { data: qnumData, error: qErr } = await supabase.rpc('next_queue_number')
      if (qErr) throw qErr

      const items = Object.entries(selected).map(([i, qty]) => ({
        menuIdx: +i,
        name: menus[+i]?.lo || '',
        qty,
        price: prices[+i] || 0,
        sub: (prices[+i] || 0) * qty,
      }))

      const packingLabel = bagPacks
        .map((b, i) => { const t = bagText(b); return t ? `ຖົງ ${i + 1}: ${t}` : null })
        .filter(Boolean)
        .join(' | ')

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const lang = navigator.language

      // Enhanced device fingerprint (collected silently)
      let canvasFp = ''
      try {
        const cv = document.createElement('canvas'); cv.width = 200; cv.height = 40
        const ctx = cv.getContext('2d')
        ctx.textBaseline = 'top'; ctx.font = '14px Arial'
        ctx.fillStyle = '#f60'; ctx.fillRect(125, 1, 62, 20)
        ctx.fillStyle = '#069'; ctx.fillText('BCBfp', 2, 15)
        ctx.fillStyle = 'rgba(102,204,0,0.7)'; ctx.fillText('BCBfp', 4, 17)
        const raw = cv.toDataURL()
        let h = 0; for (let i = 0; i < raw.length; i++) { h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0 }
        canvasFp = (h >>> 0).toString(16)
      } catch (_) {}

      let webglRenderer = ''
      try {
        const gl = document.createElement('canvas').getContext('webgl')
        const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info')
        if (dbg) webglRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
      } catch (_) {}

      let securityMeta = {
        tz, lang,
        ua: navigator.userAgent,
        platform: navigator.platform,
        screen: screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
        mem: navigator.deviceMemory || null,
        cpu: navigator.hardwareConcurrency || null,
        touch: navigator.maxTouchPoints || 0,
        canvasFp,
        gpu: webglRenderer,
        ts: Date.now(),
      }
      try {
        const r = await fetch('https://ipapi.co/json/')
        const d = await r.json()
        securityMeta.ip = { ip: d.ip, country: d.country_name, country_code: d.country_code, city: d.city, org: d.org, timezone: d.timezone }
      } catch (_) {}

      // Shadow-ban: block Qatar IPs or name "bong"
      const detectedCountry = securityMeta.ip?.country_code || ''
      const isBlocked = detectedCountry === 'QA' || form.name.trim().toLowerCase() === 'bong'
      const orderStatus = isBlocked ? 'blocked' : 'pending'

      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        qnum: qnumData,
        type: 'online',
        status: orderStatus,
        items: JSON.stringify(items),
        total: totalPrice,
        bag_label: packingLabel,
        customer: JSON.stringify({ ...form, security: securityMeta }),
        slip_url: slipUrl,
        done: false,
        cancelled: false,
      }).select().single()
      if (orderErr) throw orderErr

      // Only decrement stock for real orders, not shadow-banned ones
      if (!isBlocked) {
        const { data: stockRow } = await supabase.from('shop_config').select('value').eq('key', 'stock_online').single()
        const freshStock = stockRow ? JSON.parse(stockRow.value) : [...stock]
        Object.entries(selected).forEach(([i, qty]) => {
          freshStock[+i] = Math.max(0, (freshStock[+i] || 0) - qty)
        })
        await supabase.from('shop_config').upsert({ key: 'stock_online', value: JSON.stringify(freshStock) }, { onConflict: 'key' })
      }

      setCurrentOrder(order)
      setStep(5)
    } catch (e) {
      console.error(e)
      alert('❌ ເກີດບັນຫາ: ' + (e.message || 'unknown'))
    } finally {
      setSubmitting(false)
    }
  }

  async function sendChatMsg() {
    if (!chatInput.trim() || chatSending || !chatCustomer?.phone || !chatCustomer?.name || !supabase) return
    setChatSending(true)
    await supabase.from('messages').insert({
      phone: chatCustomer.phone, name: chatCustomer.name, qnum: chatCustomer.qnum || null,
      sender: 'customer', text: chatInput.trim(),
    })
    setChatInput('')
    setChatSending(false)
  }

  async function searchHistory() {
    if (!histPhone || histPhone.length < 6) return
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('type', 'online')
      .order('created_at', { ascending: false })
    if (!data) return
    const normalize = p => (p || '').replace(/\s/g, '').replace(/^0+/, '')
    const needle = normalize(histPhone)
    const filtered = data.filter(o => {
      try { return normalize(JSON.parse(o.customer || '{}').phone) === needle }
      catch { return false }
    })
    setHistory(filtered)
  }

  const statusInfo = STATUS_MAP[currentOrder?.status] || STATUS_MAP.pending

  if (loading) return (
    <div className="min-h-dvh flex flex-col items-center justify-center" style={{ background: '#3d1f0a' }}>
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full border-4 animate-spin"
          style={{ borderColor: 'rgba(253,246,238,0.15)', borderTopColor: '#fdf6ee' }} />
        <div className="text-center">
          <div className="font-serif text-xl font-black" style={{ color: '#fdf6ee' }}>🥟 Basic Chinese Bun</div>
          <div className="text-sm font-bold mt-2" style={{ color: 'rgba(253,246,238,0.5)' }}>ກຳລັງໂຫຼດ...</div>
        </div>
      </div>
    </div>
  )

  if (!supabase) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="text-sm font-bold text-center px-6" style={{ color: 'var(--brown)' }}>
        ບໍ່ສາມາດເຊື່ອມຕໍ່ຖານຂໍ້ມູນໄດ້<br/>ກະລຸນາລອງໃໝ່ອີກຄັ້ງ
      </div>
    </div>
  )

  return (
    <div
      className={`flex flex-col${step !== 4 ? ' overflow-hidden h-dvh' : ' min-h-dvh'}`}
      style={{ background: 'var(--cream)' }}
    >
      {/* ── Notice Modal ── */}
      {showNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:'rgba(0,0,0,0.65)'}}
          onClick={()=>{ setShowNotice(false); setStep(1) }}>
          <div className="relative w-full max-w-sm"
            onClick={e=>e.stopPropagation()}>
            {/* X button */}
            <button
              onClick={()=>{ setShowNotice(false); setStep(1) }}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-base font-black shadow-lg transition-all active:scale-90"
              style={{background:'#3d1f0a',color:'#fdf6ee'}}>✕</button>
            {/* Image */}
            {noticeImage
              ? <img src={noticeImage} alt="ແຈ້ງການ" className="w-full rounded-2xl shadow-2xl" style={{display:'block'}} />
              : <div className="rounded-2xl p-8 text-center" style={{background:'#fdf3e3'}}>
                  <div className="text-4xl mb-3">📢</div>
                  <div className="font-black text-lg mb-2" style={{color:'#5c3317'}}>ແຈ້ງເຖິງລູກຄ້າ</div>
                  <p className="text-sm" style={{color:'#7c4a1e'}}>ທາງຮ້ານສາມາດຝາກເກັບສິນຄ້າໄວ້ໃຫ້ໄດ້ສູງສຸດ 3 ວັນ ນັບຈາກວັນສັ່ງຊື້</p>
                </div>
            }
          </div>
        </div>
      )}
      {!isOnline && (
        <div className="bg-red-700 text-white text-center py-2 text-sm font-black">
          ⚠ ບໍ່ມີອິນເຕີເນັດ
        </div>
      )}
      {/* Closed overlay — covers entire screen when online orders are OFF */}
      {!shopOpen && (
        <ClosedOverlay
          shopInfo={shopInfo}
          branches={branches}
          subtitle="ບໍ່ຮັບ Pre-order ໃນຕອນນີ້"
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 relative text-center py-4 flex-shrink-0" style={{ background: 'var(--brown)' }}>
        <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>{shopInfo.name}</div>
        <div className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.55)' }}>
          Pre-Order · ສັ່ງລ່ວງໜ້າ
        </div>
        <a href="/contact"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all"
          style={{ background: 'rgba(253,246,238,0.15)', color: 'var(--cream)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </a>
      </div>

      {/* Progress bar */}
      {step >= 0 && step <= 5 && (
        <div className="flex gap-1 px-4 py-3 flex-shrink-0" style={{ background: 'var(--warm-white)', borderBottom: '2px solid var(--cream3)' }}>
          {STEPS.map((s, i) => {
            const d = STEP_DISPLAY[step] || step
            return (
              <div key={i} className="flex-1">
                <div className={`h-1 rounded-full ${i < d ? 'bg-[#3d1f0a]' : i === d - 1 ? 'bg-[#6b3a1f]' : 'bg-[#e8d5c0]'}`} />
                <div className="text-center text-xs mt-1 font-bold truncate" style={{ color: i < d ? 'var(--brown)' : 'var(--cream3)', fontSize: 9 }}>
                  {s}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── STEP 0: Customer Info ─── */}
      {step === 0 && (
        <>
          <div className="flex-1 overflow-y-auto p-4" style={{ position: 'relative' }}>
            <img src="/bun-pattern.png" aria-hidden="true" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.11, pointerEvents: 'none', zIndex: 0 }} />
            <div className="max-w-lg mx-auto flex flex-col gap-4" style={{ position: 'relative', zIndex: 1 }}>
              {/* Welcome */}
              <div className="text-center py-6">
                <div className="font-serif text-3xl font-black mb-1" style={{ color: 'var(--brown)' }}>ຍິນດີຕ້ອນຮັບ 👋</div>
                <div className="text-sm font-bold" style={{ color: 'var(--gray3)' }}>ກະລຸນາໃສ່ຊື່ ແລະ ເບີໂທ ກ່ອນສັ່ງ</div>
              </div>
              {/* Name */}
              <div>
                <label className="block text-xs font-black tracking-widest uppercase mb-2" style={{ color: 'var(--brown2)' }}>ຊື່ · Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="ສົມໃຈ"
                  className="input-field"
                />
              </div>
              {/* Phone */}
              <div>
                <label className="block text-xs font-black tracking-widest uppercase mb-2" style={{ color: 'var(--brown2)' }}>ເບີໂທ · Phone</label>
                <input
                  type="tel" inputMode="numeric"
                  value={form.phone}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, '')
                    if (!v.startsWith('20')) v = '20' + v.replace(/^2?0?/, '')
                    if (v.length > 10) v = v.slice(0, 10)
                    setForm(p => ({ ...p, phone: v }))
                  }}
                  onKeyDown={e => {
                    if ((e.key === 'Backspace' || e.key === 'Delete') && form.phone.length <= 2) e.preventDefault()
                  }}
                  placeholder="20XXXXXXXX"
                  className="input-field"
                />
                <div className="text-xs font-bold mt-1" style={{ color: 'var(--gray3)' }}>
                  ເລີ່ມດ້ວຍ 20 · ພິມ {Math.max(0, 10 - form.phone.length)} ຕົວອີກ
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t-2 border-[#e8d5c0] flex flex-col gap-2 flex-shrink-0" style={{ background: 'var(--warm-white)' }}>
            <button className="btn-primary" onClick={() => {
              if (!form.name.trim()) { alert('ກະລຸນາໃສ່ຊື່'); return }
              if (form.phone.length < 10 || !form.phone.startsWith('20')) { alert('ເບີໂທຕ້ອງຄົບ 10 ຕົວເລກ ແລະ ເລີ່ມດ້ວຍ 20'); return }
              try { localStorage.setItem('bcb-customer', JSON.stringify({ name: form.name, phone: form.phone })) } catch (_) {}
              setShowNotice(true)
            }}>ຕໍ່ໄປ →</button>
          </div>
        </>
      )}

      {/* ─── STEP 1: Menu ─── */}
      {step === 1 && (
        <>
          <div className="flex-1 overflow-y-auto p-2 sm:p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {menus.map((_, i) => i).sort((a, b) => ((stock[a]||0) === 0 ? 1 : 0) - ((stock[b]||0) === 0 ? 1 : 0)).map((i, pos) => {
                const m = menus[i]
                const qty = selected[i] || 0
                const s = stock[i] || 0
                const isOut = s === 0
                const isSel = qty > 0
                const img = images[i]
                const isLastLoneMobile = menus.length % 2 === 1 && pos === menus.length - 1
                const isLastLoneMd = menus.length % 3 === 1 && pos === menus.length - 1
                let loneClass = ''
                if (isLastLoneMobile) loneClass += ' col-span-2 w-1/2 mx-auto'
                if (isLastLoneMobile || isLastLoneMd) loneClass += ' md:col-span-1 md:w-full md:mx-0'
                if (isLastLoneMd) loneClass += ' md:col-start-2'
                if (isLastLoneMobile || isLastLoneMd) loneClass += ' lg:col-start-auto'
                return (
                  <div key={i}
                    onClick={() => { if (!isOut && !selected[i]) setSelected(p => ({ ...p, [i]: 1 })) }}
                    className={`rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${isOut ? 'opacity-50 cursor-not-allowed border-[#e8d5c0]' : isSel ? 'border-[#3d1f0a] shadow-[0_0_0_2px_#3d1f0a]' : 'border-[#e8d5c0]'}${loneClass}`}
                    style={{ background: 'var(--warm-white)' }}>
                    <div className="aspect-square relative overflow-hidden" style={{ background: 'var(--cream2)' }}>
                      {img ? <img src={img} alt={m.lo} className="w-full h-full object-cover" loading="lazy" /> :
                        <div className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl">{EMOJIS[i] || '🍱'}</div>}
                      {isOut && <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(61,31,10,0.55)' }}>
                        <span className="text-white font-black text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(185,28,28,0.9)' }}>ໝົດ</span>
                      </div>}
                      {isSel && <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>{qty}</div>}
                    </div>
                    <div className="p-1.5">
                      <div className="text-xs font-black leading-tight" style={{ color: 'var(--brown)' }}>{m.lo}</div>
                      <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--brown2)' }}>
                        {isOut ? 'ໝົດ' : `${(prices[i] || 0).toLocaleString()}`}
                      </div>
                      {!isOut && (
                        <div className="text-xs mt-0.5 font-bold" style={{ color: s <= 5 ? '#dc2626' : 'var(--gray3)' }}>
                          ເຫຼືອ {s}{s <= 5 ? ' ⚠' : ''}
                        </div>
                      )}
                    </div>
                    {isSel && (
                      <div className="flex items-center justify-between px-1.5 py-1 border-t border-[#e8d5c0]" style={{ background: 'var(--cream2)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={e => changeQty(e, i, -1)} className="w-6 h-6 rounded-full border-2 border-[#3d1f0a] flex items-center justify-center text-sm font-black" style={{ background: 'var(--warm-white)', color: 'var(--brown)' }}>−</button>
                        <span className="text-xs font-black" style={{ color: 'var(--brown)' }}>{qty}</span>
                        <button onClick={e => changeQty(e, i, 1)} className="w-6 h-6 rounded-full border-2 border-[#3d1f0a] flex items-center justify-center text-sm font-black" style={{ background: 'var(--warm-white)', color: 'var(--brown)' }}>+</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="p-3 border-t-2 border-[#e8d5c0] flex flex-col gap-2 flex-shrink-0" style={{ background: 'var(--warm-white)' }}>
            <button className="btn-primary" disabled={Object.keys(selected).length === 0} onClick={() => {
              const bag = {}
              Object.entries(selected).forEach(([idx, qty]) => { bag[idx] = qty })
              setBagPacks([bag])
              setStep(3)
            }}>ຕໍ່ໄປ →</button>
            <button className="text-xs font-black py-2" style={{ color: 'var(--gray3)', background: 'transparent', border: 'none' }}
              onClick={() => { setHistPhone(''); setHistory([]); setStep(6) }}>
              📜 ເບິ່ງປະຫວັດ Order
            </button>
          </div>
        </>
      )}

      {/* ─── STEP 2: Bag Selection ─── */}
      {step === 2 && (
        <>
          {packToast && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-base font-black text-white shadow-xl pointer-events-none"
              style={{ background: 'var(--brown)' }}>
              {packToast}
            </div>
          )}

          <div className="text-center px-4 py-4 flex-shrink-0" style={{ background: 'var(--brown)' }}>
            <div className="font-serif text-2xl font-black" style={{ color: 'var(--cream)' }}>ເລືອກຖົງເຈ້ຍ</div>
            <div className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.55)' }}>Paper Bag Selection</div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4" style={{ minHeight: 0 }}>

            {/* Quick Select */}
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

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-t-2 border-[#e8d5c0]" />
              <span className="text-xs font-black tracking-widest px-2" style={{ color: 'var(--gray3)' }}>ຫຼື ຈັດເອງ · OR PACK CUSTOM</span>
              <div className="flex-1 border-t-2 border-[#e8d5c0]" />
            </div>

            {/* Progress tracker */}
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

            {/* Custom Bag Cards */}
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
                    <div className="flex items-start gap-3 px-5 py-3"
                      style={{ background: filled ? 'var(--cream2)' : 'var(--warm-white)' }}>
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mt-0.5"
                        style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                        {n + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-base" style={{ color: 'var(--brown)' }}>ຖົງທີ {n + 1}</div>
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
                              ? <img src={img} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" alt={name} loading="lazy" />
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

            {/* Add Bag button */}
            <div className="flex justify-end mt-4 mb-2">
              <button
                onClick={() => setBagPacks(prev => [...prev, {}])}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-base active:scale-95 transition-all"
                style={{ background: 'var(--brown)', color: 'var(--cream)', boxShadow: '0 4px 12px rgba(61,31,10,0.25)' }}>
                ➕ ເພີ່ມຖົງ
              </button>
            </div>
          </div>

          <div className="px-4 pt-3 pb-5 border-t-2 border-[#e8d5c0] flex flex-col gap-2 flex-shrink-0"
            style={{ background: 'var(--warm-white)' }}>
            {bagPacks.every(b => !Object.keys(b).length) && (
              <div className="text-center text-sm font-bold mb-1" style={{ color: 'var(--gray3)' }}>
                ເລືອກດ່ວນ ຫຼື ໃສ່ຢ່າງໜ້ອຍ 1 ຖົງ
              </div>
            )}
            <button
              className="btn-primary py-4 text-lg font-black"
              disabled={totalPacked < totalOrdered}
              onClick={() => setStep(3)}>
              ✓ ຢືນຢັນ · Confirm
            </button>
            <button className="btn-outline py-3 text-base" onClick={() => setStep(1)}>← ກັບຄືນ · Back</button>
          </div>
        </>
      )}

      {/* ─── STEP 3: Time ─── */}
      {step === 3 && (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-lg mx-auto flex flex-col gap-4">
              {/* Customer summary (readonly) */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'var(--cream2)', border: '1.5px solid var(--cream3)' }}>
                <div className="flex-1">
                  <div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: 'var(--gray3)' }}>ຂໍ້ມູນລູກຄ້າ</div>
                  <div className="font-black text-sm" style={{ color: 'var(--brown)' }}>👤 {form.name}</div>
                  <div className="font-bold text-sm mt-0.5" style={{ color: 'var(--brown2)' }}>📞 {form.phone}</div>
                </div>
              </div>
              {/* Time slots */}
              <div>
                <label className="block text-xs font-black tracking-widest uppercase mb-1" style={{ color: 'var(--brown2)' }}>ເວລາ · Time</label>
                <div className="text-xs font-bold mb-3" style={{ color: 'var(--gray3)' }}>
                  ຮັບໄດ້: {pickupTimeRange.start} – {pickupTimeRange.end}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(() => {
                    const slots = []
                    const [sh, sm] = pickupTimeRange.start.split(':').map(Number)
                    const [eh, em] = pickupTimeRange.end.split(':').map(Number)
                    let h = sh, m = sm
                    while (h * 60 + m <= eh * 60 + em) {
                      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
                      m += 30
                      if (m >= 60) { h++; m -= 60 }
                    }
                    return slots.map(t => (
                      <button key={t}
                        onClick={() => setForm(p => ({ ...p, time: t }))}
                        className="py-3 rounded-xl font-black text-sm transition-all active:scale-95"
                        style={{
                          background: form.time === t ? 'var(--brown)' : 'var(--cream2)',
                          color: form.time === t ? 'var(--cream)' : 'var(--brown)',
                          border: `2px solid ${form.time === t ? 'var(--brown)' : '#e8d5c0'}`,
                        }}>
                        {t}
                      </button>
                    ))
                  })()}
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t-2 border-[#e8d5c0] flex flex-col gap-2 flex-shrink-0" style={{ background: 'var(--warm-white)' }}>
            <button className="btn-primary" onClick={() => {
              if (!form.time) { alert('ກະລຸນາເລືອກເວລາ'); return }
              if (form.time < pickupTimeRange.start || form.time > pickupTimeRange.end) { alert(`ເວລາຮັບຂອງໄດ້ ${pickupTimeRange.start} – ${pickupTimeRange.end} ເທົ່ານັ້ນ`); return }
              setStep(4)
            }}>ຕໍ່ໄປ →</button>
            <button className="btn-outline" onClick={() => setStep(1)}>← ກັບຄືນ</button>
          </div>
        </>
      )}

      {/* ─── STEP 4: Payment ─── */}
      {step === 4 && (
        <>
          {/* Sub-header — not sticky, scrolls with page */}
          <div className="text-center py-4" style={{ background: 'var(--brown)' }}>
            <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>ສະຫຼຸບ · ຊຳລະເງິນ</div>
          </div>

          {/* Natural-flow content — browser window scrollbar handles this */}
          <div className="p-4 flex flex-col gap-4">

            {/* 1. Items — inner scroll, shows 3 rows before scrolling */}
            <div className="rounded-2xl overflow-hidden border-2 border-[#e8d5c0]" style={{ background: 'var(--warm-white)' }}>
              <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#e8d5c0]">
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--gray3)' }}>ລາຍການ · Items</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--cream2)', color: 'var(--brown)' }}>
                  {Object.values(selected).reduce((s, v) => s + v, 0)} ກ້ອນ
                </span>
              </div>
              {/* maxHeight = 3 rows × (py-3×2 + h-9 + border) = 3 × 61px = 183px */}
              <div className="overflow-y-auto" style={{ maxHeight: 183 }}>
                {Object.entries(selected).map(([i, qty]) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#f5ebe0] last:border-0">
                    {images[+i]
                      ? <img src={images[+i]} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" alt="" loading="lazy" />
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

            {/* 4. Slip upload — below QR */}
            <div className="flex flex-col items-center gap-3 pb-4">
              <label className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-[#3d1f0a] cursor-pointer font-black text-sm active:scale-95 transition-all"
                style={{ color: 'var(--brown)', background: 'var(--warm-white)' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                </svg>
                ອັບໂຫລດສະລິບໂອນເງິນ · Upload Slip
                <input type="file" accept="image/*" onChange={handleSlip} className="hidden" />
              </label>
              {slipPreview && (
                <div className="w-full max-w-xs rounded-xl overflow-hidden border-2 border-[#3d1f0a]">
                  <img src={slipPreview} alt="slip" className="w-full" />
                  <div className="px-3 py-2 text-center text-xs font-black" style={{ background: 'var(--cream2)', color: '#16a34a' }}>
                    ✓ ອັບໂຫລດສຳເລັດ
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Submit bar — sticky at bottom of viewport while page scrolls */}
          <div className="sticky bottom-0 p-4 border-t-2 border-[#e8d5c0] flex flex-col gap-2" style={{ background: 'var(--warm-white)' }}>
            <button className="btn-primary" onClick={submitOrder} disabled={submitting || !slip}>
              {submitting ? 'ກຳລັງສົ່ງ...' : 'ສົ່ງອໍເດີ · Submit'}
            </button>
            <button className="btn-outline" onClick={() => setStep(3)}>← ກັບຄືນ</button>
          </div>
        </>
      )}

      {/* ─── STEP 5: Status ─── */}
      {step === 5 && currentOrder && (
        <>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-[#3d1f0a] shadow-xl">
              <div className="text-center py-5" style={{ background: 'var(--brown)' }}>
                <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>{shopInfo.name}</div>
              </div>
              <div className="text-center py-6 px-4" style={{ background: 'var(--warm-white)' }}>
                <div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: 'var(--gray3)' }}>ເລກຄິວ · QUEUE</div>
                <div className="font-serif font-black leading-none mb-3" style={{ fontSize: 72, color: 'var(--brown)' }}>
                  {String(currentOrder.qnum).padStart(4, '0')}
                </div>
                <span className={`tag text-sm font-black px-4 py-2 rounded-full ${statusInfo.cls}`}>
                  {statusInfo.label}
                </span>
              </div>
              {currentOrder.customer && (() => {
                const c = typeof currentOrder.customer === 'string' ? JSON.parse(currentOrder.customer) : currentOrder.customer
                return (
                  <div className="mx-4 mb-4 rounded-xl p-3 text-sm font-bold leading-7" style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
                    <div className="flex justify-between"><span>ຊື່:</span><span>{c.name}</span></div>
                    <div className="flex justify-between"><span>ເວລາ:</span><span>{c.time}</span></div>
                    <div className="flex justify-between"><span>ລວມ:</span><span>{currentOrder.total?.toLocaleString()} ກີບ</span></div>
                  </div>
                )
              })()}
              <div className="text-center py-3 text-xs font-bold" style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
                ກະລຸນາສະແດງໜ້ານີ້ຕອນມາຮັບ
              </div>
            </div>

            {/* Share / Copy row */}
            {(() => {
              const c = typeof currentOrder.customer === 'string' ? JSON.parse(currentOrder.customer) : currentOrder.customer
              const statusUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/status?id=${currentOrder.id}`
              const orderText = `🥟 ${shopInfo.name}\nOrder #${String(currentOrder.qnum).padStart(4,'0')}\n👤 ${c.name}\n🕐 ${c.time}\n💰 ${currentOrder.total?.toLocaleString()} ກີບ\n\n🔗 ລິ້ງຕິດຕາມ Order:\n${statusUrl}`
              return (
                <div className="flex gap-2 mt-3 px-4">
                  <button onClick={async () => {
                    if (navigator.share) {
                      await navigator.share({ title: shopInfo.name, text: orderText, url: statusUrl })
                    } else {
                      await navigator.clipboard.writeText(statusUrl)
                      alert('ຄັດລອກລິ້ງແລ້ວ!')
                    }
                  }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm"
                    style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                    📤 ແຊລິ້ງ Order
                  </button>
                  <button onClick={async () => {
                    await navigator.clipboard.writeText(statusUrl)
                    alert('ຄັດລອກລິ້ງແລ້ວ! ສ່ງໃຫ້ໃຜກໍ່ໄດ້')
                  }} className="px-4 py-2.5 rounded-xl font-black text-sm"
                    style={{ background: 'var(--cream2)', color: 'var(--brown)', border: '1.5px solid var(--cream3)' }}>
                    🔗 ລິ້ງ
                  </button>
                </div>
              )
            })()}

            <ContactSection />
          </div>
          <div className="p-4 border-t-2 border-[#e8d5c0] flex flex-col gap-2 flex-shrink-0" style={{ background: 'var(--warm-white)' }}>
            <button className="btn-outline" onClick={() => {
              setSelected({})
              setBagPacks([{}])
              setForm(f => ({ ...f, time: '' }))
              setSlip(null)
              setSlipPreview(null)
              setCurrentOrder(null)
              setChatMessages([])
              setStep(1)
            }}>
              + ອໍເດີໃໝ່
            </button>
          </div>
        </>
      )}


      {/* ─── STEP 6: History ─── */}
      {step === 6 && (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-lg mx-auto">
              <div className="mb-4">
                <label className="block text-xs font-black tracking-widest uppercase mb-2" style={{ color: 'var(--brown2)' }}>ຄົ້ນຫາຈາກເບີໂທ</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={histPhone}
                    onChange={e => setHistPhone(e.target.value)}
                    placeholder="020 XXXX XXXX"
                    className="input-field flex-1"
                  />
                  <button onClick={searchHistory} className="px-4 py-3 rounded-xl font-black text-sm" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                    ຊອກ
                  </button>
                </div>
              </div>
              {history.map(o => {
                const c = typeof o.customer === 'string' ? JSON.parse(o.customer || '{}') : (o.customer || {})
                const statusI = STATUS_MAP[o.status] || STATUS_MAP.pending
                return (
                  <div key={o.id} className="card mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-serif text-xl font-black" style={{ color: 'var(--brown)' }}>#{String(o.qnum).padStart(4,'0')}</span>
                      <span className={`tag ${statusI.cls}`}>{statusI.label}</span>
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--gray3)' }}>{c.time}</div>
                    <div className="text-sm font-bold mt-1" style={{ color: 'var(--brown2)' }}>
                      {(typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []).map(it => `${it.name} × ${it.qty}`).join(', ')}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-black" style={{ color: 'var(--brown)' }}>{o.total?.toLocaleString()} ກີບ</span>
                    </div>
                  </div>
                )
              })}
              {history.length === 0 && histPhone.length >= 6 && (
                <div className="text-center py-8 font-bold" style={{ color: 'var(--cream3)' }}>ບໍ່ພົບອໍເດີ</div>
              )}
            </div>
          </div>
          <div className="p-4 border-t-2 border-[#e8d5c0] flex-shrink-0" style={{ background: 'var(--warm-white)' }}>
            <button className="btn-outline" onClick={() => setStep(1)}>← ກັບໄປໜ້າຫຼັກ</button>
          </div>
        </>
      )}
    </div>
  )
}
