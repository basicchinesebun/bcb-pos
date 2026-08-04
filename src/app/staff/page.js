'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

async function nextWalkinQnum() {
  const { data } = await supabase.from('shop_config').select('value').eq('key', 'next_queue_walkin').single()
  const next = (parseInt(data?.value || '0') || 0) + 1
  await supabase.from('shop_config').upsert({ key: 'next_queue_walkin', value: String(next) }, { onConflict: 'key' })
  return next
}

const EMOJIS = ['🥟','🍫','🍵','🧁','🍞','🥐','🍮','🍡','🧆','🫕']

const STATUS_COLORS = {
  walkin: 'bg-blue-50 text-blue-700',
  online: 'bg-orange-50 text-orange-700',
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  blocked: 'bg-purple-50 text-purple-700',
  done: 'bg-green-100 text-green-900',
  called: 'bg-[#3d1f0a] text-[#fdf6ee]',
}

export default function StaffPage() {
  const [tab, setTab] = useState('orders')
  const [staffPin, setStaffPin] = useState('')
  const [profitPin, setProfitPin] = useState('')
  const [staffUnlocked, setStaffUnlocked] = useState(false)
  const [profitUnlocked, setProfitUnlocked] = useState(false)
  const [pinMode, setPinMode] = useState(null) // 'staff'|'profit'|'set-staff'|'set-profit'
  const [pinInput, setPinInput] = useState('')
  const [pinStep, setPinStep] = useState(1) // 1=enter old, 2=enter new, 3=confirm new
  const [pinNew, setPinNew] = useState('')
  const [pinError, setPinError] = useState('')
  const [orders, setOrders] = useState([])
  const [menus, setMenus] = useState([])
  const [prices, setPrices] = useState([])
  const [costs, setCosts] = useState([])
  const [stockTotal, setStockTotal] = useState([])
  const [stockShop, setStockShop] = useState([])
  const [stockOnline, setStockOnline] = useState([])
  const [images, setImages] = useState({})
  const [imgPreviews, setImgPreviews] = useState({})
  const [qrImage, setQrImage] = useState(null)
  const [qrPreview, setQrPreview] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun', address: '', phone: '', footer: 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ', logo: '', printerWidth: 384 })
  const [receiptDraft, setReceiptDraft] = useState({ name: 'Basic Chinese Bun', address: '', phone: '', footer: 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ', logo: '', printerWidth: 384 })
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewTimerRef = useRef(null)
  const [settings, setSettings] = useState({ soundOn: true, walkinOn: true, onlineOn: true, aiOn: true, autoprintOn: false, pickupTimeStart: '15:30', pickupTimeEnd: '19:00' })
  const [walkinCode, setWalkinCode] = useState('')
  const [branches, setBranches] = useState([
    { id: 'simeuang',  name: 'ສາຂາສີເມື່ອງ',  nameEn: 'Si Meuang Branch',  visible: true, schedule: 'ຈ · ພ · ສ (Mon / Wed / Fri)', mapUrl: '', facebookUrl: '', tiktokUrl: '', phone1: '', phone2: '', whatsapp: '' },
    { id: 'houayhong', name: 'ສາຂາຫວຍຫົງ', nameEn: 'Houay Hong Branch', visible: true, schedule: 'ຄ · ສກ · ອ (Tue / Thu / Sat)', mapUrl: '', facebookUrl: '', tiktokUrl: '', phone1: '', phone2: '', whatsapp: '' },
  ])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [toast, setToast] = useState([])
  const [slipModal, setSlipModal] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null) // { message, onConfirm }
  const [slipVerify, setSlipVerify] = useState({}) // orderId -> { loading, result, error }

  const [archiveOpen, setArchiveOpen] = useState(false)
  const [expandedArchive, setExpandedArchive] = useState(new Set())
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split('T')[0])
  const [isOnline, setIsOnline] = useState(true)
  const [liveStatus, setLiveStatus] = useState('connecting') // 'live' | 'connecting' | 'error'
  const [loading, setLoading] = useState(true)
  const [chatConvos, setChatConvos] = useState([])
  const [activeChatPhone, setActiveChatPhone] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [unreadChat, setUnreadChat] = useState(0)
  const [aiPausedPhones, setAiPausedPhones] = useState(new Set())
  const [chatLabels, setChatLabels] = useState({})
  const [labelFilter, setLabelFilter] = useState(null)
  const [payingId, setPayingId] = useState(null)
  const [editOrder, setEditOrder] = useState(null)
  const [editItems, setEditItems] = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [qoOpen, setQoOpen] = useState(false)
  const [qoBagMode, setQoBagMode] = useState('items')
  const [qoSelected, setQoSelected] = useState({})
  const [qoBagPacks, setQoBagPacks] = useState([{}])
  const [qoStep, setQoStep] = useState(1)
  const [qoQnum, setQoQnum] = useState(null)
  const [qoSubmitting, setQoSubmitting] = useState(false)
  const [qoPackToast, setQoPackToast] = useState(null)
  const [qoName, setQoName] = useState('')
  const [chatKbH, setChatKbH] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSelected, setBatchSelected] = useState(new Set())
  const [selectedSlipIds, setSelectedSlipIds] = useState(new Set())
  const [deletingSlips, setDeletingSlips] = useState(false)
  const [blockedIps, setBlockedIps] = useState([])
  const [blockedFp, setBlockedFp] = useState([])
  const chatBottomRef = useRef(null)
  const activeChatPhoneRef = useRef(null)
  const voicesRef = useRef([])
  const receiptFontRef = useRef(null)
  const slipVerifyingRef = useRef(new Set())

  useEffect(() => {
    // Load Noto Sans Lao into document.fonts for canvas receipt rendering
    ;(async () => {
      try {
        const css = await fetch('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;700&display=swap').then(r => r.text())
        const blocks = css.split('@font-face').slice(1)
        for (const block of blocks) {
          const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2)\)/)
          const weightMatch = block.match(/font-weight:\s*(\d+)/)
          if (!urlMatch) continue
          try {
            const face = new FontFace('NotoLaoR', `url(${urlMatch[1]})`, { weight: weightMatch?.[1] || '400' })
            document.fonts.add(await face.load())
          } catch { }
        }
        receiptFontRef.current = 'NotoLaoR'
      } catch { /* fall back to system Noto Sans Lao */ }
    })()
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    loadAll()
    const timer = setTimeout(() => setLoading(false), 6000)

    // Real-time orders — direct state mutations (instant UI) + status tracking
    const ch = supabase.channel('staff-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        payload => setOrders(prev => prev.some(o => o.id === payload.new.id) ? prev : [payload.new, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        payload => setOrders(prev => {
          const exists = prev.some(o => o.id === payload.new.id)
          if (exists) return prev.map(o => o.id === payload.new.id ? payload.new : o)
          return [payload.new, ...prev]
        }))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' },
        payload => setOrders(prev => prev.filter(o => o.id !== payload.old.id)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config' }, payload => {
        const key = payload.new?.key
        const val = payload.new?.value
        if (key === 'stock_shop') { try { setStockShop(JSON.parse(val)) } catch { loadConfig() } }
        else if (key === 'stock_online') { try { setStockOnline(JSON.parse(val)) } catch { loadConfig() } }
        else if (key === 'stock_total') { try { setStockTotal(JSON.parse(val)) } catch { loadConfig() } }
        else loadConfig()
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') setLiveStatus('live')
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setLiveStatus('error')
          loadOrders() // fallback full-sync on error
        }
      })

    // Polling fallback — catches any events that realtime misses (table not in publication etc.)
    const poll = setInterval(loadOrders, 15000)

    // Voices
    const loadVoices = () => { voicesRef.current = window.speechSynthesis.getVoices() }
    window.speechSynthesis.onvoiceschanged = loadVoices
    loadVoices()

    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      supabase.removeChannel(ch)
      clearInterval(poll)
      clearTimeout(timer)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Chat subscription
  useEffect(() => {
    if (!supabase) return
    loadChatConvos()
    const ch = supabase.channel('staff-chat-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new
        const currentPhone = activeChatPhoneRef.current
        if (msg.sender === 'customer') {
          playChatSound()
          if (currentPhone === msg.phone) {
            setChatMessages(prev => [...prev, msg])
            supabase.from('messages').update({ read_by_staff: true }).eq('id', msg.id)
          } else {
            setUnreadChat(prev => prev + 1)
          }
        } else if ((msg.sender === 'staff' || msg.sender === 'ai') && currentPhone === msg.phone) {
          setChatMessages(prev => [...prev, msg])
        }
        setChatConvos(prev => {
          const idx = prev.findIndex(c => c.phone === msg.phone)
          const newUnread = msg.sender === 'customer' && currentPhone !== msg.phone ? 1 : 0
          if (idx >= 0) {
            const updated = prev.map(c => c.phone === msg.phone
              ? { ...c, lastMsg: msg.text, lastAt: msg.created_at, unread: c.unread + newUnread }
              : c)
            return [updated[idx], ...updated.filter((_, i) => i !== idx)]
          }
          return [{ phone: msg.phone, name: msg.name, lastMsg: msg.text, lastAt: msg.created_at, unread: newUnread }, ...prev]
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_chat_paused' }, payload => {
        setAiPausedPhones(prev => new Set([...prev, payload.new.phone]))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ai_chat_paused' }, payload => {
        setAiPausedPhones(prev => { const n = new Set(prev); n.delete(payload.old.phone); return n })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_labels' }, payload => {
        if (payload.new) setChatLabels(prev => ({ ...prev, [payload.new.phone]: payload.new.label }))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  useEffect(() => {
    activeChatPhoneRef.current = activeChatPhone
  }, [activeChatPhone])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Messenger-style: track keyboard height, chat overlay uses bottom:kbH
  useEffect(() => {
    if (tab !== 'chat' || !activeChatPhone) { setChatKbH(0); return }
    function update() {
      const vv = window.visualViewport
      setChatKbH(Math.max(0, window.innerHeight - (vv?.height ?? window.innerHeight)))
    }
    update()
    window.visualViewport?.addEventListener('resize', update)
    return () => window.visualViewport?.removeEventListener('resize', update)
  }, [tab, activeChatPhone])

  function showToast(msg, type = '') {
    const id = Date.now() + Math.random()
    setToast(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToast(prev => prev.filter(t => t.id !== id)), 3000)
  }

  function showConfirm(message, onConfirm) {
    setConfirmModal({ message, onConfirm })
  }

  function resetQo() {
    setQoBagMode('items'); setQoSelected({}); setQoBagPacks([{}]); setQoStep(1); setQoQnum(null); setQoName('')
  }

  function openEditOrder(o) {
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    const itemMap = {}
    items.forEach(it => { if (it.qty > 0) itemMap[it.menuIdx] = it.qty })
    setEditItems(itemMap)
    setEditOrder(o)
  }

  async function saveEditOrder() {
    setEditSaving(true)
    try {
      const oldItems = typeof editOrder.items === 'string' ? JSON.parse(editOrder.items) : editOrder.items || []
      const oldMap = {}
      oldItems.forEach(it => { oldMap[it.menuIdx] = it.qty })
      const newItems = Object.entries(editItems)
        .filter(([, qty]) => qty > 0)
        .map(([i, qty]) => ({ menuIdx: +i, name: menus[+i]?.lo || '', qty, price: prices[+i] || 0, sub: (prices[+i] || 0) * qty }))
      if (newItems.length === 0) { alert('ຕ້ອງມີສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການ'); setEditSaving(false); return }
      const newTotal = newItems.reduce((s, it) => s + it.sub, 0)
      const stockKey = editOrder.type === 'online' ? 'stock_online' : 'stock_shop'
      const stockArr = editOrder.type === 'online' ? [...stockOnline] : [...stockShop]
      const allIdxes = new Set([...Object.keys(oldMap), ...Object.keys(editItems)].map(Number))
      allIdxes.forEach(idx => {
        const diff = (editItems[idx] || 0) - (oldMap[idx] || 0)
        stockArr[idx] = Math.max(0, (stockArr[idx] || 0) - diff)
      })
      await supabase.from('orders').update({ items: JSON.stringify(newItems), total: newTotal }).eq('id', editOrder.id)
      await saveConfig(stockKey, stockArr)
      setOrders(prev => prev.map(o => o.id === editOrder.id ? { ...o, items: JSON.stringify(newItems), total: newTotal } : o))
      setEditOrder(null)
      showToast(`✏️ #${String(editOrder.qnum).padStart(4, '0')} ແກ້ໄຂແລ້ວ`, 'green')
    } catch (e) { alert('❌ ' + (e.message || 'error')) }
    finally { setEditSaving(false) }
  }

  function qoShowPackToast(msg) {
    setQoPackToast(msg); setTimeout(() => setQoPackToast(null), 2000)
  }

  function qoAddItemToBag(bagIdx, menuIdx) {
    if (qoBagMode === 'bags') {
      const total = qoBagPacks.reduce((s, b) => s + (b[menuIdx] || 0), 0)
      if (total >= (stockShop[menuIdx] || 0)) { qoShowPackToast('ໝົດ · Out of stock'); return }
    } else {
      const packed = qoBagPacks.reduce((s, b) => s + (b[menuIdx] || 0), 0)
      if (packed >= (qoSelected[menuIdx] || 0)) { qoShowPackToast('ຄົບແລ້ວ'); return }
    }
    setQoBagPacks(prev => { const a = prev.map(b => ({ ...b })); a[bagIdx] = { ...a[bagIdx], [menuIdx]: (a[bagIdx][menuIdx] || 0) + 1 }; return a })
  }

  function qoRemoveItemFromBag(bagIdx, menuIdx) {
    setQoBagPacks(prev => {
      const a = prev.map(b => ({ ...b }))
      const cur = a[bagIdx][menuIdx] || 0
      if (cur <= 1) delete a[bagIdx][menuIdx]; else a[bagIdx][menuIdx] = cur - 1
      return a
    })
  }

  function qoHandleQuickBag(id) {
    if (id === 'single') {
      const bag = {}; Object.entries(qoSelected).forEach(([idx, qty]) => { bag[idx] = qty }); setQoBagPacks([bag])
    } else if (id === 'bytype') {
      const packs = Object.entries(qoSelected).map(([idx, qty]) => ({ [idx]: qty })); setQoBagPacks(packs.length ? packs : [{}])
    } else {
      const packs = []; Object.entries(qoSelected).forEach(([idx, qty]) => { for (let i = 0; i < qty; i++) packs.push({ [idx]: 1 }) }); setQoBagPacks(packs.length ? packs : [{}])
    }
  }

  async function submitQuickOrder(paymentMethod) {
    setQoSubmitting(true)
    try {
      const qnumData = await nextWalkinQnum()
      const effSel = qoBagMode === 'bags'
        ? qoBagPacks.reduce((acc, bag) => { Object.entries(bag).forEach(([idx, qty]) => { if (qty > 0) acc[idx] = (acc[idx] || 0) + qty }); return acc }, {})
        : qoSelected
      const items = Object.entries(effSel).map(([i, qty]) => ({ menuIdx: +i, name: menus[+i]?.lo || '', qty, price: prices[+i] || 0, sub: (prices[+i] || 0) * qty }))
      const packingLabel = qoBagPacks.map((b, i) => {
        const t = Object.entries(b).filter(([, q]) => q > 0).map(([idx, q]) => `${menus[+idx]?.lo || ''} ×${q}`).join(', ')
        return t ? `ຖົງ ${i + 1}: ${t}` : null
      }).filter(Boolean).join(' | ')
      const total = Object.entries(effSel).reduce((s, [i, q]) => s + (prices[+i] || 0) * q, 0)
      const { error } = await supabase.from('orders').insert({
        qnum: qnumData, type: 'walkin', status: 'confirmed',
        items: JSON.stringify(items), total, bag_label: packingLabel,
        done: false, cancelled: false, paid: true, payment_method: paymentMethod,
        ...(qoName.trim() ? { customer: JSON.stringify({ name: qoName.trim() }) } : {}),
      })
      if (error) throw error
      const newStock = [...stockShop]
      Object.entries(effSel).forEach(([i, qty]) => { newStock[+i] = Math.max(0, (newStock[+i] || 0) - qty) })
      await supabase.from('shop_config').upsert({ key: 'stock_shop', value: JSON.stringify(newStock) })
      setQoQnum(qnumData); setQoStep(3)
      showToast(`✅ ຄິວ ${String(qnumData).padStart(4, '0')} · ${paymentMethod === 'cash' ? '💵 ສດ' : '📱 ໂອນ'}`, 'green')
      if (settings.autoprintOn) {
        const printObj = {
          qnum: qnumData, type: 'walkin', items, total,
          bag_label: packingLabel || null, payment_method: paymentMethod,
          customer: qoName.trim() ? JSON.stringify({ name: qoName.trim() }) : null,
        }
        setTimeout(() => smartPrint(printObj), 300)
      }
    } catch (e) { alert('❌ ' + (e.message || 'error')) }
    finally { setQoSubmitting(false) }
  }

  async function markPaid(o, method) {
    setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, paid: true, payment_method: method } : ord))
    await supabase.from('orders').update({ paid: true, payment_method: method }).eq('id', o.id)
    setPayingId(null)
    showToast(`💰 #${String(o.qnum).padStart(4,'0')} ຮັບເງິນແລ້ວ`, 'green')
  }

  function announce(qnum) {
    saveConfig('current_queue', String(qnum))
    if (!settings.soundOn) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(`หมายเลข ${String(qnum).padStart(4, '0')} รับสินค้าได้เลยค่ะ`)
    const v = voicesRef.current.find(v => v.lang === 'th-TH') || voicesRef.current[0]
    if (v) u.voice = v
    u.lang = 'th-TH'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  function playChatSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.16)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5)
    } catch (_) {}
  }

  async function loadAiPausedPhones() {
    if (!supabase) return
    const { data } = await supabase.from('ai_chat_paused').select('phone')
    if (data) setAiPausedPhones(new Set(data.map(r => r.phone)))
  }

  async function toggleAiForPhone(phone) {
    if (!supabase) return
    const isPaused = aiPausedPhones.has(phone)
    if (isPaused) {
      await supabase.from('ai_chat_paused').delete().eq('phone', phone)
      setAiPausedPhones(prev => { const n = new Set(prev); n.delete(phone); return n })
    } else {
      await supabase.from('ai_chat_paused').upsert({ phone })
      setAiPausedPhones(prev => new Set([...prev, phone]))
    }
  }

  async function loadChatConvos() {
    if (!supabase) return
    loadAiPausedPhones()
    const [{ data }, { data: labelsData }] = await Promise.all([
      supabase.from('messages').select('*').order('created_at', { ascending: false }),
      supabase.from('chat_labels').select('phone, label'),
    ])
    const labelsMap = {}
    labelsData?.forEach(r => { labelsMap[r.phone] = r.label })
    setChatLabels(labelsMap)
    if (!data) return
    const map = {}
    data.forEach(m => {
      if (!map[m.phone]) map[m.phone] = { phone: m.phone, name: m.name, msgs: [] }
      map[m.phone].msgs.push(m)
    })
    const convos = Object.values(map).map(c => ({
      phone: c.phone, name: c.name,
      lastMsg: c.msgs[0]?.text || '',
      lastAt: c.msgs[0]?.created_at || '',
      unread: c.msgs.filter(m => m.sender === 'customer' && !m.read_by_staff).length,
    }))
    setChatConvos(convos)
    setUnreadChat(convos.reduce((s, c) => s + c.unread, 0))
  }

  async function openConvo(phone) {
    setActiveChatPhone(phone)
    if (!supabase) return
    const { data } = await supabase.from('messages').select('*').eq('phone', phone)
      .order('created_at', { ascending: true })
    if (data) setChatMessages(data)
    await supabase.from('messages').update({ read_by_staff: true })
      .eq('phone', phone).eq('sender', 'customer').eq('read_by_staff', false)
    setChatConvos(prev => prev.map(c => c.phone === phone ? { ...c, unread: 0 } : c))
    setUnreadChat(prev => {
      const convo = chatConvos.find(c => c.phone === phone)
      return Math.max(0, prev - (convo?.unread || 0))
    })
  }

  async function sendStaffMsg() {
    if (!chatInput.trim() || chatSending || !activeChatPhone || !supabase) return
    const convo = chatConvos.find(c => c.phone === activeChatPhone)
    setChatSending(true)
    await supabase.from('messages').insert({
      phone: activeChatPhone, name: convo?.name || '',
      sender: 'staff', text: chatInput.trim(),
    })
    setChatInput('')
    setChatSending(false)
  }

  async function loadAll() {
    await Promise.all([loadOrders(), loadConfig()])
    setLoading(false)
  }

  async function loadOrders() {
    if (!supabase) return
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!data) return
    setOrders(prev => {
      const localMap = new Map(prev.map(o => [o.id, o]))
      const merged = data.map(server => {
        const local = localMap.get(server.id)
        if (!local) return server
        // Keep local if it's "more final" — prevents polling from reverting optimistic updates
        if (local.done && !server.done) return local
        if (local.cancelled && !server.cancelled) return local
        if (local.status === 'confirmed' && server.status === 'pending') return local
        if (local.status === 'rejected' && server.status !== 'rejected') return local
        return server
      })
      // Add any local-only orders not yet in server response
      prev.forEach(o => { if (!data.some(s => s.id === o.id)) merged.push(o) })
      return merged
    })
  }

  const DEFAULT_MENUS = [
    { lo: 'ຊາລາເປົາໝູສັບ', en: 'Pork Steamed Bun' },
    { lo: 'ໝັນໂຖ Dark Chocolate', en: 'Dark Choc Mantou' },
    { lo: 'ໝັນໂຖ Matcha', en: 'Matcha Mantou' },
    { lo: 'ເມນູ 4', en: 'Menu 4' },
    { lo: 'ເມນູ 5', en: 'Menu 5' },
    { lo: 'ເມນູ 6', en: 'Menu 6' },
    { lo: 'ເມນູ 7', en: 'Menu 7' },
    { lo: 'ເມນູ 8', en: 'Menu 8' },
    { lo: 'ເມນູ 9', en: 'Menu 9' },
    { lo: 'ເມນູ 10', en: 'Menu 10' },
  ]

  async function loadConfig() {
    if (!supabase) return
    const { data, error } = await supabase.from('shop_config').select('*')
    if (error) { console.error('loadConfig error:', error); return }
    const cfg = {}
    if (data) data.forEach(r => { cfg[r.key] = r.value })

    // ใช้ค่า default ถ้า Supabase ยังว่างอยู่
    const loadedMenus = cfg.menus ? JSON.parse(cfg.menus) : DEFAULT_MENUS
    const loadedPrices = cfg.prices ? JSON.parse(cfg.prices) : new Array(loadedMenus.length).fill(15000)
    const loadedCosts = cfg.costs ? JSON.parse(cfg.costs) : new Array(loadedMenus.length).fill(0)
    const loadedStockTotal = cfg.stock_total ? JSON.parse(cfg.stock_total) : new Array(loadedMenus.length).fill(0)
    const loadedStockShop = cfg.stock_shop ? JSON.parse(cfg.stock_shop) : new Array(loadedMenus.length).fill(0)
    const loadedStockOnline = cfg.stock_online ? JSON.parse(cfg.stock_online) : new Array(loadedMenus.length).fill(0)

    setMenus(loadedMenus)
    setPrices(loadedPrices)
    setCosts(loadedCosts)
    setStockTotal(loadedStockTotal)
    setStockShop(loadedStockShop)
    setStockOnline(loadedStockOnline)
    // ตรวจสต็อกต่ำหลังโหลด
    setTimeout(() => checkLowStock(loadedStockShop), 500)
    if (cfg.menu_images) setImages(JSON.parse(cfg.menu_images))
    if (cfg.qr_image) setQrImage(cfg.qr_image)
    if (cfg.shop_info) {
      const info = JSON.parse(cfg.shop_info)
      setShopInfo(prev => ({ ...prev, ...info }))
      setReceiptDraft(prev => ({ ...prev, ...info, printerWidth: info.printerWidth || 384 }))
    }
    // Fix stale closure: use functional update for settings
    if (cfg.settings) setSettings(prev => ({ ...prev, ...JSON.parse(cfg.settings) }))
    if (cfg.branches) setBranches(JSON.parse(cfg.branches))
    if (cfg.staff_pin) setStaffPin(cfg.staff_pin)
    if (cfg.profit_pin) setProfitPin(cfg.profit_pin)
    if (cfg.walkin_code) setWalkinCode(cfg.walkin_code)
    if (cfg.blocked_ips) try { setBlockedIps(JSON.parse(cfg.blocked_ips)) } catch (_) {}
    if (cfg.blocked_fp) try { setBlockedFp(JSON.parse(cfg.blocked_fp)) } catch (_) {}

    // ถ้ายังไม่มีข้อมูลใน Supabase ให้ save default ขึ้นไปก่อน
    if (!cfg.menus) {
      await supabase.from('shop_config').upsert([
        { key: 'menus', value: JSON.stringify(DEFAULT_MENUS) },
        { key: 'prices', value: JSON.stringify(loadedPrices) },
        { key: 'stock_total', value: JSON.stringify(loadedStockTotal) },
        { key: 'stock_shop', value: JSON.stringify(loadedStockShop) },
        { key: 'stock_online', value: JSON.stringify(loadedStockOnline) },
        { key: 'next_queue', value: '0' },
      ])
    }
  }

  async function saveConfig(key, value) {
    await supabase.from('shop_config').upsert(
      { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
      { onConflict: 'key' }
    )
  }

  // ─── Quick Order computed ───
  const qoEffSel = qoBagMode === 'bags'
    ? qoBagPacks.reduce((acc, bag) => { Object.entries(bag).forEach(([idx, qty]) => { if (qty > 0) acc[idx] = (acc[idx] || 0) + qty }); return acc }, {})
    : qoSelected
  const qoTotalItems = Object.values(qoEffSel).reduce((s, q) => s + q, 0)
  const qoTotalPrice = Object.entries(qoEffSel).reduce((s, [i, q]) => s + (prices[+i] || 0) * q, 0)

  // ─── Orders ───
  const filteredOrders = orders.filter(o => {
    if (filter !== 'all' && o.type !== filter) return false
    if (!search.trim()) return true
    const q = search.trim().toLowerCase().replace(/\s+/g, ' ')
    const qnum = String(o.qnum || '')
    const qnumPad = qnum.padStart(4, '0')
    if (qnum === q || qnumPad === q || qnum.includes(q)) return true
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    if (items.some(it => (it.name || '').toLowerCase().includes(q))) return true
    if (o.customer) {
      const c = typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer
      if ((c.name || '').toLowerCase().replace(/\s+/g, ' ').includes(q)) return true
      if ((c.phone || '').replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))) return true
    }
    return false
  })
  const activeOrders = filteredOrders.filter(o => !o.done && !o.cancelled && o.status !== 'rejected' && o.status !== 'blocked')
  const archivedOrders = filteredOrders.filter(o => o.done || o.cancelled || o.status === 'rejected' || o.status === 'blocked')

  // ─── Customer Search ───
  const customerSearchResults = customerSearch.trim()
    ? orders.filter(o => {
        const q = customerSearch.trim().toLowerCase().replace(/\s+/g, ' ')
        const c = (() => { try { return JSON.parse(o.customer || '{}') } catch { return {} } })()
        const qnum = String(o.qnum || '')
        const qnumPad = qnum.padStart(4, '0')
        if (qnum === q || qnumPad === q || qnum.includes(q)) return true
        if ((c.name || '').toLowerCase().replace(/\s+/g, ' ').includes(q)) return true
        if ((c.phone || '').replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))) return true
        return false
      })
    : []

  const waiting = orders.filter(o => !o.done && !o.cancelled && o.status !== 'rejected' && o.status !== 'blocked').length
  const done = orders.filter(o => o.done).length
  const pendingOnline = orders.filter(o => o.type === 'online' && o.status === 'pending' && !o.cancelled).length

  const todayStr = new Date().toISOString().split('T')[0]
  const todayMenuCount = {}
  orders.filter(o => !o.cancelled && o.status !== 'rejected' && o.status !== 'blocked').forEach(o => {
    const oDate = new Date(o.created_at).toISOString().split('T')[0]
    if (oDate !== todayStr) return
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    items.forEach(it => { todayMenuCount[it.menuIdx] = (todayMenuCount[it.menuIdx] || 0) + it.qty })
  })
  const todayTotalItems = Object.values(todayMenuCount).reduce((s, v) => s + v, 0)

  const pendingPreorderCount = {}
  orders.filter(o => o.type === 'online' && !o.done && !o.cancelled && o.status !== 'rejected' && o.status !== 'blocked').forEach(o => {
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    items.forEach(it => { pendingPreorderCount[it.menuIdx] = (pendingPreorderCount[it.menuIdx] || 0) + it.qty })
  })
  const pendingPreorderTotal = Object.values(pendingPreorderCount).reduce((s, v) => s + v, 0)
  const LOW_STOCK = 5
  const lowStockMenus = menus.map((m, i) => ({ name: m.lo, shop: stockShop[i] || 0, online: stockOnline[i] || 0 }))
    .filter(m => m.shop <= LOW_STOCK || m.online <= LOW_STOCK)

  async function doneOrder(o) {
    const doneAt = new Date().toISOString()
    // Optimistic update — moves card to archive immediately without waiting for realtime
    setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, done: true, done_at: doneAt } : ord))
    await supabase.from('orders').update({ done: true, done_at: doneAt }).eq('id', o.id)
    announce(o.qnum)
    showToast(`✅ ຄິວ ${String(o.qnum).padStart(4,'0')} Done`, 'green')
    if (settings.autoprintOn) {
      setTimeout(() => smartPrint(o), 300)
    }
  }

  async function confirmOrder(o) {
    const doneAt = new Date().toISOString()
    // Optimistic update — confirm + done in one step, moves to archive immediately
    setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, status: 'confirmed', done: true, done_at: doneAt } : ord))
    await supabase.from('orders').update({ status: 'confirmed', done: true, done_at: doneAt }).eq('id', o.id)
    announce(o.qnum)
    showToast(`✅ ຢືນຢັນ #${String(o.qnum).padStart(4,'0')}`, 'green')
    if (settings.autoprintOn) setTimeout(() => smartPrint(o), 300)
  }

  async function confirmAllPending() {
    const toConfirm = orders.filter(o =>
      o.type === 'online' && o.status === 'pending' && !o.done && !o.cancelled && o.slip_url
    )
    if (toConfirm.length === 0) { showToast('ບໍ່ມີ preorder ທີ່ຍືນຢັນໄດ້', 'orange'); return }
    showConfirm(`ຢືນຢັນ Preorder ທັງໝົດ ${toConfirm.length} ໃບ ທີ່ມີສລິບແລ້ວ?`, async () => {
      const doneAt = new Date().toISOString()
      const ids = toConfirm.map(o => o.id)
      setOrders(prev => prev.map(o =>
        ids.includes(o.id) ? { ...o, status: 'confirmed', done: true, done_at: doneAt } : o
      ))
      await supabase.from('orders').update({ status: 'confirmed', done: true, done_at: doneAt }).in('id', ids)
      showToast(`✅ ຢືນຢັນ ${toConfirm.length} ໃບ`, 'green')
      if (settings.autoprintOn) toConfirm.forEach((o, i) => setTimeout(() => smartPrint(o), 400 * i))
    })
  }

  async function confirmBatch() {
    if (batchSelected.size === 0) { showToast('ກະລຸນາເລືອກລາຍການ', 'orange'); return }
    const toConfirm = orders.filter(o => batchSelected.has(o.id))
    const doneAt = new Date().toISOString()
    const ids = toConfirm.map(o => o.id)
    setOrders(prev => prev.map(o =>
      ids.includes(o.id) ? { ...o, status: 'confirmed', done: true, done_at: doneAt } : o
    ))
    await supabase.from('orders').update({ status: 'confirmed', done: true, done_at: doneAt }).in('id', ids)
    showToast(`✅ ຢືນຢັນ ${toConfirm.length} ໃບ`, 'green')
    setBatchSelected(new Set())
    setBatchOpen(false)
    if (settings.autoprintOn) toConfirm.forEach((o, i) => setTimeout(() => smartPrint(o), 400 * i))
  }

  async function confirmWalkin(o) {
    setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, status: 'confirmed' } : ord))
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', o.id)
    showToast(`🍳 ສົ່ງຄົວ #${String(o.qnum).padStart(4,'0')}`, 'green')
    if (settings.autoprintOn) setTimeout(() => smartPrint(o), 300)
  }

  function rejectOrder(o) {
    showConfirm('ຢືນຢັນການຍົກເລີກອໍເດີນີ້ບໍ?', async () => {
      setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, status: 'rejected' } : ord))
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
      // Fetch fresh stock from DB to avoid stale closure
      const { data: row } = await supabase.from('shop_config').select('value').eq('key', 'stock_online').single()
      const freshStock = row ? JSON.parse(row.value) : [...stockOnline]
      items.forEach(it => { freshStock[it.menuIdx] = (freshStock[it.menuIdx] || 0) + it.qty })
      await saveConfig('stock_online', freshStock)
      await supabase.from('orders').update({ status: 'rejected' }).eq('id', o.id)
      showToast('✕ ປະຕິເສດ', 'orange')
    })
  }

  function cancelOrder(o) {
    showConfirm('ຢືນຢັນການຍົກເລີກອໍເດີນີ້ບໍ?', async () => {
      setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, cancelled: true } : ord))
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
      const stockKey = o.type === 'online' ? 'stock_online' : 'stock_shop'
      // Fetch fresh stock from DB to avoid stale closure
      const { data: row } = await supabase.from('shop_config').select('value').eq('key', stockKey).single()
      const fallback = o.type === 'online' ? stockOnline : stockShop
      const freshStock = row ? JSON.parse(row.value) : [...fallback]
      items.forEach(it => { freshStock[it.menuIdx] = (freshStock[it.menuIdx] || 0) + it.qty })
      await saveConfig(stockKey, freshStock)
      await supabase.from('orders').update({ cancelled: true }).eq('id', o.id)
      showToast('ຍົກເລີກ', 'orange')
    })
  }

  async function blockUser(o) {
    const sec = (() => { try { const c = typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer; return c?.security || null } catch { return null } })()
    if (!sec) return
    const ip = sec.ip?.ip || ''
    const fp = (sec.tz || '') + '|' + (sec.lang || '')
    const newIps = ip && !blockedIps.includes(ip) ? [...blockedIps, ip] : blockedIps
    const newFp = fp.length > 1 && !blockedFp.includes(fp) ? [...blockedFp, fp] : blockedFp
    setBlockedIps(newIps)
    setBlockedFp(newFp)
    await supabase.from('shop_config').upsert([
      { key: 'blocked_ips', value: JSON.stringify(newIps) },
      { key: 'blocked_fp', value: JSON.stringify(newFp) },
    ], { onConflict: 'key' })
    await supabase.from('orders').update({ status: 'blocked' }).eq('id', o.id)
    setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, status: 'blocked' } : ord))
    showToast('🚫 ບ໋ອກຜູ້ໃຊ້ແລ້ວ', 'orange')
  }

  async function undoOrder(id, field) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, [field]: false } : o))
    await supabase.from('orders').update({ [field]: false }).eq('id', id)
  }

  async function verifySlip(o) {
    setSlipVerify(prev => ({ ...prev, [o.id]: { loading: true } }))
    try {
      const res = await fetch('/api/verify-slip', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slipUrl: o.slip_url, expectedAmount: o.total }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'ເກີດຂໍ້ຜິດພາດ')
      setSlipVerify(prev => ({ ...prev, [o.id]: { loading: false, result: data.result } }))
    } catch (err) {
      setSlipVerify(prev => ({ ...prev, [o.id]: { loading: false, error: err.message } }))
    }
  }

  async function deleteSelectedSlips() {
    if (selectedSlipIds.size === 0) return
    setDeletingSlips(true)
    let deleted = 0
    for (const id of selectedSlipIds) {
      const o = orders.find(ord => ord.id === id)
      if (!o?.slip_url) continue
      try {
        const marker = '/object/public/bcb - upload/'
        const idx = o.slip_url.indexOf(marker)
        if (idx !== -1) {
          const filePath = decodeURIComponent(o.slip_url.slice(idx + marker.length).split('?')[0])
          await supabase.storage.from('bcb - upload').remove([filePath])
        }
        await supabase.from('orders').update({ slip_url: null }).eq('id', id)
        setOrders(prev => prev.map(ord => ord.id === id ? { ...ord, slip_url: null } : ord))
        deleted++
      } catch (e) {
        console.error('deleteSlip error:', e)
      }
    }
    setSelectedSlipIds(new Set())
    setDeletingSlips(false)
    showToast(`🗑 ລຶບສລິບ ${deleted} ໃບ ✅`, 'green')
  }

  // ─── Menus ───
  async function saveMenus() {
    const newMenus = menus.map((m, i) => ({
      ...m,
      lo: document.getElementById(`mn-${i}`)?.value || m.lo,
    }))
    const newPrices = menus.map((_, i) => parseInt(document.getElementById(`mp-${i}`)?.value || 0) || 0)
    const newCosts = menus.map((_, i) => parseInt(document.getElementById(`mc-${i}`)?.value || 0) || 0)
    await saveConfig('menus', newMenus)
    await saveConfig('prices', newPrices)
    await saveConfig('costs', newCosts)
    setCosts(newCosts)
    showToast('ບັນທຶກເມນູ ✅', 'green')
  }

  function readCurrentMenuInputs() {
    const m = menus.map((mn, i) => ({ ...mn, lo: document.getElementById(`mn-${i}`)?.value || mn.lo }))
    const p = menus.map((_, i) => parseInt(document.getElementById(`mp-${i}`)?.value || 0) || 0)
    const c = menus.map((_, i) => parseInt(document.getElementById(`mc-${i}`)?.value || 0) || 0)
    return { m, p, c }
  }

  async function addMenu() {
    const { m, p, c } = readCurrentMenuInputs()
    const n = m.length + 1
    const newMenus = [...m, { lo: `ເມນູ ${n}`, en: `Menu ${n}` }]
    const newPrices = [...p, 0]
    const newCosts = [...c, 0]
    setMenus(newMenus); setPrices(newPrices); setCosts(newCosts)
    setStockTotal(prev => [...prev, 0])
    setStockShop(prev => [...prev, 0])
    setStockOnline(prev => [...prev, 0])
    await Promise.all([
      saveConfig('menus', newMenus), saveConfig('prices', newPrices), saveConfig('costs', newCosts),
      saveConfig('stock_total', [...stockTotal, 0]),
      saveConfig('stock_shop', [...stockShop, 0]),
      saveConfig('stock_online', [...stockOnline, 0]),
    ])
    showToast('ເພີ່ມເມນູ ✅', 'green')
  }

  async function removeMenu(idx) {
    if (menus.length <= 1) return
    const { m, p, c } = readCurrentMenuInputs()
    const newMenus = m.filter((_, i) => i !== idx)
    const newPrices = p.filter((_, i) => i !== idx)
    const newCosts = c.filter((_, i) => i !== idx)
    const newST = stockTotal.filter((_, i) => i !== idx)
    const newSS = stockShop.filter((_, i) => i !== idx)
    const newSO = stockOnline.filter((_, i) => i !== idx)
    setMenus(newMenus); setPrices(newPrices); setCosts(newCosts)
    setStockTotal(newST); setStockShop(newSS); setStockOnline(newSO)
    const newImgs = { ...images }; delete newImgs[idx]
    const reindexed = {}
    Object.entries(newImgs).forEach(([k, v]) => { const ki = +k; reindexed[ki > idx ? ki - 1 : ki] = v })
    setImages(reindexed)
    await Promise.all([
      saveConfig('menus', newMenus), saveConfig('prices', newPrices), saveConfig('costs', newCosts),
      saveConfig('stock_total', newST), saveConfig('stock_shop', newSS), saveConfig('stock_online', newSO),
      saveConfig('menu_images', reindexed),
    ])
    showToast('ລຶບເມນູ ✅', 'green')
  }

  function compressImage(file, maxW = 800, quality = 0.8) {
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

  async function uploadToR2(file, path) {
    const form = new FormData()
    form.append('file', file, path.split('/').pop())
    form.append('path', path)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    return res.json()
  }

  async function uploadMenuImg(e, i) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImgPreviews(prev => ({ ...prev, [i]: ev.target.result }))
    reader.readAsDataURL(file)
    const compressed = await compressImage(file, 800, 0.8)
    const data = await uploadToR2(compressed, `menu/${i}.jpg`)
    if (!data.success) { showToast('❌ ' + (data.error || 'ອັບໂຫລດຜິດ'), 'red'); setImgPreviews(prev => { const n = {...prev}; delete n[i]; return n }); return }
    const newImg = { ...images, [i]: data.url + '?t=' + Date.now() }
    setImages(newImg)
    setImgPreviews(prev => { const n = {...prev}; delete n[i]; return n })
    await saveConfig('menu_images', newImg)
    showToast('ອັບໂຫລດຮູບ ✅', 'green')
  }

  async function removeMenuImg(i) {
    const newImg = { ...images }
    delete newImg[i]
    await saveConfig('menu_images', newImg)
    showToast('ລຶບຮູບ', 'orange')
  }

  // ─── QR ───
  async function uploadQR(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setQrPreview(ev.target.result)
    reader.readAsDataURL(file)
    const data = await uploadToR2(file, 'qr/payment.jpg')
    if (!data.success) { showToast('❌ ' + (data.error || 'ຜິດ'), 'red'); setQrPreview(null); return }
    const qrUrl = data.url + '?t=' + Date.now()
    setQrImage(qrUrl)
    setQrPreview(null)
    await saveConfig('qr_image', qrUrl)
    showToast('ອັບໂຫລດ QR ✅', 'green')
  }

  // ─── Shop Info + Logo ───
  async function saveShopInfo() {
    await saveConfig('shop_info', receiptDraft)
    setShopInfo(receiptDraft)
    showToast('ບັນທຶກ ✅', 'green')
  }

  async function generatePreview(draft = receiptDraft) {
    setPreviewLoading(true)
    const sampleItems = menus.slice(0, 2).map((m, i) => ({
      menuIdx: i, qty: i + 1,
      name: typeof m === 'string' ? m : (m.lo || m.en || 'ເຂົ້າ'),
      sub: (i + 1) * 25000,
    }))
    const mockOrder = { qnum: 42, items: sampleItems, total: sampleItems.reduce((s, it) => s + it.sub, 0), created_at: new Date().toISOString(), bag_label: null, customer: null }
    try {
      const canvas = await renderReceiptCanvas(mockOrder, 360, draft)
      setReceiptPreviewUrl(canvas.toDataURL('image/png'))
    } catch { }
    setPreviewLoading(false)
  }

  async function uploadLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
    const data = await uploadToR2(file, 'shop/logo.jpg')
    if (!data.success) { showToast('❌ ' + (data.error || 'ອັບໂຫລດຜິດ'), 'red'); setLogoPreview(null); return }
    const newInfo = { ...receiptDraft, logo: data.url + '?t=' + Date.now() }
    setShopInfo(newInfo); setReceiptDraft(newInfo)
    setLogoPreview(null)
    await saveConfig('shop_info', newInfo)
    showToast('ອັບໂຫລດໂລໂກ້ ✅', 'green')
  }

  async function removeLogo() {
    const newInfo = { ...receiptDraft, logo: '' }
    await saveConfig('shop_info', newInfo)
    setShopInfo(newInfo); setReceiptDraft(newInfo)
    showToast('ລຶບໂລໂກ້', 'orange')
  }

  // ─── Branches ───
  function updateBranch(idx, field, val) {
    setBranches(prev => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b))
  }
  async function saveBranches() {
    await saveConfig('branches', branches)
    showToast('ບັນທຶກສາຂາ ✅', 'green')
  }

  // ─── Export / Import ───
  async function exportData() {
    try {
      const [ordersRes, configRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('shop_config').select('*'),
      ])
      const exportObj = {
        exported_at: new Date().toISOString(),
        orders: ordersRes.data || [],
        shop_config: configRes.data || [],
      }
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bcb_backup_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Export ✅', 'green')
    } catch (e) {
      showToast('❌ Export ຜິດ: ' + e.message, 'red')
    }
  }

  async function importData(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!confirm('⚠️ ຈະຂຽນທັບຂໍ້ມູນທັງໝົດ ຕ້ອງການດຳເນີນການຕໍ່ໄຫມ?')) return
        // Import shop_config
        if (data.shop_config?.length) {
          await supabase.from('shop_config').upsert(data.shop_config)
        }
        // Import orders
        if (data.orders?.length) {
          await supabase.from('orders').upsert(data.orders)
        }
        showToast('Import ✅ ກຳລັງໂຫຼດໃໝ່...', 'green')
        setTimeout(() => window.location.reload(), 1500)
      } catch (err) {
        showToast('❌ ໄຟລ໌ບໍ່ຖືກຕ້ອງ', 'red')
      }
    }
    reader.readAsText(file)
  }

  // ─── Low Stock Alert ───
  const lowStockAlertedRef = useRef({})
  function checkLowStock(shopArr) {
    menus.forEach((m, i) => {
      const sh = shopArr[i] || 0
      const key = `sh_${i}`
      if (sh === 0 && lowStockAlertedRef.current[key] !== 'out') {
        lowStockAlertedRef.current[key] = 'out'
        showToast(`⚠️ ${m.lo} ໝົດ (ຮ້ານ)!`, 'red')
      } else if (sh > 0 && sh <= 5 && lowStockAlertedRef.current[key] !== 'low') {
        lowStockAlertedRef.current[key] = 'low'
        showToast(`⚠️ ${m.lo} ໃກ້ໝົດ (ຮ້ານ)`, 'orange')
      } else if (sh > 5) {
        lowStockAlertedRef.current[key] = null
      }
    })
  }

  // ─── Auto slip verification ───
  useEffect(() => {
    const toVerify = orders.filter(o =>
      o.type === 'online' &&
      o.status === 'pending' &&
      !o.done && !o.cancelled &&
      o.slip_url &&
      !slipVerify[o.id] &&
      !slipVerifyingRef.current.has(o.id)
    )
    for (const o of toVerify) {
      slipVerifyingRef.current.add(o.id)
      verifySlip(o)
    }
  }, [orders])

  // ─── Bluetooth Printer (ESC/POS) ───
  const btCharRef = useRef(null)
  const [btConnected, setBtConnected] = useState(false)
  const hasBluetooth = typeof navigator !== 'undefined' && 'bluetooth' in navigator

  // ─── USB Printer (WebUSB / ESC/POS) ───
  const usbDeviceRef = useRef(null)
  const usbEndpointRef = useRef(null)
  const [usbConnected, setUsbConnected] = useState(false)
  const hasUsb = typeof navigator !== 'undefined' && 'usb' in navigator

  async function connectUsbPrinter() {
    if (!hasUsb) { showToast('❌ ໃຊ້ Chrome ສຳລັບ USB', 'red'); return }
    try {
      showToast('ກຳລັງເຊື່ອມ USB...', 'blue')
      const device = await navigator.usb.requestDevice({ filters: [] })
      await device.open()
      if (device.configuration === null) await device.selectConfiguration(1)
      let endpoint = null
      for (const iface of device.configuration.interfaces) {
        try {
          await device.claimInterface(iface.interfaceNumber)
          for (const ep of iface.alternate.endpoints) {
            if (ep.direction === 'out' && ep.type === 'bulk') {
              endpoint = ep
              break
            }
          }
          if (endpoint) break
        } catch { continue }
      }
      if (!endpoint) { showToast('❌ ບໍ່ພົບ USB endpoint', 'red'); await device.close(); return }
      usbDeviceRef.current = device
      usbEndpointRef.current = endpoint
      setUsbConnected(true)
      showToast(`🖨 USB ${device.productName || 'Printer'} ✅`, 'green')
      device.addEventListener('disconnect', () => {
        usbDeviceRef.current = null
        usbEndpointRef.current = null
        setUsbConnected(false)
        showToast('USB ຕັດການເຊື່ອມ', 'orange')
      })
    } catch (e) {
      if (e.name !== 'NotFoundError') showToast('❌ USB: ' + (e.message || e.name), 'red')
    }
  }

  async function usbPrint(o) {
    if (!usbDeviceRef.current || !usbEndpointRef.current) { printOrder(o); return }
    let data
    const pw = shopInfo.printerWidth || 384
    try {
      const hires = await renderReceiptCanvas(o, pw * 2)
      data = canvasToEscPos(downsampleCanvas(hires, pw))
    } catch { data = buildEscPos(o) }
    const chunkSize = 64
    try {
      for (let i = 0; i < data.length; i += chunkSize) {
        await usbDeviceRef.current.transferOut(usbEndpointRef.current.endpointNumber, data.slice(i, i + chunkSize))
      }
      showToast('ພິມແລ້ວ ✅', 'green')
    } catch { showToast('❌ USB ພິມຜິດ', 'red') }
  }

  async function connectPrinter() {
    if (!hasBluetooth) {
      const ua = navigator.userAgent
      const isIOS = /iPad|iPhone|iPod/.test(ua)
      if (isIOS) showToast('ℹ️ iOS: ໃຊ້ Browser Print ແທນ', 'blue')
      else showToast('❌ ໃຊ້ Chrome/Edge ສຳລັບ Bluetooth', 'red')
      return
    }
    try {
      showToast('ກຳລັງເຊື່ອມຕໍ່...', 'blue')
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        ],
      })
      const server = await device.gatt.connect()
      const services = await server.getPrimaryServices()
      let found = false
      for (const srv of services) {
        try {
          const chars = await srv.getCharacteristics()
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              btCharRef.current = c
              found = true
              break
            }
          }
          if (found) break
        } catch { continue }
      }
      if (!btCharRef.current) { showToast('❌ ບໍ່ພົບ service ພິມ', 'red'); return }
      setBtConnected(true)
      showToast(`🖨 ເຊື່ອມ ${device.name || 'Printer'} ✅`, 'green')
      device.addEventListener('gattserverdisconnected', () => {
        btCharRef.current = null
        setBtConnected(false)
        showToast('Bluetooth ຕັດການເຊື່ອມ', 'orange')
      })
    } catch (e) {
      showToast('❌ ເຊື່ອມບໍ່ໄດ້: ' + (e.message || ''), 'red')
    }
  }

  function buildEscPos(o) {
    const bytes = []
    const ESC = 0x1B, GS = 0x1D, LF = 0x0A
    const enc = s => new TextEncoder().encode(s)
    const write = (s, opts = {}) => {
      bytes.push(ESC, 0x61, opts.align || 0)
      bytes.push(ESC, 0x45, opts.bold ? 1 : 0)
      bytes.push(GS, 0x21, opts.big ? 0x11 : 0)
      enc(s).forEach(b => bytes.push(b))
      bytes.push(LF)
    }
    const line = (c = '-') => {
      bytes.push(ESC, 0x61, 0, ESC, 0x45, 0, GS, 0x21, 0)
      enc(c.repeat(32)).forEach(b => bytes.push(b))
      bytes.push(LF)
    }
    bytes.push(ESC, 0x40) // init
    write(shopInfo.name || 'Basic Chinese Bun', { align: 1, bold: true })
    if (shopInfo.address) write(shopInfo.address, { align: 1 })
    if (shopInfo.phone) write('Tel: ' + shopInfo.phone, { align: 1 })
    line('=')
    write('QUEUE', { align: 1 })
    write(String(o.qnum).padStart(4, '0'), { align: 1, big: true, bold: true })
    write(new Date(o.created_at).toLocaleString('lo-LA'), { align: 1 })
    line()
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    items.forEach(it => {
      const name = it.name.slice(0, 18)
      const price = (it.sub || 0).toLocaleString()
      const row = `${name} x${it.qty}`
      const pad = Math.max(1, 32 - row.length - price.length)
      write(row + ' '.repeat(pad) + price)
    })
    if (o.bag_label) { line(); write('Bag: ' + o.bag_label) }
    line('=')
    const tl = 'TOTAL', tr = (o.total || 0).toLocaleString() + ' LAK'
    write(tl + ' '.repeat(Math.max(1, 32 - tl.length - tr.length)) + tr, { bold: true })
    if (o.customer) {
      const c = typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer
      line()
      write('Customer: ' + c.name)
      write('Phone: ' + c.phone)
      write('Pickup: ' + c.date + ' ' + c.time)
    }
    line('=')
    if (shopInfo.footer) write(shopInfo.footer, { align: 1 })
    bytes.push(LF, LF, LF, LF, GS, 0x56, 0x00) // cut
    return new Uint8Array(bytes)
  }

  async function btPrint(o) {
    if (!btCharRef.current) { printOrder(o); return }
    let data
    let mode = 'bitmap'
    const pw = shopInfo.printerWidth || 384
    try {
      const hires = await renderReceiptCanvas(o, pw * 2)
      data = canvasToEscPos(downsampleCanvas(hires, pw))
      showToast(`🖼 bitmap ${data.length}b`, 'blue')
    } catch (err) {
      mode = 'text'
      showToast('⚠️ text mode: ' + (err?.message || String(err)).slice(0, 40), 'orange')
      data = buildEscPos(o)
    }
    const chunkSize = 200
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      try {
        if (btCharRef.current.properties.writeWithoutResponse) {
          await btCharRef.current.writeValueWithoutResponse(chunk)
        } else {
          await btCharRef.current.writeValue(chunk)
        }
        await new Promise(r => setTimeout(r, 20))
      } catch { showToast('❌ ພິມຜິດ', 'red'); return }
    }
    showToast('ພິມແລ້ວ ✅', 'green')
  }

  function smartPrint(o) {
    if (usbDeviceRef.current && usbEndpointRef.current) usbPrint(o)
    else if (btCharRef.current) btPrint(o)
    else printOrder(o)
  }

  // ─── Stock ───
  function updateStock(type, i, val) {
    const n = Math.max(0, parseInt(val) || 0)
    if (type === 'total') setStockTotal(prev => { const arr = [...prev]; arr[i] = n; return arr })
    else if (type === 'shop') setStockShop(prev => { const arr = [...prev]; arr[i] = n; return arr })
    else setStockOnline(prev => { const arr = [...prev]; arr[i] = n; return arr })
  }

  async function saveStock() {
    await Promise.all([
      saveConfig('stock_total', stockTotal),
      saveConfig('stock_shop', stockShop),
      saveConfig('stock_online', stockOnline),
    ])
    showToast('ບັນທຶກສະຕ໋ອກ ✅', 'green')
  }

  // ─── PIN ───
  function openPinSetting(type) {
    const currentPin = type === 'staff' ? staffPin : profitPin
    setPinMode(`set-${type}`)
    setPinStep(currentPin ? 1 : 2)
    setPinInput('')
    setPinError('')
    setPinNew('')
  }

  function openRemovePin(type) {
    setPinMode(`remove-${type}`)
    setPinStep(1)
    setPinInput('')
    setPinError('')
  }

  function pinModeSubtitle() {
    if (pinMode === 'profit') return 'ໃສ່ລະຫັດ Profit'
    if (pinMode === 'remove-staff' || pinMode === 'remove-profit') return 'ໃສ່ລະຫັດປັດຈຸບັນ'
    if (pinStep === 1) return 'ໃສ່ລະຫັດເກົ່າ'
    if (pinStep === 2) return 'ໃສ່ລະຫັດໃໝ່ (6 ຕົວ)'
    if (pinStep === 3) return 'ໃສ່ລະຫັດໃໝ່ອີກຄັ້ງ'
    return ''
  }

  function handlePinModeSubmit(pin) {
    if (pinMode === 'profit') {
      if (pin === profitPin) {
        setProfitUnlocked(true); setPinMode(null); setPinInput(''); setPinError('')
      } else { setPinError('ລະຫັດຜິດ'); setPinInput('') }
    } else if (pinMode === 'set-staff' || pinMode === 'set-profit') {
      const currentPin = pinMode === 'set-staff' ? staffPin : profitPin
      if (pinStep === 1) {
        if (pin !== currentPin) { setPinError('ລະຫັດເກົ່າຜິດ'); setPinInput(''); return }
        setPinStep(2); setPinInput(''); setPinError('')
      } else if (pinStep === 2) {
        setPinNew(pin); setPinStep(3); setPinInput(''); setPinError('')
      } else if (pinStep === 3) {
        if (pin !== pinNew) { setPinError('ລະຫັດບໍ່ຕົງກັນ'); setPinInput(''); setPinStep(2); setPinNew(''); return }
        const key = pinMode === 'set-staff' ? 'staff_pin' : 'profit_pin'
        saveConfig(key, pin)
        if (pinMode === 'set-staff') setStaffPin(pin)
        else setProfitPin(pin)
        setPinMode(null); setPinInput(''); setPinStep(1); setPinNew(''); setPinError('')
        showToast('ບັນທຶກລະຫັດ ✅', 'green')
      }
    } else if (pinMode === 'remove-staff' || pinMode === 'remove-profit') {
      const currentPin = pinMode === 'remove-staff' ? staffPin : profitPin
      if (pin !== currentPin) { setPinError('ລະຫັດຜິດ'); setPinInput(''); return }
      const key = pinMode === 'remove-staff' ? 'staff_pin' : 'profit_pin'
      saveConfig(key, '')
      if (pinMode === 'remove-staff') { setStaffPin(''); setStaffUnlocked(false) }
      else setProfitPin('')
      setPinMode(null); setPinInput(''); setPinError('')
      showToast('ລຶບລະຫັດ ✅', 'green')
    }
  }

  // ─── Settings toggle ───
  async function toggleSetting(key) {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] }
      // บันทึกขึ้น Supabase ทันที
      saveConfig('settings', newSettings)
      showToast(newSettings[key] ? 'ເປີດ ✅' : 'ປິດ', 'green')
      return newSettings
    })
  }

  // ─── Print ───
  async function renderReceiptCanvas(o, W = 560, infoOverride = null) {
    const si = infoOverride || shopInfo
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    const nameOf = it => menus[it.menuIdx]?.lo || it.name || `Item ${(it.menuIdx||0)+1}`
    const custName = (() => { try { const c = typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer; return c?.name || '' } catch { return '' } })()
    const dt = new Date(o.created_at)
    const dateStr = `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`

    await document.fonts.ready
    const fontName = receiptFontRef.current || 'Noto Sans Lao'
    const s = W / 560
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    const f = (sz, wt = '400') => `${wt} ${Math.round(sz * s)}px '${fontName}', 'Noto Sans Lao', sans-serif`

    // Load logo image with CORS if available
    let logoImg = null
    if (si.logo) {
      logoImg = await new Promise(resolve => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = si.logo
      })
    }

    let y = 0
    const ops = []
    const push = fn => ops.push(fn)
    const dash = () => {
      ctx.lineWidth = Math.max(2, Math.round(2 * s))
      ctx.setLineDash([Math.round(6 * s), Math.round(4 * s)])
      ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(W - 10, y)
      ctx.strokeStyle = '#000'; ctx.stroke()
      ctx.setLineDash([]); ctx.lineWidth = 1
      y += Math.round(14 * s)
    }
    if (logoImg) push(() => {
      const ls = Math.round(72 * s)
      ctx.drawImage(logoImg, (W - ls) / 2, y + Math.round(10 * s), ls, ls)
      y += ls + Math.round(14 * s)
    })
    push(() => { ctx.font = f(28, '900'); ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(si.name || 'BCB', W/2, y += Math.round(34 * s)) })
    if (si.address) push(() => { ctx.font = f(18); ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(si.address, W/2, y += Math.round(24 * s)) })
    if (si.phone) push(() => { ctx.font = f(18); ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText('Tel: ' + si.phone, W/2, y += Math.round(24 * s)) })
    push(() => { y += Math.round(8 * s); dash() })
    push(() => { ctx.font = f(17); ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText('ເລກຄິວ · QUEUE', W/2, y += Math.round(22 * s)) })
    push(() => { ctx.font = f(88, '900'); ctx.textAlign = 'center'; ctx.fillText(String(o.qnum).padStart(4, '0'), W/2, y += Math.round(96 * s)) })
    push(() => { ctx.font = f(18); ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(dateStr, W/2, y += Math.round(24 * s)) })
    push(() => { y += Math.round(8 * s); dash() })
    items.forEach(it => push(() => {
      ctx.font = f(20); ctx.textAlign = 'left'; ctx.fillStyle = '#000'
      ctx.fillText(nameOf(it) + ' x' + it.qty, 10, y += Math.round(28 * s))
      ctx.textAlign = 'right'; ctx.fillText((it.sub || 0).toLocaleString(), W - 10, y)
    }))
    push(() => { y += Math.round(8 * s); dash() })
    push(() => {
      const bx = Math.round(16 * s)
      const totalStr = (o.total || 0).toLocaleString()
      ctx.font = f(26, '900')
      const numW = ctx.measureText(totalStr).width
      ctx.font = f(12, '700')
      const curW = ctx.measureText('ກີບ').width
      const gap = Math.round(4 * s)
      const totalTextW = numW + gap + curW
      const boxTopPad = Math.round(14 * s)
      const labelH = Math.round(Math.round(11 * s) * 1.4)
      const gapInner = Math.round(8 * s)
      const amountH = Math.round(Math.round(26 * s) * 1.4)
      const boxH = boxTopPad + labelH + gapInner + amountH + Math.round(14 * s)
      y += Math.round(8 * s)
      const boxY = y
      const boxW = W - bx * 2
      ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, Math.round(2 * s)); ctx.setLineDash([])
      ctx.beginPath()
      if (ctx.roundRect) { ctx.roundRect(bx, boxY, boxW, boxH, Math.round(8 * s)) } else { ctx.rect(bx, boxY, boxW, boxH) }
      ctx.stroke()
      const labelBaseline = boxY + boxTopPad + labelH * 0.75
      ctx.font = f(11, '700'); ctx.textAlign = 'center'; ctx.fillStyle = '#555'
      ctx.fillText('ລວມທັງໝົດ · Total', W / 2, labelBaseline)
      const amountBaseline = labelBaseline + gapInner + amountH * 0.8
      const startX = (W - totalTextW) / 2
      ctx.font = f(26, '900'); ctx.textAlign = 'left'; ctx.fillStyle = '#000'
      ctx.fillText(totalStr, startX, amountBaseline)
      ctx.font = f(12, '700')
      ctx.fillText('ກີບ', startX + numW + gap, amountBaseline)
      y = boxY + boxH
    })
    push(() => { ctx.font = f(17); ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(si.footer || 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ', W/2, y += Math.round(30 * s)) })
    push(() => { y += Math.round(16 * s) })

    // First pass: measure total height
    y = 0; ops.forEach(fn => fn())
    const H = y + Math.round(20 * s)

    // Second pass: render at correct height
    canvas.height = H
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
    y = 0; ops.forEach(fn => fn())
    return canvas
  }

  // Downsample a high-res canvas to printer width for sharper 1-bit output
  function downsampleCanvas(src, targetW) {
    const ratio = targetW / src.width
    const targetH = Math.round(src.height * ratio)
    const dst = document.createElement('canvas')
    dst.width = targetW; dst.height = targetH
    const ctx = dst.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, targetW, targetH)
    ctx.drawImage(src, 0, 0, targetW, targetH)
    return dst
  }

  function canvasToEscPos(canvas) {
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const pixels = ctx.getImageData(0, 0, W, H).data
    const wb = Math.ceil(W / 8)
    const bitmap = new Uint8Array(wb * H)
    for (let row = 0; row < H; row++) {
      for (let bx = 0; bx < wb; bx++) {
        let byte = 0
        for (let bit = 0; bit < 8; bit++) {
          const x = bx * 8 + bit
          if (x < W) {
            const i = (row * W + x) * 4
            const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
            if (gray < 160) byte |= (1 << (7 - bit))  // threshold 160 for bolder text
          }
        }
        bitmap[row * wb + bx] = byte
      }
    }
    const xL = wb & 0xFF, xH = (wb >> 8) & 0xFF
    const yL = H & 0xFF, yH = (H >> 8) & 0xFF
    const header = new Uint8Array([0x1B, 0x40, 0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH])
    const footer = new Uint8Array([0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x00])
    const out = new Uint8Array(header.length + bitmap.length + footer.length)
    out.set(header, 0); out.set(bitmap, header.length); out.set(footer, header.length + bitmap.length)
    return out
  }

  async function printOrder(o) {
    const canvas = await renderReceiptCanvas(o, 560)
    const imgData = canvas.toDataURL('image/png')
    const printEl = document.createElement('div')
    printEl.id = 'print-receipt'
    printEl.innerHTML = `<img src="${imgData}" style="width:100%;max-width:302px;display:block;margin:0 auto;">`
    printEl.style.display = 'none'
    document.body.appendChild(printEl)
    window.onafterprint = () => { printEl.remove(); window.onafterprint = null }
    window.print()
  }

  // ─── Sales ───
  const salesOrders = orders.filter(o => {
    if (!o.done) return false
    const d = new Date(o.done_at || o.created_at).toISOString().split('T')[0]
    return d === salesDate
  })
  const salesTotal = salesOrders.reduce((s, o) => s + (o.total || 0), 0)
  const walkinTotal = salesOrders.filter(o => o.type === 'walkin').reduce((s, o) => s + (o.total || 0), 0)
  const onlineTotal = salesOrders.filter(o => o.type === 'online').reduce((s, o) => s + (o.total || 0), 0)
  const menuCount = {}
  let totalCost = 0
  salesOrders.forEach(o => {
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    items.forEach(it => {
      menuCount[it.name] = (menuCount[it.name] || 0) + it.qty
      const idx = menus.findIndex(m => (m.lo || m) === it.name)
      if (idx >= 0 && costs[idx]) totalCost += (costs[idx] || 0) * it.qty
    })
  })
  const salesProfit = salesTotal - totalCost
  const hasCosts = costs.some(c => c > 0)

  // Get all sales dates
  const salesDates = [...new Set(orders.filter(o => o.done).map(o =>
    new Date(o.done_at || o.created_at).toISOString().split('T')[0]
  ))].sort().reverse()
  if (!salesDates.includes(salesDate)) salesDates.unshift(salesDate)

  if (loading) return (
    <div className="min-h-dvh flex flex-col items-center justify-center" style={{ background: '#3d1f0a' }}>
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full border-4 animate-spin"
          style={{ borderColor: 'rgba(253,246,238,0.15)', borderTopColor: '#fdf6ee' }} />
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <img src="/logo.jpg" alt="logo" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-serif text-xl font-black" style={{ color: '#fdf6ee' }}>Basic Chinese Bun</span>
          </div>
          <div className="text-sm font-bold mt-2" style={{ color: 'rgba(253,246,238,0.5)' }}>ກຳລັງໂຫຼດ...</div>
        </div>
      </div>
    </div>
  )

  if (staffPin && !staffUnlocked) return (
    <PinPad
      fullScreen
      title="🔒 Staff" subtitle="ໃສ່ລະຫັດ Staff"
      onSubmit={pin => {
        if (pin === staffPin) { setStaffUnlocked(true); setPinInput(''); setPinError('') }
        else { setPinError('ລະຫັດຜິດ'); setPinInput('') }
      }}
      pinInput={pinInput} setPinInput={setPinInput} error={pinError} setError={setPinError}
    />
  )

  if (!supabase) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="text-sm font-bold text-center px-6" style={{ color: 'var(--brown)' }}>
        ບໍ່ສາມາດເຊື່ອມຕໍ່ຖານຂໍ້ມູນໄດ້<br/>ກວດສອບ Environment Variables
      </div>
    </div>
  )

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'var(--cream)' }}>
      {/* Toast */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toast.map(t => (
          <div key={t.id} className={`px-5 py-2 rounded-full text-sm font-black shadow-lg text-white ${
            t.type === 'green' ? 'bg-green-700' :
            t.type === 'red' ? 'bg-red-700' :
            t.type === 'orange' ? 'bg-orange-600' :
            'bg-[#3d1f0a]'
          }`}>{t.msg}</div>
        ))}
      </div>

      {!isOnline && <div className="bg-red-700 text-white text-center py-2 text-sm font-black">⚠ ບໍ່ມີອິນເຕີເນັດ</div>}
      {lowStockMenus.length > 0 && tab !== 'chat' && (
        <div className="px-3 py-2 text-xs font-black flex items-start gap-2" style={{ background: '#fef3c7', color: '#92400e' }}>
          <span className="flex-shrink-0">⚠</span>
          <span className="line-clamp-2">ສຕ໋ອກໃກ້ໝົດ: {lowStockMenus.map(m => `${m.name} (ຮ້ານ:${m.shop})`).join(' · ')}</span>
        </div>
      )}

      {/* ─── ORDERS TAB ─── */}
      {tab === 'orders' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ background: 'var(--brown)' }}>
            <div className="flex items-center gap-2">
              <div className="font-serif text-lg font-black" style={{ color: 'var(--cream)' }}>
                {shopInfo.name}
                {pendingOnline > 0 && <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pendingOnline}</span>}
              </div>
              {/* Realtime status dot */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black"
                style={{
                  background: liveStatus === 'live' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)',
                  color: liveStatus === 'live' ? '#86efac' : '#fde68a',
                }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: liveStatus === 'live' ? '#22c55e' : '#f59e0b' }} />
                {liveStatus === 'live' ? 'LIVE' : '...'}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={connectUsbPrinter} className={`text-xs font-black px-3 py-2 rounded-lg border ${usbConnected ? 'border-green-400 text-green-300' : 'border-[rgba(253,246,238,0.35)] text-[#fdf6ee]'}`}>
                {usbConnected ? '🖨 USB ✓' : 'USB'}
              </button>
              <button onClick={connectPrinter} className={`text-xs font-black px-3 py-2 rounded-lg border ${btConnected ? 'border-green-400 text-green-300' : 'border-[rgba(253,246,238,0.35)] text-[#fdf6ee]'}`}>
                {btConnected ? '🖨 BT ✓' : 'BT'}
              </button>
              <button onClick={() => alert('ຕ້ອງຊອກຫາ ↺ Reset ໃນລາຍການ')} className="text-xs font-black px-3 py-2 rounded-lg border border-red-400 text-red-300">↺</button>
            </div>
          </div>

          <div className="flex-shrink-0 grid grid-cols-3 gap-2 p-3">
            {[['ລໍຖ້າ', waiting, 'var(--brown)'], ['ສຳເລັດ', done, 'var(--green,#2d6a2d)'], ['ທັງໝົດ', orders.length, 'var(--gray3)']].map(([l, n, c]) => (
              <div key={l} className="card text-center py-2">
                <div className="text-2xl font-black" style={{ color: c }}>{n}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Sidebar + Orders layout */}
          <div className={`flex-1 overflow-hidden flex flex-col md:grid max-w-6xl mx-auto w-full transition-all duration-300 ${sidebarOpen ? 'md:grid-cols-[300px_1fr]' : 'md:grid-cols-[0px_1fr]'}`}>
            {/* Sidebar */}
            <div className={`flex flex-col gap-3 overflow-y-auto overflow-x-hidden transition-all duration-300 ${sidebarOpen ? 'p-3 opacity-100 max-h-[50vh] md:max-h-none' : 'max-h-0 p-0 opacity-0 md:w-0 pointer-events-none'}`}>
              {/* QR Code shortcut */}
              <a href="/qr" target="_blank" rel="noopener noreferrer"
                className="card flex items-center gap-3 active:scale-95 transition-all"
                style={{ textDecoration: 'none' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: 'var(--cream2)' }}>📱</div>
                <div className="flex-1">
                  <div className="font-black text-sm" style={{ color: 'var(--brown)' }}>QR Code Pre-Order</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>ສະແດງ QR ໃຫ້ລູກຄ້າສະແກນ</div>
                </div>
                <div className="text-xs font-black px-2 py-1 rounded-lg" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>ເປີດ →</div>
              </a>

              {/* Pending preorder menu summary */}
              <div className="card">
                <div className="text-xs font-black uppercase tracking-widest mb-2.5 flex items-center justify-between" style={{ color: 'var(--brown3)' }}>
                  <span>🧺 Preorder ຄ້າງຢູ່</span>
                  <span className="text-base font-black" style={{ color: pendingPreorderTotal > 0 ? 'var(--brown)' : 'var(--cream3)' }}>{pendingPreorderTotal} ກ້ອນ</span>
                </div>
                {pendingPreorderTotal === 0 ? (
                  <div className="text-xs text-center py-1 font-bold" style={{ color: 'var(--cream3)' }}>ບໍ່ມີ preorder ຄ້າງ</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {menus.map((m, i) => {
                      const qty = pendingPreorderCount[i] || 0
                      if (!qty) return null
                      return (
                        <div key={i} className="flex items-center justify-between py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm flex-shrink-0">{EMOJIS[i % EMOJIS.length]}</span>
                            <span className="text-xs font-bold truncate" style={{ color: 'var(--brown)' }}>{m.lo || m}</span>
                          </div>
                          <span className="text-sm font-black flex-shrink-0 ml-2 px-2 py-0.5 rounded-lg"
                            style={{ background: 'var(--cream2)', color: 'var(--brown)' }}>{qty}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Settings */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>⚙ ຕັ້ງຄ່າ</summary>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    ['soundOn', '🔊 ສຽງຮຽກຄິວ'],
                    ['walkinOn', '🏪 ເປີດ Walk-in'],
                    ['onlineOn', '🌐 ເປີດ Online'],
                    ['aiOn', '🤖 AI ຕອບແຊັດ'],
                    ['autoprintOn', '🖨 ພິມອັດຕະໂນມັດ'],
                  ].map(([k, l]) => (
                    <div key={k} className="flex justify-between items-center py-2 border-b border-[#e8d5c0]">
                      <span className="text-sm font-bold" style={{ color: 'var(--brown)' }}>{l}</span>
                      <button
                        onClick={() => toggleSetting(k)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${settings[k] ? 'bg-[#3d1f0a]' : 'bg-[#e8d5c0]'}`}
                      >
                        <span className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-all ${settings[k] ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                  {/* Pickup time range */}
                  <div className="border-t border-[#e8d5c0] pt-3 mt-1 flex flex-col gap-2">
                    <div className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--brown3)' }}>🕐 ເວລາຮັບ Preorder</div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <div className="text-xs font-bold mb-1" style={{ color: 'var(--gray3)' }}>ເລີ່ມ</div>
                        <input type="time" value={settings.pickupTimeStart || '15:30'}
                          onChange={e => { const s = { ...settings, pickupTimeStart: e.target.value }; setSettings(s); saveConfig('settings', s) }}
                          className="input-field text-sm py-2" />
                      </div>
                      <span className="font-black mt-4" style={{ color: 'var(--brown2)' }}>–</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold mb-1" style={{ color: 'var(--gray3)' }}>ສິ້ນສຸດ</div>
                        <input type="time" value={settings.pickupTimeEnd || '19:00'}
                          onChange={e => { const s = { ...settings, pickupTimeEnd: e.target.value }; setSettings(s); saveConfig('settings', s) }}
                          className="input-field text-sm py-2" />
                      </div>
                    </div>
                  </div>
                  {/* Queue reset */}
                  <div className="border-t border-[#e8d5c0] pt-3 mt-1 flex flex-col gap-2">
                    <div className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--brown3)' }}>🔢 ເລກຄິວ</div>
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--brown)' }}>📱 ລີເຊັດຄິວ Preorder</div>
                        <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>ຕັ້ງໃໝ່ຄິວ Online ເປັນ 0001</div>
                      </div>
                      <button
                        onClick={() => showConfirm('ລີເຊັດຄິວ Preorder ເປັນ 0001 ແທ້ບໍ?', async () => {
                          await saveConfig('next_queue', '0')
                          showToast('ລີເຊັດຄິວ Preorder ເປັນ 0001 ✅', 'green')
                        })}
                        className="text-xs px-3 py-2 rounded-xl font-black flex-shrink-0"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5' }}>
                        ລີເຊັດ
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--brown)' }}>🏪 ລີເຊັດຄິວ Walk-in</div>
                        <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>ຕັ້ງໃໝ່ຄິວໜ້າຮ້ານເປັນ 0001</div>
                      </div>
                      <button
                        onClick={() => showConfirm('ລີເຊັດຄິວ Walk-in ເປັນ 0001 ແທ້ບໍ?', async () => {
                          await saveConfig('next_queue_walkin', '0')
                          showToast('ລີເຊັດຄິວ Walk-in ເປັນ 0001 ✅', 'green')
                        })}
                        className="text-xs px-3 py-2 rounded-xl font-black flex-shrink-0"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5' }}>
                        ລີເຊັດ
                      </button>
                    </div>
                  </div>
                  {/* Walk-in access code */}
                  <div className="border-t border-[#e8d5c0] pt-3 mt-1 flex flex-col gap-2">
                    <div className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--brown3)' }}>🔐 Code Walk-in</div>
                    <div className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>ສ້າງ Code ໃໝ່ທຸກເທື່ອເປີດຮ້ານ — QR ເກົ່າໃຊ້ບໍ່ໄດ້ທັນທີ</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-xl font-black text-lg tracking-[0.2em] text-center"
                        style={{ background: 'var(--cream2)', color: walkinCode ? 'var(--brown)' : 'var(--cream3)', border: '2px solid var(--cream3)', letterSpacing: '0.2em' }}>
                        {walkinCode || '— — — — — —'}
                      </div>
                      <button
                        onClick={async () => {
                          const code = Math.random().toString(36).substring(2, 8).toUpperCase()
                          setWalkinCode(code)
                          await saveConfig('walkin_code', code)
                          showToast(`🔐 Code ໃໝ່: ${code}`, 'green')
                        }}
                        className="px-3 py-2 rounded-xl font-black text-sm flex-shrink-0"
                        style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                        🔄 ສ້າງໃໝ່
                      </button>
                    </div>
                    {walkinCode && (
                      <div className="text-xs font-bold px-3 py-2 rounded-xl break-all"
                        style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
                        🔗 {typeof window !== 'undefined' ? window.location.origin : ''}/order?c={walkinCode}
                      </div>
                    )}
                    {walkinCode && (
                      <button
                        onClick={async () => {
                          await saveConfig('walkin_code', '')
                          setWalkinCode('')
                          showToast('ປິດ Code Walk-in ແລ້ວ (ທຸກຄົນເຂົ້າໄດ້)', 'orange')
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg font-black self-start"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5' }}>
                        ປິດລະຫັດ (ບໍ່ຈຳກັດ)
                      </button>
                    )}
                  </div>

                  {/* PIN Settings */}
                  <div className="border-t border-[#e8d5c0] pt-3 mt-1 flex flex-col gap-2">
                    <div className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--brown3)' }}>🔒 ລະຫັດຜ່ານ</div>
                    {[['staff', 'ລະຫັດ Staff', staffPin], ['profit', 'ລະຫັດ Profit', profitPin]].map(([type, label, pin]) => (
                      <div key={type} className="flex items-center justify-between py-1">
                        <div>
                          <span className="text-sm font-bold" style={{ color: 'var(--brown)' }}>{label}</span>
                          <span className="ml-1.5 text-xs font-bold" style={{ color: pin ? '#16a34a' : 'var(--gray3)' }}>{pin ? '● ຕັ້ງແລ້ວ' : '○ ຍັງບໍ່ຕັ້ງ'}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => openPinSetting(type)} className="text-xs px-2.5 py-1.5 rounded-lg font-black" style={{ background: 'var(--cream2)', color: 'var(--brown2)', border: '1.5px solid var(--cream3)' }}>
                            {pin ? '🔑 ປ່ຽນ' : '+ ຕັ້ງ'}
                          </button>
                          {pin && <button onClick={() => openRemovePin(type)} className="text-xs px-2.5 py-1.5 rounded-lg font-black" style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5' }}>ລຶບ</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>

              {/* PIN Settings */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>🔒 ລະຫັດຜ່ານ</summary>
                <div className="mt-3 flex flex-col gap-2">
                  {[['staff', 'ລະຫັດ Staff', staffPin], ['profit', 'ລະຫັດ Profit', profitPin]].map(([type, label, pin]) => (
                    <div key={type} className="flex items-center justify-between py-1 border-b border-[#f5ebe0]">
                      <div>
                        <span className="text-sm font-bold" style={{ color: 'var(--brown)' }}>{label}</span>
                        <span className="ml-1.5 text-xs font-bold" style={{ color: pin ? '#16a34a' : 'var(--gray3)' }}>{pin ? '● ຕັ້ງແລ້ວ' : '○ ຍັງບໍ່ຕັ້ງ'}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openPinSetting(type)} className="text-xs px-2.5 py-1.5 rounded-lg font-black" style={{ background: 'var(--cream2)', color: 'var(--brown2)', border: '1.5px solid var(--cream3)' }}>
                          {pin ? '🔑 ປ່ຽນ' : '+ ຕັ້ງ'}
                        </button>
                        {pin && <button onClick={() => openRemovePin(type)} className="text-xs px-2.5 py-1.5 rounded-lg font-black" style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5' }}>ລຶບ</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              {/* Kitchen link */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>🍳 ຈໍຄົວ</summary>
                <div className="mt-3">
                  <a href="/kitchen" target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-black text-sm"
                    style={{ background: 'var(--cream2)', color: 'var(--brown)', border: '1.5px solid var(--cream3)' }}>
                    <span>🍳 ເປີດ Kitchen Display</span>
                    <span style={{ color: 'var(--gray3)' }}>↗</span>
                  </a>
                </div>
              </details>

              {/* Menu Edit */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>🍱 ເມນູ & ລາຄາ</summary>
                <div className="mt-3">
                  {menus.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center py-2 border-b border-[#f5ebe0]">
                      <span className="text-xs font-black w-4 flex-shrink-0" style={{ color: 'var(--cream3)' }}>{i+1}</span>
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <input id={`mn-${i}`} defaultValue={m.lo} className="input-field text-xs py-2" />
                        <div className="flex gap-1">
                          <input id={`mp-${i}`} defaultValue={prices[i] || ''} type="text" inputMode="numeric" placeholder="ລາຄາ" className="input-field text-xs py-2 flex-1" />
                          <input id={`mc-${i}`} defaultValue={costs[i] || ''} type="text" inputMode="numeric" placeholder="ຕົ້ນທຶນ" className="input-field text-xs py-2 flex-1" style={{ borderColor: '#fbbf24' }} />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <label className="w-10 h-10 rounded-lg border-2 border-dashed border-[#e8d5c0] flex items-center justify-center cursor-pointer overflow-hidden relative">
                          {imgPreviews[i]
                            ? <><img src={imgPreviews[i]} className="w-full h-full object-cover" /><span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white bg-black/40">...</span></>
                            : images[i] ? <img src={images[i]} className="w-full h-full object-cover" /> : <span className="text-xl">{EMOJIS[i]||'🍱'}</span>}
                          <input type="file" accept="image/*" className="hidden" onChange={e => uploadMenuImg(e, i)} />
                        </label>
                        {images[i] && !imgPreviews[i]
                          ? <button onClick={() => removeMenuImg(i)} className="text-[10px] text-red-500 font-black">✕ຮູບ</button>
                          : <button onClick={() => showConfirm(`ລຶບເມນູ "${m.lo}"?`, () => removeMenu(i))} className="text-[10px] font-black text-red-400">🗑</button>}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <button onClick={saveMenus} className="btn-primary flex-1 text-sm py-3">💾 ບັນທຶກ</button>
                    <button onClick={addMenu} className="px-4 py-3 rounded-xl font-black text-sm flex-shrink-0"
                      style={{ background: 'var(--cream2)', color: 'var(--brown)', border: '1.5px solid var(--cream3)' }}>
                      + ເພີ່ມ
                    </button>
                  </div>
                </div>
              </details>

              {/* Stock */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>📦 ສະຕ໋ອກ</summary>
                <div className="mt-3">
                  <div className="flex gap-3 text-xs font-black mb-2 pl-16" style={{ color: 'var(--gray3)' }}>
                    <span className="flex-1 text-center">ລວມ</span>
                    <span className="flex-1 text-center">ຮ້ານ</span>
                    <span className="flex-1 text-center">Online</span>
                  </div>
                  {menus.map((m, i) => {
                    const sh = stockShop[i]||0, on = stockOnline[i]||0
                    return (
                      <div key={i} className="flex gap-2 items-center py-2 border-b border-[#f5ebe0]">
                        <span className="text-xs font-bold flex-1 min-w-0 truncate" style={{ color: 'var(--brown)' }}>
                          {m.lo}
                          {sh===0 && <span className="ml-1 text-xs bg-red-50 text-red-600 rounded px-1">ໝົດ</span>}
                          {sh>0&&sh<=5 && <span className="ml-1 text-xs bg-orange-50 text-orange-600 rounded px-1">ໃກ້</span>}
                        </span>
                        <div className="flex gap-1">
                          {['total','shop','online'].map((type, ti) => {
                            const val = [stockTotal[i]||0, sh, on][ti]
                            return (
                              <input key={type} type="text" inputMode="numeric" value={val}
                                onChange={e => updateStock(type, i, e.target.value)}
                                className="w-12 h-8 border border-[#e8d5c0] rounded text-center text-xs font-black"
                                style={{ background: 'var(--cream)', color: 'var(--brown)' }} />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={saveStock} className="btn-primary mt-3 text-sm py-3">💾 ບັນທຶກສະຕ໋ອກ</button>
                </div>
              </details>

              {/* QR */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>📱 QR ຊຳລະ</summary>
                <div className="mt-3 flex flex-col items-center gap-3">
                  <div className="w-40 h-40 rounded-xl border-2 border-dashed border-[#e8d5c0] flex items-center justify-center overflow-hidden relative">
                    {qrPreview
                      ? <><img src={qrPreview} className="w-full h-full object-contain" /><span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white bg-black/40">ກຳລັງອັບ...</span></>
                      : qrImage ? <img src={qrImage} className="w-full h-full object-contain" /> : <span className="text-sm" style={{ color: 'var(--gray3)' }}>ຍັງບໍ່ມີ</span>}
                  </div>
                  <label className="btn-outline text-sm py-2 cursor-pointer text-center">
                    📤 ອັບໂຫລດ QR
                    <input type="file" accept="image/*" className="hidden" onChange={uploadQR} />
                  </label>
                </div>
              </details>

              {/* Shop Info */}
              {/* Receipt Settings */}
              <details className="card" open>
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>🧾 ຕັ້ງຄ່າໃບເສດ</summary>
                <div className="mt-4 flex flex-col gap-4">

                  {/* Logo */}
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--brown2)' }}>ໂລໂກ້ຮ້ານ</div>
                    <div className="flex gap-3 items-center">
                      <div className={`w-20 h-20 rounded-2xl border-2 overflow-hidden flex items-center justify-center flex-shrink-0 relative ${logoPreview || receiptDraft.logo ? 'border-[#a0522d]' : 'border-dashed border-[#e8d5c0]'}`} style={{ background: 'var(--cream)' }}>
                        {logoPreview
                          ? <><img src={logoPreview} className="w-full h-full object-cover" alt="preview" /><span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white bg-black/40">...</span></>
                          : receiptDraft.logo ? <img src={receiptDraft.logo} className="w-full h-full object-cover" alt="logo" /> : <span className="text-4xl">🏪</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="px-3 py-2 rounded-xl border-2 border-[#3d1f0a] text-xs font-black cursor-pointer text-center" style={{ color: 'var(--brown)', background: 'var(--warm-white)' }}>
                          📤 ອັບໂຫລດໂລໂກ້
                          <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                        </label>
                        {receiptDraft.logo && <button onClick={removeLogo} className="text-xs text-red-500 font-black text-center">✕ ລຶບໂລໂກ້</button>}
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  {[
                    ['ຊື່ຮ້ານ · Shop Name', 'name', 'text'],
                    ['ທີ່ຢູ່ · Address', 'address', 'text'],
                    ['ເບີໂທ · Phone', 'phone', 'tel'],
                  ].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="text-xs font-black uppercase tracking-widest block mb-1" style={{ color: 'var(--brown2)' }}>{label}</label>
                      <input
                        type={type}
                        value={receiptDraft[key] || ''}
                        onChange={e => setReceiptDraft(p => ({ ...p, [key]: e.target.value }))}
                        className="input-field text-sm py-2"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest block mb-1" style={{ color: 'var(--brown2)' }}>ຂໍ້ຄວາມໃຕ້ໃບເສດ · Footer</label>
                    <textarea
                      value={receiptDraft.footer || ''}
                      onChange={e => setReceiptDraft(p => ({ ...p, footer: e.target.value }))}
                      className="input-field text-sm py-2" rows={2}
                      placeholder="ຂອບໃຈທີ່ໃຊ້ບໍລິການ"
                    />
                  </div>

                  {/* Printer width */}
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--brown2)' }}>ຄວາມກວ້າງກະດາດ · Paper Width</div>
                    <div className="flex gap-2">
                      {[[384, '58mm'], [576, '80mm']].map(([pw, label]) => (
                        <button key={pw} onClick={() => setReceiptDraft(p => ({ ...p, printerWidth: pw }))}
                          className="flex-1 py-2.5 rounded-xl font-black text-sm border-2 transition-all"
                          style={{
                            borderColor: receiptDraft.printerWidth === pw ? '#3d1f0a' : '#e8d5c0',
                            background: receiptDraft.printerWidth === pw ? '#3d1f0a' : 'var(--warm-white)',
                            color: receiptDraft.printerWidth === pw ? '#fdf6ee' : 'var(--brown)',
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--gray3)' }}>ເຄື່ອງພິມທົ່ວໄປ 58mm · ຖ້າໃຊ້ 80mm ໃຫ້ເລືອກ 80mm</div>
                  </div>

                  {/* Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--brown2)' }}>ຕົວຢ່າງໃບເສດ · Preview</div>
                      <button onClick={() => generatePreview(receiptDraft)}
                        disabled={previewLoading}
                        className="text-xs font-black px-3 py-1.5 rounded-lg border-2 border-[#3d1f0a]"
                        style={{ color: 'var(--brown)', background: 'var(--warm-white)' }}>
                        {previewLoading ? '⏳' : '👁 ເບິ່ງ'}
                      </button>
                    </div>
                    {receiptPreviewUrl && (
                      <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: 'var(--cream3)', background: '#f5f5f5' }}>
                        <img src={receiptPreviewUrl} alt="Receipt Preview" style={{ width: '100%', maxWidth: 300, display: 'block', margin: '0 auto' }} />
                      </div>
                    )}
                    {!receiptPreviewUrl && (
                      <div className="rounded-xl py-8 text-center text-xs" style={{ background: 'var(--cream2)', color: 'var(--gray3)' }}>
                        ກົດ "ເບິ່ງ" ເພື່ອເບິ່ງຕົວຢ່າງໃບເສດ
                      </div>
                    )}
                  </div>

                  <button onClick={saveShopInfo} className="btn-primary text-sm py-3">💾 ບັນທຶກຕັ້ງຄ່າ</button>
                </div>
              </details>

              {/* Branches */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>📍 ສາຂາ · Branches</summary>
                <div className="mt-3 flex flex-col gap-4">
                  {branches.map((b, idx) => (
                    <div key={b.id} className="rounded-xl overflow-hidden" style={{ border: '2px solid var(--cream3)' }}>
                      {/* Branch header with toggle */}
                      <div className="flex items-center justify-between px-3 py-2.5" style={{ background: b.visible ? 'var(--brown)' : 'var(--cream2)' }}>
                        <div>
                          <div className="font-black text-sm" style={{ color: b.visible ? 'var(--cream)' : 'var(--brown)' }}>{b.name}</div>
                          <div className="text-xs font-bold" style={{ color: b.visible ? 'rgba(253,246,238,0.65)' : 'var(--gray3)' }}>{b.nameEn}</div>
                        </div>
                        <button
                          onClick={() => updateBranch(idx, 'visible', !b.visible)}
                          className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${b.visible ? 'bg-green-500' : 'bg-[#e8d5c0]'}`}>
                          <span className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-all shadow ${b.visible ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      {/* Fields */}
                      <div className="p-3 flex flex-col gap-2" style={{ background: 'var(--warm-white)' }}>
                        {[
                          ['schedule', '🗓 ເວລາທຳການ'],
                          ['mapUrl',      '📍 Google Maps URL'],
                          ['facebookUrl', '📘 Facebook URL'],
                          ['tiktokUrl',   '🎵 TikTok URL'],
                          ['phone1',      '📞 ເບີໂທ 1'],
                          ['phone2',      '📞 ເບີໂທ 2'],
                          ['whatsapp',    '💬 WhatsApp (digits only)'],
                        ].map(([field, label]) => (
                          <div key={field}>
                            <label className="text-xs font-black tracking-widest uppercase block mb-1" style={{ color: 'var(--brown2)' }}>{label}</label>
                            <input
                              type="text"
                              value={b[field] || ''}
                              onChange={e => updateBranch(idx, field, e.target.value)}
                              placeholder={field === 'whatsapp' ? 'e.g. 85620XXXXXXXX' : ''}
                              className="input-field text-xs py-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={saveBranches} className="btn-primary text-sm py-3">💾 ບັນທຶກສາຂາ</button>
                </div>
              </details>

              {/* Slip Gallery */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>
                  {'🗑 ຈັດການສລິບ'}
                  {orders.filter(o => o.slip_url).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background: '#fef2f2', color: '#dc2626' }}>
                      {orders.filter(o => o.slip_url).length}
                    </span>
                  )}
                </summary>
                <div className="mt-3">
                  {orders.filter(o => o.slip_url).length === 0 ? (
                    <div className="text-center py-4 text-xs font-bold" style={{ color: 'var(--cream3)' }}>ບໍ່ມີສລິບ</div>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-3 flex-wrap items-center">
                        <button
                          onClick={() => setSelectedSlipIds(new Set(orders.filter(o => o.slip_url).map(o => o.id)))}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-black"
                          style={{ background: 'var(--cream2)', color: 'var(--brown2)', border: '1.5px solid var(--cream3)' }}>
                          ເລືອກທັງໝົດ
                        </button>
                        {selectedSlipIds.size > 0 && (
                          <>
                            <button
                              onClick={() => setSelectedSlipIds(new Set())}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-black"
                              style={{ background: 'var(--cream2)', color: 'var(--brown2)', border: '1.5px solid var(--cream3)' }}>
                              ຍົກເລີກ
                            </button>
                            <button
                              onClick={() => showConfirm(`ລຶບສລິບ ${selectedSlipIds.size} ໃບ ແທ້ບໍ?`, deleteSelectedSlips)}
                              disabled={deletingSlips}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-black"
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5' }}>
                              {deletingSlips ? '⏳...' : `🗑 ລຶບ (${selectedSlipIds.size})`}
                            </button>
                          </>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {orders.filter(o => o.slip_url).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(o => {
                          const isSelected = selectedSlipIds.has(o.id)
                          const date = new Date(o.created_at).toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit' })
                          return (
                            <div
                              key={o.id}
                              onClick={() => setSelectedSlipIds(prev => {
                                const n = new Set(prev)
                                if (n.has(o.id)) n.delete(o.id); else n.add(o.id)
                                return n
                              })}
                              className="relative cursor-pointer rounded-xl overflow-hidden select-none"
                              style={{ border: isSelected ? '2.5px solid #dc2626' : '2px solid var(--cream3)' }}>
                              <img src={o.slip_url} alt={`slip ${o.qnum}`} className="w-full aspect-square object-cover" />
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.25)' }}>
                                  <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm">✓</span>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-white font-black truncate" style={{ background: 'rgba(61,31,10,0.75)', fontSize: 9 }}>
                                #{o.qnum} · {date}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </details>

              {/* Export / Import */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>💾 ຂໍ້ມູນ · Data</summary>
                <div className="mt-3 flex flex-col gap-2">
                  <button onClick={exportData} className="btn-primary text-sm py-3">📥 Export JSON</button>
                  <label className="btn-outline text-sm py-3 text-center cursor-pointer">
                    📤 Import JSON
                    <input type="file" accept=".json" className="hidden" onChange={importData} />
                  </label>
                  <div className="text-xs font-bold leading-5" style={{ color: 'var(--gray3)' }}>
                    💡 Export = ດາວໂຫຼດຂໍ້ມູນສຳຮອງ<br/>
                    📤 Import = ກູ້ຂໍ້ມູນຈາກໄຟລ໌
                  </div>
                </div>
              </details>
            </div>

            {/* Orders Main */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex-shrink-0 px-3 pt-3 pb-1">
              <div className="flex gap-2 items-center mb-2">
                <button
                  onClick={() => setSidebarOpen(v => !v)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all active:scale-95 flex-shrink-0"
                  style={{ background: 'var(--cream2)', color: 'var(--brown2)', border: '1.5px solid var(--cream3)' }}
                  title={sidebarOpen ? 'ເຊື່ອງ Sidebar' : 'ສະແດງ Sidebar'}
                >
                  ☰
                </button>
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--gray3)' }}>ລາຍການ</span>
                <div className="flex gap-1 ml-auto items-center">
                  {(() => {
                    const pendingOnline = orders.filter(o =>
                      o.type === 'online' && o.status === 'pending' && !o.done && !o.cancelled
                    ).length
                    return pendingOnline > 0 ? (
                      <button
                        onClick={() => { setBatchOpen(true); setBatchSelected(new Set()) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black active:scale-95 transition-all"
                        style={{ background: '#15803d', color: 'white' }}
                      >
                        ✓ ເລືອກຢືນຢັນ
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-black" style={{ background: 'rgba(255,255,255,0.25)' }}>{pendingOnline}</span>
                      </button>
                    ) : null
                  })()}
                  {[['all','ທັງໝົດ'],['walkin','🏪'],['online','🌐']].map(([f,l]) => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-black border ${filter===f ? 'bg-[#3d1f0a] text-[#fdf6ee] border-[#3d1f0a]' : 'border-[#e8d5c0] text-[#8a6a55]'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="relative mb-3">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ຄົ້ນຫາ: ເລກຄິວ, ຊື່, ເບີໂທ, ເມນູ..."
                  className="input-field w-full text-sm pl-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--gray3)' }}>🔍</span>
                {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black" style={{ color: 'var(--gray3)' }}>✕</button>}
              </div>

              {/* Customer search */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="ຊື່, ເບີໂທ, ເລກຄິວ (0001)..."
                  className="input-field w-full text-sm pl-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--gray3)' }}>👤</span>
                {customerSearch && (
                  <button onClick={() => setCustomerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black px-2 py-0.5 rounded" style={{ color: 'var(--brown)', background: 'var(--cream2)' }}>
                    ລ້າງ · Clear
                  </button>
                )}
              </div>
              </div>{/* end fixed header */}

              <div className="flex-1 overflow-y-auto px-3 pb-20">
              {/* Customer search results */}
              {customerSearch.trim() && (
                <div className="mb-4">
                  <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: 'var(--gray3)' }}>
                    ຜົນຄົ້ນຫາ · Results ({customerSearchResults.length})
                  </div>
                  {customerSearchResults.length === 0 && (
                    <div className="text-center py-6 text-sm font-bold rounded-xl" style={{ color: 'var(--cream3)', background: 'var(--cream2)' }}>
                      ບໍ່ພົບຜົນ
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    {customerSearchResults.map(o => {
                      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
                      const cust = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
                      const time = new Date(o.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
                      const borderColor = o.cancelled || o.status === 'rejected' ? '#fca5a5' : o.status === 'blocked' ? '#c4b5fd' : o.done ? '#e8d5c0' : '#3d1f0a'
                      return (
                        <div key={o.id} className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${borderColor}`, background: 'var(--warm-white)' }}>
                          <div className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="font-serif text-2xl font-black" style={{ color: 'var(--brown)' }}>
                                  #{String(o.qnum).padStart(4,'0')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>{time}</div>
                                <span className={`tag text-xs mt-1 ${o.type === 'online' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                  {o.type === 'online' ? '🌐 Online' : '🏪 Walk-in'}
                                </span>
                                {o.done && <span className="tag bg-green-50 text-green-700 text-xs ml-1">✓ Done</span>}
                                {o.cancelled && <span className="tag bg-red-50 text-red-700 text-xs ml-1">✕ ຍົກເລີກ</span>}
                                {o.status === 'rejected' && <span className="tag bg-red-50 text-red-700 text-xs ml-1">✕ ປະຕິເສດ</span>}
                                {o.status === 'blocked' && <span className="tag bg-purple-50 text-purple-700 text-xs ml-1">🚫 ຖືກບ໋ອກ</span>}
                                {o.status === 'confirmed' && !o.done && <span className="tag bg-green-50 text-green-700 text-xs ml-1">✓ ຢືນຢັນ</span>}
                                {o.status === 'pending' && !o.cancelled && <span className="tag bg-yellow-50 text-yellow-700 text-xs ml-1">⏳ ລໍຖ້າ</span>}
                              </div>
                            </div>
                            {cust && (
                              <div className="rounded-xl p-2 mb-2 text-sm font-bold leading-6" style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
                                <div>👤 {cust.name} · 📞 {cust.phone}</div>
                                {cust.time && <div>🕐 {cust.time}</div>}
                              </div>
                            )}
                            <div className="text-sm font-bold mb-1" style={{ color: 'var(--brown2)' }}>
                              {items.map((it, ii) => <span key={ii} className="mr-2">{it.name} ×{it.qty}</span>)}
                            </div>
                            <div className="text-sm font-black" style={{ color: 'var(--brown)' }}>
                              ລວມ: {(o.total || 0).toLocaleString()} ກີບ
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!customerSearch.trim() && activeOrders.length === 0 && <div className="text-center py-12 text-lg font-bold" style={{ color: 'var(--cream3)' }}>ຍັງບໍ່ມີອໍເດີ</div>}

              {!customerSearch.trim() && <div className="flex flex-col gap-3">
                {activeOrders.map(o => {
                  const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
                  const cust = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
                  const time = new Date(o.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
                  const borderColor = o.cancelled || o.status === 'rejected' ? '#fca5a5' : o.status === 'blocked' ? '#c4b5fd' : o.done ? '#e8d5c0' : '#3d1f0a'

                  return (
                    <div key={o.id} className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${borderColor}`, background: 'var(--warm-white)' }}>

                      <div className="p-3">
                        {/* Slip warning banner */}
                        {(() => {
                          const sv = slipVerify[o.id]
                          const r = sv?.result
                          if (!r) return null
                          const warn = r.suspicious || !r.amount_matches || !r.date_is_today
                          if (!warn) return null
                          const [warnOpen, setWarnOpen] = [expandedArchive.has('warn_' + o.id), v => setExpandedArchive(prev => { const n = new Set(prev); v ? n.add('warn_' + o.id) : n.delete('warn_' + o.id); return n })]
                          return (
                            <div className="rounded-xl mb-2 overflow-hidden" style={{ border: '2px solid #f97316' }}>
                              <button onClick={() => setWarnOpen(!warnOpen)} className="w-full flex items-center gap-2 px-3 py-2 text-left" style={{ background: '#fff7ed' }}>
                                <span className="text-base">⚠️</span>
                                <span className="text-xs font-black flex-1" style={{ color: '#c2410c' }}>ສລິບນີ້ຕ້ອງກວດສອບ — ກົດເພື່ອເບິ່ງ</span>
                                <span className="text-xs" style={{ color: '#c2410c' }}>{warnOpen ? '▲' : '▼'}</span>
                              </button>
                              {warnOpen && (
                                <div className="px-3 pb-3 pt-1 text-xs font-bold leading-6" style={{ background: '#fff7ed', color: '#7c2d12' }}>
                                  {!r.amount_matches && <div>❌ ຈຳນວນ: {r.amount_found != null ? r.amount_found.toLocaleString() + ' ກີບ' : 'ບໍ່ພົບ'} (ຄາດ {(o.total||0).toLocaleString()} ກີບ)</div>}
                                  {!r.date_is_today && <div>⚠️ ວັນໂອນ: {r.transfer_date || 'ບໍ່ພົບ'} — ບໍ່ໃຊ່ມື້ນີ້</div>}
                                  {r.suspicious && <div>🚨 {r.suspicious_reason}</div>}
                                  {r.summary_lo && <div className="mt-1 opacity-70">{r.summary_lo}</div>}
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="font-serif text-2xl font-black" style={{ color: 'var(--brown)' }}>
                              #{String(o.qnum).padStart(4,'0')}
                            </div>
                            {!o.done && !o.cancelled && o.status !== 'rejected' && (
                              <button onClick={() => openEditOrder(o)} className="py-1 px-2 rounded-lg text-xs font-black" style={{ background: '#eff6ff', color: '#1d4ed8' }}>✏️ ແກ້</button>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>{time}</div>
                            <span className={`tag text-xs mt-1 ${o.type === 'online' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                              {o.type === 'online' ? '🌐 Online' : '🏪 Walk-in'}
                            </span>
                            {o.type === 'walkin' && !o.cancelled && !o.done && (
                              o.paid
                                ? <span className="tag text-xs ml-1" style={{ background: '#f0fdf4', color: '#16a34a' }}>{o.payment_method === 'cash' ? '💵' : '📱'} ຈ່າຍແລ້ວ</span>
                                : <span className="tag bg-orange-50 text-orange-600 text-xs ml-1">💰 ຍັງບໍ່ຈ່າຍ</span>
                            )}
                            {o.done && <span className="tag bg-green-50 text-green-700 text-xs ml-1">✓ Done</span>}
                            {o.cancelled && <span className="tag bg-red-50 text-red-700 text-xs ml-1">✕ ຍົກເລີກ</span>}
                            {o.status === 'rejected' && <span className="tag bg-red-50 text-red-700 text-xs ml-1">✕ ປະຕິເສດ</span>}
                            {o.status === 'blocked' && <span className="tag bg-purple-50 text-purple-700 text-xs ml-1">🚫 ຖືກບ໋ອກ</span>}
                            {o.status === 'confirmed' && !o.done && <span className="tag bg-green-50 text-green-700 text-xs ml-1">✓ ຢືນຢັນ</span>}
                            {o.status === 'pending' && !o.cancelled && <span className="tag bg-yellow-50 text-yellow-700 text-xs ml-1">⏳ ລໍຖ້າ</span>}
                          </div>
                        </div>

                        {/* Customer info */}
                        {cust && (
                          <div className="rounded-xl p-2 mb-2 text-sm font-bold leading-6" style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
                            <div>👤 {cust.name} · 📞 {cust.phone}</div>
                            <div>📅 {cust.date} · 🕐 {cust.time}</div>
                            {cust.note && <div>📝 {cust.note}</div>}
                            {cust.security && (() => {
                              const sec = cust.security
                              const warnings = []
                              if (sec.ip?.country_code && sec.ip.country_code !== 'LA') warnings.push(`🌍 IP ມາຈາກ ${sec.ip.country}`)
                              const org = (sec.ip?.org || '').toLowerCase()
                              if (['vpn','proxy','hosting','cloud','digitalocean','amazon','linode','vultr','server'].some(k => org.includes(k))) warnings.push(`🕵️ ISP: ${sec.ip.org}`)
                              if (sec.tz && sec.ip?.timezone && sec.tz !== sec.ip.timezone) warnings.push(`⏰ Timezone ຕ່າງ: ${sec.tz}`)
                              const fpKey = (sec.tz || '') + '|' + (sec.lang || '')
                              const foreignIp = sec.ip?.country_code && sec.ip.country_code !== 'LA'
                              const alreadyBlocked = (sec.ip?.ip && blockedIps.includes(sec.ip.ip)) || blockedFp.includes(fpKey) || foreignIp
                              const mapsUrl = sec.gps ? `https://maps.google.com/?q=${sec.gps.lat},${sec.gps.lng}` : null
                              return (
                                <details className="mt-1" open={warnings.length > 0 || alreadyBlocked}>
                                  <summary className="cursor-pointer text-xs font-black" style={{ color: alreadyBlocked ? '#7c3aed' : warnings.length ? '#c2410c' : '#5C4033' }}>
                                    {alreadyBlocked ? '🚫 ຜູ້ໃຊ້ຖືກບ໋ອກ' : warnings.length ? '🚨 ຄວາມປອດໄພ — ຕ້ອງກວດສອບ' : '🔒 ຂໍ້ມູນຄວາມປອດໄພ'}
                                  </summary>
                                  <div className="mt-1 flex flex-col gap-0.5 text-xs" style={{ color: '#5C4033' }}>
                                    {warnings.map((w, i) => <div key={i} className="font-black" style={{ color: '#c2410c' }}>{w}</div>)}
                                    {sec.ip?.ip && <div>🖥 IP: <span className="font-black select-all">{sec.ip.ip}</span>{blockedIps.includes(sec.ip.ip) && <span className="ml-1 text-purple-600 font-black">✓ blocked</span>}</div>}
                                    {sec.ip?.city && <div>📡 {sec.ip.city}, {sec.ip.country}</div>}
                                    {sec.tz && <div>🕐 TZ: {sec.tz} · Lang: {sec.lang}</div>}
                                    {blockedFp.includes(fpKey) && <div className="text-purple-600 font-black">✓ Fingerprint ຖືກບ໋ອກ</div>}
                                    {sec.screen && <div>📱 {sec.screen} · CPU: {sec.cpu||'?'} cores · RAM: {sec.mem||'?'}GB</div>}
                                    {sec.gpu && <div>🎮 GPU: <span className="select-all">{sec.gpu}</span></div>}
                                    {sec.platform && <div>💻 {sec.platform} · touch: {sec.touch}</div>}
                                    {sec.canvasFp && <div className="opacity-60">fp: {sec.canvasFp}</div>}
                                    {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline font-black" style={{ color: '#1d4ed8' }}>📍 ເບິ່ງ GPS ໃນ Maps</a>}
                                    {sec.gps && <div className="opacity-60">({sec.gps.lat.toFixed(5)}, {sec.gps.lng.toFixed(5)}) ±{sec.gps.accuracy}m</div>}
                                    {!alreadyBlocked && (
                                      <button
                                        onClick={() => blockUser(o)}
                                        className="mt-1 px-3 py-1 rounded-lg text-xs font-black text-white"
                                        style={{ background: '#7c3aed' }}
                                      >
                                        🚫 Block ຜູ້ໃຊ້ນີ້
                                      </button>
                                    )}
                                  </div>
                                </details>
                              )
                            })()}
                          </div>
                        )}

                        {/* Bag */}
                        {o.bag_label && (
                          <div className="border-l-4 border-[#3d1f0a] pl-3 mb-2 flex flex-col gap-1">
                            {o.bag_label.split(' | ').map((line, li) => (
                              <div key={li} className="text-sm font-black leading-snug" style={{ color: 'var(--brown)' }}>
                                {line}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Items — 2 rows, flow left-to-right, scrollable */}
                        <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateRows: 'repeat(2, auto)', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="mb-3">
                          {items.map((it, ii) => {
                            const img = images[it.menuIdx]
                            return (
                              <div key={ii} style={{ width: 104 }} className="rounded-2xl overflow-hidden border-2 border-[#e8d5c0] flex-shrink-0">
                                <div className="relative overflow-hidden" style={{ width: 104, height: 104, background: 'var(--cream2)' }}>
                                  {img
                                    ? <img src={img} className="w-full h-full object-cover" alt={it.name} />
                                    : <div className="absolute inset-0 flex items-center justify-center text-4xl" style={{ background: 'var(--cream2)' }}>{EMOJIS[it.menuIdx] || '🍱'}</div>
                                  }
                                  <div className="absolute top-1 right-1 w-11 h-11 rounded-full flex items-center justify-center font-black shadow-md" style={{ background: 'var(--brown)', color: 'var(--cream)', fontSize: 20 }}>{it.qty}</div>
                                </div>
                                <div className="px-3 py-2" style={{ background: 'var(--warm-white)' }}>
                                  <div className="text-center font-black leading-tight" style={{ color: 'var(--brown)', fontSize: 13 }}>{it.name}</div>
                                  {it.sub > 0 && <div className="text-center font-bold mt-0.5" style={{ color: 'var(--gray3)', fontSize: 11 }}>{it.sub.toLocaleString()}</div>}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Slip */}
                        {o.slip_url && (
                          <div className="mb-2 flex items-center gap-2">
                            <div className="cursor-pointer" onClick={() => setSlipModal({ url: o.slip_url, qnum: o.qnum })}>
                              <img src={o.slip_url} className="w-20 rounded-lg border-2 border-[#e8d5c0]" alt="slip" />
                            </div>
                            {slipVerify[o.id]?.loading && (
                              <span className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>🤖 ກຳລັງກວດ...</span>
                            )}
                          </div>
                        )}

                        <div className="text-base font-black mb-3" style={{ color: 'var(--brown)' }}>
                          ລວມ: {(o.total || 0).toLocaleString()} ກີບ
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {o.cancelled ? (
                            <button onClick={() => undoOrder(o.id, 'cancelled')} className="flex-1 py-2 rounded-xl text-sm font-black border-2 border-[#e8d5c0]" style={{ color: 'var(--gray3)' }}>↩ ຄືນ</button>
                          ) : o.done ? (
                            <button onClick={() => undoOrder(o.id, 'done')} className="flex-1 py-2 rounded-xl text-sm font-black border-2 border-[#e8d5c0]" style={{ color: 'var(--gray3)' }}>↩ ຍົກເລີກ Done</button>
                          ) : o.type === 'walkin' && o.status === 'pending' ? (
                            <div className="w-full flex flex-col gap-2">
                              {!o.paid && (
                                payingId === o.id ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => markPaid(o, 'cash')} className="flex-1 py-3 rounded-xl text-sm font-black text-white" style={{ background: '#15803d' }}>💵 ສດ</button>
                                    <button onClick={() => markPaid(o, 'qr')} className="flex-1 py-3 rounded-xl text-sm font-black text-white" style={{ background: '#1d4ed8' }}>📱 ໂອນ</button>
                                    <button onClick={() => setPayingId(null)} className="py-3 px-3 rounded-xl text-sm font-black border-2 border-[#e8d5c0]" style={{ color: 'var(--gray3)' }}>✕</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setPayingId(o.id)} className="w-full py-3 rounded-xl text-sm font-black border-2 border-orange-400 text-orange-600">💰 ຮັບເງິນ</button>
                                )
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => confirmWalkin(o)} className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-green-700">🍳 ສົ່ງຄົວ</button>
                                <button onClick={() => cancelOrder(o)} className="py-3 px-4 rounded-xl text-sm font-black border-2 border-red-400 text-red-600">✕</button>
                              </div>
                            </div>
                          ) : o.type === 'online' && o.status === 'pending' ? (
                            <>
                              <button onClick={() => confirmOrder(o)} className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-green-700">✓ ຢືນຢັນ</button>
                              <button onClick={() => rejectOrder(o)} className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-red-700">✕ ປະຕິເສດ</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => doneOrder(o)} className="flex-[4] py-3 rounded-xl text-sm font-black" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>✓ Done</button>
                              <button onClick={() => announce(o.qnum)} className="flex-[2] py-3 rounded-xl text-sm font-black" style={{ background: 'var(--brown2)', color: 'var(--cream)' }}>📢</button>
                              <button onClick={() => smartPrint(o)} className="py-3 px-3 rounded-xl text-sm font-black bg-blue-50 text-blue-700">🖨</button>
                              <button onClick={() => cancelOrder(o)} className="py-3 px-3 rounded-xl text-sm font-black border-2 border-red-400 text-red-600">✕</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>}

              {/* ─── Archive ─── */}
              {!customerSearch.trim() && archivedOrders.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setArchiveOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-black text-xs tracking-widest uppercase"
                    style={{ background: 'var(--cream2)', color: 'var(--gray3)' }}
                  >
                    <span>📦 ປະຫວັດ · Archive ({archivedOrders.length})</span>
                    <span>{archiveOpen ? '▲' : '▼'}</span>
                  </button>

                  {archiveOpen && (
                    <div className="flex flex-col gap-1 mt-2">
                      {archivedOrders.map(o => {
                        const isExp = expandedArchive.has(o.id)
                        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
                        const cust = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
                        const time = new Date(o.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
                        return (
                          <div key={o.id} className="rounded-xl overflow-hidden border border-[#e8d5c0]" style={{ background: 'var(--warm-white)' }}>
                            <div
                              className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
                              onClick={() => setExpandedArchive(prev => {
                                const n = new Set(prev)
                                n.has(o.id) ? n.delete(o.id) : n.add(o.id)
                                return n
                              })}
                            >
                              <span className="font-black text-sm w-10 flex-shrink-0" style={{ color: 'var(--brown)' }}>#{String(o.qnum).padStart(4,'0')}</span>
                              <span className="text-xs flex-shrink-0" style={{ color: 'var(--gray3)' }}>{time}</span>
                              <span className={`tag text-xs flex-shrink-0 ${o.type === 'online' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{o.type === 'online' ? '🌐' : '🏪'}</span>
                              {o.done && <span className="tag bg-green-50 text-green-700 text-xs flex-shrink-0">✓ Done</span>}
                              {o.cancelled && <span className="tag bg-red-50 text-red-700 text-xs flex-shrink-0">✕ ຍົກເລີກ</span>}
                              {o.status === 'rejected' && <span className="tag bg-red-50 text-red-700 text-xs flex-shrink-0">✕ ປະຕິເສດ</span>}
                              {o.status === 'blocked' && <span className="tag bg-purple-50 text-purple-700 text-xs flex-shrink-0">🚫 ບ໋ອກ</span>}
                              {cust?.name && <span className="text-xs font-bold truncate flex-1 min-w-0" style={{ color: 'var(--brown2)' }}>{cust.name}{cust.phone ? ` · ${cust.phone}` : ''}</span>}
                              <span className={`text-xs font-black flex-shrink-0 ${cust?.name ? '' : 'ml-auto'}`} style={{ color: 'var(--brown)' }}>{(o.total||0).toLocaleString()}</span>
                              <span className="text-xs flex-shrink-0" style={{ color: 'var(--gray3)' }}>{isExp ? '▲' : '▼'}</span>
                            </div>
                            {isExp && (
                              <div className="px-3 pb-3 pt-2 border-t border-[#e8d5c0]">
                                {cust && (
                                  <div className="text-xs font-bold mb-2 leading-5" style={{ color: 'var(--brown2)' }}>
                                    👤 {cust.name} · 📞 {cust.phone}
                                    {cust.date && <span>  📅 {cust.date} {cust.time}</span>}
                                  </div>
                                )}
                                <div className="text-xs font-bold mb-2 leading-5" style={{ color: 'var(--brown2)' }}>
                                  {items.map((it, ii) => <span key={ii} className="mr-2">{it.name} ×{it.qty}</span>)}
                                </div>
                                {o.slip_url && (
                                  <div className="mb-2 cursor-pointer" onClick={() => setSlipModal({ url: o.slip_url, qnum: o.qnum })}>
                                    <img src={o.slip_url} className="w-16 rounded-lg border border-[#e8d5c0]" alt="slip" />
                                  </div>
                                )}
                                <div className="flex gap-2 mt-1">
                                  {o.cancelled && <button onClick={() => undoOrder(o.id, 'cancelled')} className="text-xs py-1.5 px-3 rounded-lg border-2 border-[#e8d5c0] font-black" style={{ color: 'var(--gray3)' }}>↩ ຄືນ</button>}
                                  {o.done && <button onClick={() => undoOrder(o.id, 'done')} className="text-xs py-1.5 px-3 rounded-lg border-2 border-[#e8d5c0] font-black" style={{ color: 'var(--gray3)' }}>↩ ຍົກເລີກ Done</button>}
                                  <button onClick={() => smartPrint(o)} className="text-xs py-1.5 px-3 rounded-lg bg-blue-50 text-blue-700 font-black">🖨</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SALES TAB ─── */}
      {tab === 'sales' && (
        <div className="flex-1 overflow-y-auto pb-16">
          <div className="sticky top-0 z-10 px-4 py-3" style={{ background: 'var(--brown)' }}>
            <div className="font-serif text-lg font-black" style={{ color: 'var(--cream)' }}>ຍອດຂາຍ · Sales</div>
          </div>
          <div className="max-w-lg mx-auto p-4">
            <select value={salesDate} onChange={e => setSalesDate(e.target.value)} className="input-field mb-4">
              {salesDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--brown)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: 'rgba(253,246,238,0.7)' }}>ຍອດລວມ</span>
                <span className="font-serif text-2xl font-black" style={{ color: 'var(--cream)' }}>{salesTotal.toLocaleString()} ກີບ</span>
              </div>
              {hasCosts && (!profitPin || profitUnlocked) && (
                <div className="mt-2 pt-2 border-t border-[rgba(253,246,238,0.15)] flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(253,246,238,0.6)' }}>ຕົ້ນທຶນ</span>
                    <span className="font-black text-red-300">- {totalCost.toLocaleString()} ກີບ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(253,246,238,0.6)' }}>ກຳໄລ</span>
                    <span className={`font-black ${salesProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>{salesProfit.toLocaleString()} ກີບ</span>
                  </div>
                  <div className="flex justify-between text-xs mt-0.5">
                    <span style={{ color: 'rgba(253,246,238,0.4)' }}>margin</span>
                    <span style={{ color: 'rgba(253,246,238,0.6)' }}>{salesTotal > 0 ? Math.round(salesProfit / salesTotal * 100) : 0}%</span>
                  </div>
                  {profitUnlocked && <button onClick={() => setProfitUnlocked(false)} className="text-xs mt-1 text-left" style={{ color: 'rgba(253,246,238,0.3)' }}>🔒 ລັອກ</button>}
                </div>
              )}
              {!hasCosts && (
                <div className="mt-2 text-xs" style={{ color: 'rgba(253,246,238,0.4)' }}>ຕັ້ງຕົ້ນທຶນໃນ ⚙ ຕັ້ງຄ່າ ເພື່ອເບິ່ງກຳໄລ</div>
              )}
              {hasCosts && profitPin && !profitUnlocked && (
                <button onClick={() => { setPinMode('profit'); setPinInput(''); setPinError('') }}
                  className="mt-2 w-full py-2 rounded-xl text-xs font-black"
                  style={{ background: 'rgba(253,246,238,0.1)', color: 'rgba(253,246,238,0.5)', border: '1px solid rgba(253,246,238,0.2)' }}>
                  🔒 ກົດເພື່ອເບິ່ງຕົ້ນທຶນ/ກຳໄລ
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="card text-center">
                <div className="text-xl font-black text-blue-700">{walkinTotal.toLocaleString()}</div>
                <div className="text-xs font-bold mt-1" style={{ color: 'var(--gray3)' }}>🏪 Walk-in</div>
              </div>
              <div className="card text-center">
                <div className="text-xl font-black text-orange-600">{onlineTotal.toLocaleString()}</div>
                <div className="text-xs font-bold mt-1" style={{ color: 'var(--gray3)' }}>🌐 Online</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[['ອໍເດີ', salesOrders.length], ['ກ້ອນ', salesOrders.reduce((s,o)=>{
                const items = typeof o.items==='string'?JSON.parse(o.items):o.items||[]
                return s+items.reduce((ss,it)=>ss+it.qty,0)
              },0)], ['ເຊ່ຍ', salesOrders.length ? Math.round(salesTotal/salesOrders.length).toLocaleString() : 0]].map(([l,n]) => (
                <div key={l} className="card text-center">
                  <div className="text-xl font-black" style={{ color: 'var(--brown)' }}>{n}</div>
                  <div className="text-xs font-bold mt-1" style={{ color: 'var(--gray3)' }}>{l}</div>
                </div>
              ))}
            </div>

            <div className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: 'var(--gray3)' }}>ເມນູຂາຍດີ</div>
            <div className="card">
              {Object.entries(menuCount).sort((a,b)=>b[1]-a[1]).map(([name, qty]) => (
                <div key={name} className="flex justify-between py-2 border-b border-[#f5ebe0] text-sm font-bold" style={{ color: 'var(--brown)' }}>
                  <span>{name}</span><span>{qty} ກ້ອນ</span>
                </div>
              ))}
              {Object.keys(menuCount).length === 0 && <div className="text-center py-4 text-sm font-bold" style={{ color: 'var(--cream3)' }}>ຍັງບໍ່ມີຍອດ</div>}
            </div>
          </div>
        </div>
      )}

      {/* ─── CHAT TAB ─── */}
      {tab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeChatPhone ? (
            // Conversation list
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 font-black text-sm" style={{ color: 'var(--brown)', borderBottom: '1px solid var(--cream3)' }}>
                💬 ຂໍ້ຄວາມຈາກລູກຄ້າ
              </div>
              <div className="flex gap-1.5 px-3 py-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--cream3)', background: 'var(--cream)' }}>
                {[
                  { key: null,        icon: '💬', label: 'ທັງໝົດ' },
                  { key: 'order',     icon: '🛒', label: 'ຢາກສັ່ງ' },
                  { key: 'question',  icon: '❓', label: 'ຖາມ' },
                  { key: 'problem',   icon: '⚠️', label: 'ບັນຫາ' },
                  { key: 'staff',     icon: '👤', label: 'ຮຽກ' },
                ].map(t => (
                  <button key={String(t.key)} onClick={() => setLabelFilter(t.key)}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black transition-all"
                    style={{
                      background: labelFilter === t.key ? 'var(--brown)' : 'var(--cream2)',
                      color: labelFilter === t.key ? 'var(--cream)' : 'var(--brown)',
                    }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {chatConvos.length === 0 && (
                <div className="text-center py-16 text-sm font-bold" style={{ color: 'var(--cream3)' }}>
                  ຍັງບໍ່ມີຂໍ້ຄວາມ
                </div>
              )}
              {[...chatConvos].filter(c => !labelFilter || chatLabels[c.phone] === labelFilter || (labelFilter === 'staff' && aiPausedPhones.has(c.phone))).sort((a, b) => {
                const aNeeds = aiPausedPhones.has(a.phone) && a.unread > 0
                const bNeeds = aiPausedPhones.has(b.phone) && b.unread > 0
                if (aNeeds !== bNeeds) return aNeeds ? -1 : 1
                if (a.unread !== b.unread) return b.unread - a.unread
                return new Date(b.lastAt) - new Date(a.lastAt)
              }).map(c => {
                const needsStaff = aiPausedPhones.has(c.phone) && c.unread > 0
                const label = chatLabels[c.phone]
                const LABEL_META = { order: { icon: '🛒', color: '#16a34a' }, question: { icon: '❓', color: '#2563eb' }, problem: { icon: '⚠️', color: '#dc2626' }, staff: { icon: '👤', color: '#d97706' } }
                return (
                <button key={c.phone} onClick={() => openConvo(c.phone)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[#f5ebe0]"
                  style={{ background: needsStaff ? 'rgba(251,191,36,0.10)' : c.unread > 0 ? 'rgba(61,31,10,0.04)' : 'transparent' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-lg"
                    style={{ background: needsStaff ? '#fef3c7' : 'var(--cream2)', color: 'var(--brown)' }}>
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-sm truncate" style={{ color: 'var(--brown)' }}>{c.name}</span>
                      {needsStaff ? (
                        <span className="flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#f59e0b', color: 'white' }}>ລໍພະນັກງານ</span>
                      ) : (
                        <span className="text-[10px] font-bold flex-shrink-0" style={{ color: 'var(--gray3)' }}>
                          {new Date(c.lastAt).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate" style={{ color: 'var(--gray3)' }}>{c.phone}</span>
                      {c.unread > 0 && (
                        <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">{c.unread}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {label && LABEL_META[label] && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: LABEL_META[label].color + '18', color: LABEL_META[label].color }}>
                          {LABEL_META[label].icon} {label === 'order' ? 'ຢາກສັ່ງ' : label === 'question' ? 'ຖາມ' : label === 'problem' ? 'ບັນຫາ' : 'ຮຽກ'}
                        </span>
                      )}
                      <span className="text-xs truncate" style={{ color: 'var(--brown2)' }}>{c.lastMsg}</span>
                    </div>
                  </div>
                </button>
                )
              })}
            </div>
          ) : (
            // Conversation messages
            <div className="flex flex-col" style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: chatKbH,
              zIndex: 30, background: 'var(--cream)'
            }}>
              <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'var(--brown)' }}>
                <button onClick={() => { setActiveChatPhone(null); setChatMessages([]) }}
                  className="text-xl font-black" style={{ color: 'var(--cream)' }}>←</button>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm truncate" style={{ color: 'var(--cream)' }}>
                    {chatConvos.find(c => c.phone === activeChatPhone)?.name || activeChatPhone}
                  </div>
                  <div className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.6)' }}>{activeChatPhone}</div>
                </div>
                {/* AI toggle */}
                <button
                  onClick={() => toggleAiForPhone(activeChatPhone)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95"
                  style={{
                    background: aiPausedPhones.has(activeChatPhone) ? 'rgba(255,255,255,0.15)' : '#16a34a',
                    color: 'white',
                  }}>
                  🤖 {aiPausedPhones.has(activeChatPhone) ? 'AI OFF' : 'AI ON'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {chatMessages.map(msg => {
                  const isStaffSide = msg.sender === 'staff' || msg.sender === 'ai'
                  const isAi = msg.sender === 'ai'
                  return (
                  <div key={msg.id} className={`flex ${isStaffSide ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'customer' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 self-end mb-1 font-black"
                        style={{ background: 'var(--cream2)', color: 'var(--brown)' }}>
                        {msg.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="max-w-[75%]">
                      {msg.qnum && msg.sender === 'customer' && (
                        <div className="text-[10px] font-black mb-1 px-1" style={{ color: 'var(--gray3)' }}>
                          Order #{String(msg.qnum).padStart(4, '0')}
                        </div>
                      )}
                      {isAi && <div className="text-[10px] font-black mb-1 px-1 text-right" style={{ color: '#16a34a' }}>🤖 AI</div>}
                      <div className="px-4 py-2.5 rounded-2xl text-sm font-bold leading-snug"
                        style={{
                          background: isAi ? '#f0fdf4' : isStaffSide ? 'var(--brown)' : 'white',
                          color: isAi ? '#166534' : isStaffSide ? 'var(--cream)' : 'var(--brown)',
                          border: isAi ? '1.5px solid #86efac' : msg.sender === 'customer' ? '1.5px solid var(--cream3)' : 'none',
                          borderBottomRightRadius: isStaffSide ? 4 : undefined,
                          borderBottomLeftRadius: msg.sender === 'customer' ? 4 : undefined,
                        }}>
                        {msg.text}
                      </div>
                      <div className="text-[10px] font-bold mt-1 px-1"
                        style={{ color: 'var(--gray3)', textAlign: isStaffSide ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  )
                })}
                <div ref={chatBottomRef} />
              </div>
              <div className="p-3 flex gap-2 flex-shrink-0 border-t border-[#e8d5c0]" style={{ background: 'white' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendStaffMsg()}
                  placeholder="ຕອບຂໍ້ຄວາມ..." className="input-field flex-1 py-2.5 text-sm" />
                <button onClick={sendStaffMsg} disabled={chatSending || !chatInput.trim()}
                  className="px-5 py-2.5 rounded-xl font-black text-sm flex-shrink-0"
                  style={{
                    background: chatInput.trim() ? 'var(--brown)' : 'var(--cream3)',
                    color: chatInput.trim() ? 'var(--cream)' : 'var(--gray3)',
                  }}>
                  ສົ່ງ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Order FAB */}
      {tab === 'orders' && !qoOpen && (
        <button
          onClick={() => { resetQo(); setQoOpen(true) }}
          className="fixed bottom-20 right-4 z-40 w-16 h-16 rounded-full flex items-center justify-center text-3xl active:scale-95 transition-all"
          style={{ background: 'var(--brown)', color: 'var(--cream)', boxShadow: '0 4px 20px rgba(61,31,10,0.45)', border: '3px solid var(--cream)' }}
        >
          🛒
        </button>
      )}

      {/* Bottom Nav */}
      <div className="flex flex-shrink-0" style={{ background: 'var(--brown)', borderTop: '2px solid var(--brown2)' }}>
        {[['orders','📋','ອໍເດີ'],['sales','📊','ຍອດຂາຍ']].map(([t,icon,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 flex flex-col items-center py-3 gap-1 border-none text-xs font-bold ${tab===t ? 'text-[#fdf6ee]' : 'text-[rgba(253,246,238,0.45)]'}`} style={{ background: 'transparent' }}>
            <span className="text-2xl">{icon}</span>{l}
          </button>
        ))}
        <button onClick={() => setTab('chat')} className={`flex-1 flex flex-col items-center py-3 gap-1 border-none text-xs font-bold relative ${tab==='chat' ? 'text-[#fdf6ee]' : 'text-[rgba(253,246,238,0.45)]'}`} style={{ background: 'transparent' }}>
          <span className="text-2xl relative inline-block">
            💬
            {unreadChat > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {unreadChat > 9 ? '9+' : unreadChat}
              </span>
            )}
          </span>
          ແຊດ
        </button>
      </div>

      {/* Quick Order Modal */}
      {qoOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--cream)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'var(--brown)' }}>
            <button onClick={() => { setQoOpen(false); resetQo() }} className="text-xl font-black w-8" style={{ color: 'var(--cream)' }}>✕</button>
            <div className="flex-1 font-serif font-black text-lg" style={{ color: 'var(--cream)' }}>🛒 ສັ່ງດ່ວນ</div>
            {qoStep < 3 && (
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(253,246,238,0.15)' }}>
                {[{ id: 'items', label: 'ເລືອກ' }, { id: 'bags', label: 'ຈັດຖົງ' }].map(m => (
                  <button key={m.id}
                    onClick={() => { setQoBagMode(m.id); if (m.id === 'bags') { setQoSelected({}); setQoBagPacks([{}]) } setQoStep(1) }}
                    className="px-3 py-1 rounded-lg text-xs font-black transition-all"
                    style={{ background: qoBagMode === m.id ? 'var(--cream)' : 'transparent', color: qoBagMode === m.id ? 'var(--brown)' : 'rgba(253,246,238,0.6)' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pack toast */}
          {qoPackToast && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full text-base font-black text-white shadow-xl pointer-events-none" style={{ background: 'var(--brown)' }}>
              {qoPackToast}
            </div>
          )}

          {/* Step 1 — items mode */}
          {qoStep === 1 && qoBagMode === 'items' && (
            <>
              <div className="px-4 pt-3 pb-1 flex-shrink-0">
                <input
                  type="text"
                  placeholder="ຊື່ລູກຄ້າ (ຖ້າມີ) · Customer name"
                  value={qoName}
                  onChange={e => setQoName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#e8d5c0] text-sm font-bold outline-none"
                  style={{ background: 'var(--warm-white)', color: 'var(--brown)' }}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {menus.map((m, i) => {
                    const qty = qoSelected[i] || 0
                    const s = stockShop[i] || 0
                    const isOut = s === 0
                    const img = images[i]
                    return (
                      <div key={i} onClick={() => { if (!isOut && qty === 0) setQoSelected(prev => ({ ...prev, [i]: 1 })) }}
                        className={`rounded-2xl overflow-hidden cursor-pointer border-2 transition-all relative ${isOut ? 'opacity-50 cursor-not-allowed border-[#e8d5c0]' : qty > 0 ? 'border-[#3d1f0a]' : 'border-[#e8d5c0]'}`}
                        style={{ background: 'var(--warm-white)' }}>
                        <div className="aspect-square relative overflow-hidden" style={{ background: 'var(--cream2)' }}>
                          {img ? <img src={img} alt={m.lo} className="w-full h-full object-cover" />
                            : <div className="absolute inset-0 flex items-center justify-center text-4xl">{EMOJIS[i] || '🍱'}</div>}
                          {isOut && <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(61,31,10,0.55)' }}><span className="text-white font-black text-sm px-2 py-1 rounded-lg" style={{ background: 'rgba(185,28,28,0.9)' }}>ໝົດ</span></div>}
                          {qty > 0 && <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>{qty}</div>}
                        </div>
                        <div className="p-2">
                          <div className="text-sm font-black leading-tight" style={{ color: 'var(--brown)' }}>{m.lo}</div>
                          <div className="text-sm font-black mt-0.5" style={{ color: 'var(--brown2)' }}>{isOut ? 'ໝົດ' : `${(prices[i] || 0).toLocaleString()} ກີບ`}</div>
                          {!isOut && <div className="text-xs font-bold mt-0.5" style={{ color: s <= 5 ? '#dc2626' : 'var(--gray3)' }}>ເຫຼືອ {s}{s <= 5 ? ' ⚠' : ''}</div>}
                        </div>
                        {qty > 0 && (
                          <div className="flex items-center justify-between px-2 py-2 border-t border-[#e8d5c0]" style={{ background: 'var(--cream2)' }} onClick={e => e.stopPropagation()}>
                            <button onClick={e => { e.stopPropagation(); setQoSelected(prev => { const n = { ...prev }; const next = Math.max(0, (n[i] || 0) - 1); if (next === 0) delete n[i]; else n[i] = next; return n }) }} className="w-8 h-8 rounded-full border-2 border-[#3d1f0a] flex items-center justify-center text-lg font-black" style={{ background: 'var(--warm-white)', color: 'var(--brown)' }}>−</button>
                            <span className="font-black" style={{ color: 'var(--brown)' }}>{qty}</span>
                            <button onClick={e => { e.stopPropagation(); setQoSelected(prev => ({ ...prev, [i]: Math.min(s, (prev[i] || 0) + 1) })) }} className="w-8 h-8 rounded-full border-2 border-[#3d1f0a] flex items-center justify-center text-lg font-black" style={{ background: 'var(--warm-white)', color: 'var(--brown)' }}>+</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              {qoTotalItems > 0 && (
                <div className="p-4 border-t-2 border-[#e8d5c0] flex-shrink-0" style={{ background: 'var(--warm-white)' }}>
                  <div className="flex justify-between mb-3 px-1">
                    <span className="text-sm font-black" style={{ color: 'var(--brown)' }}>🛍 {qoTotalItems} ກ້ອນ</span>
                    <span className="text-sm font-black" style={{ color: 'var(--brown)' }}>{qoTotalPrice.toLocaleString()} ກີບ</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button onClick={() => submitQuickOrder('cash')} disabled={qoSubmitting}
                      className="py-4 rounded-2xl font-black text-base text-white active:scale-95 transition-all"
                      style={{ background: '#15803d' }}>
                      {qoSubmitting ? '...' : '💵 ສດ'}
                    </button>
                    <button onClick={() => submitQuickOrder('qr')} disabled={qoSubmitting}
                      className="py-4 rounded-2xl font-black text-base text-white active:scale-95 transition-all"
                      style={{ background: '#1d4ed8' }}>
                      {qoSubmitting ? '...' : '📱 ໂອນ'}
                    </button>
                  </div>
                  <button className="btn-outline py-2 text-xs w-full" onClick={() => setQoStep(2)}>ຈັດຖົງ / Pack bags →</button>
                </div>
              )}
            </>
          )}

          {/* Step 1 — bags mode */}
          {qoStep === 1 && qoBagMode === 'bags' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-5xl mb-4">🛍</div>
              <div className="font-black text-lg mb-2" style={{ color: 'var(--brown)' }}>ຈັດຖົງໂດຍກົງ</div>
              <div className="text-sm font-bold mb-6" style={{ color: 'var(--gray3)' }}>ໃສ່ສິນຄ້າໃນແຕ່ລະຖົງໄດ້ທັນທີ<br/>ບໍ່ຈຳເປັນຕ້ອງເລືອກຈຳນວນລວມກ່ອນ</div>
              <button className="btn-primary w-full max-w-xs" onClick={() => setQoStep(2)}>ຈັດຖົງ →</button>
            </div>
          )}

          {/* Step 2 — bag packing */}
          {qoStep === 2 && (
            <>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* Quick options (items mode only) */}
                {qoBagMode === 'items' && (
                  <div className="grid grid-cols-3 gap-3">
                    {[{ id: 'single', icon: '🛍', label: 'ຖົງດຽວ' }, { id: 'bytype', icon: '🛍🛍', label: 'ແຍກເມນູ' }, { id: 'each', icon: '🛍🛍🛍', label: 'ແຍກທຸກກ້ອນ' }].map(opt => (
                      <button key={opt.id} onClick={() => qoHandleQuickBag(opt.id)}
                        className="rounded-2xl p-3 text-center active:scale-95 transition-all"
                        style={{ background: 'var(--warm-white)', border: '2px solid #e8d5c0' }}>
                        <div className="text-2xl mb-1">{opt.icon}</div>
                        <div className="font-black text-xs" style={{ color: 'var(--brown)' }}>{opt.label}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Bag list */}
                {qoBagPacks.map((bag, n) => {
                  const bagItems = Object.entries(bag).filter(([, q]) => q > 0)
                  return (
                    <div key={n} className="rounded-2xl border-2 border-[#3d1f0a] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap" style={{ background: 'var(--brown)' }}>
                        <div className="font-serif font-black flex-shrink-0" style={{ color: 'var(--cream)' }}>ຖົງ {n + 1}</div>
                        <div className="flex gap-1 flex-wrap">
                          {bagItems.length === 0 && <span className="text-xs font-bold" style={{ color: 'rgba(253,246,238,0.5)' }}>ຫວ່າງ</span>}
                          {bagItems.map(([idx, qty]) => (
                            <button key={idx} onClick={() => qoRemoveItemFromBag(n, +idx)}
                              className="px-2 py-1 rounded-lg text-xs font-black" style={{ background: 'rgba(253,246,238,0.2)', color: 'var(--cream)' }}>
                              {menus[+idx]?.lo} ×{qty} ✕
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 flex flex-wrap gap-2" style={{ background: 'var(--warm-white)' }}>
                        {menus.map((m, i) => {
                          const img = images[i]
                          const s = stockShop[i] || 0
                          const qtyInBag = bag[i] || 0
                          if (qoBagMode === 'items') {
                            if (!(qoSelected[i] > 0)) return null
                            const totalPacked = qoBagPacks.reduce((acc, b) => acc + (b[i] || 0), 0)
                            const isDisabled = totalPacked >= (qoSelected[i] || 0)
                            return (
                              <button key={i} disabled={isDisabled} onClick={() => qoAddItemToBag(n, i)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black transition-transform ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                                style={{ background: 'var(--cream)', border: `2px solid ${qtyInBag > 0 ? 'var(--brown)' : '#e8d5c0'}`, color: 'var(--brown)' }}>
                                {img ? <img src={img} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" /> : <span className="text-xl">{EMOJIS[i] || '🍱'}</span>}
                                <span>{m.lo}</span>
                                {qtyInBag > 0 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>{qtyInBag}</span>}
                              </button>
                            )
                          } else {
                            const sTotal = stockTotal[i] || 0
                            if (s === 0 && sTotal === 0) return null
                            return (
                              <button key={i} onClick={() => qoAddItemToBag(n, i)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black active:scale-95 transition-transform"
                                style={{ background: 'var(--cream)', border: `2px solid ${qtyInBag > 0 ? 'var(--brown)' : '#e8d5c0'}`, color: 'var(--brown)' }}>
                                {img ? <img src={img} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" /> : <span className="text-xl">{EMOJIS[i] || '🍱'}</span>}
                                <span>{m.lo}</span>
                                {qtyInBag > 0 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>{qtyInBag}</span>}
                              </button>
                            )
                          }
                        })}
                      </div>
                    </div>
                  )
                })}

                <button onClick={() => setQoBagPacks(prev => [...prev, {}])}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black self-end active:scale-95 transition-all"
                  style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                  ➕ ເພີ່ມຖົງ
                </button>
              </div>

              {!qoBagPacks.every(b => !Object.keys(b).length) && (
                <div className="p-4 border-t-2 border-[#e8d5c0] flex-shrink-0" style={{ background: 'var(--warm-white)' }}>
                  <div className="flex justify-between mb-3 px-1">
                    <span className="font-black" style={{ color: 'var(--brown)' }}>ລວມ {qoTotalItems} ກ້ອນ</span>
                    <span className="font-black" style={{ color: 'var(--brown)' }}>{qoTotalPrice.toLocaleString()} ກີບ</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => submitQuickOrder('cash')} disabled={qoSubmitting}
                      className="py-4 rounded-2xl font-black text-base text-white" style={{ background: '#15803d' }}>
                      {qoSubmitting ? '...' : '💵 ສດ · ຮັບຄິວ'}
                    </button>
                    <button onClick={() => submitQuickOrder('qr')} disabled={qoSubmitting}
                      className="py-4 rounded-2xl font-black text-base text-white" style={{ background: '#1d4ed8' }}>
                      {qoSubmitting ? '...' : '📱 ໂອນ · ຮັບຄິວ'}
                    </button>
                  </div>
                  <button className="btn-outline mt-2 py-3 text-sm w-full" onClick={() => setQoStep(1)}>← ກັບຄືນ</button>
                </div>
              )}
            </>
          )}

          {/* Step 3 — done */}
          {qoStep === 3 && qoQnum && (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-[#3d1f0a] shadow-xl text-center">
                <div className="py-5" style={{ background: 'var(--brown)' }}>
                  <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>ສຳເລັດ ✅</div>
                </div>
                <div className="py-8 px-4" style={{ background: 'var(--warm-white)' }}>
                  <div className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: 'var(--gray3)' }}>ເລກຄິວ · QUEUE</div>
                  <div className="font-serif font-black leading-none" style={{ fontSize: 96, color: 'var(--brown)' }}>
                    {String(qoQnum).padStart(4, '0')}
                  </div>
                </div>
              </div>
              <button
                className="mt-6 w-full max-w-sm py-5 rounded-2xl font-black text-xl text-white active:scale-95 transition-all"
                style={{ background: 'var(--brown)' }}
                onClick={resetQo}>
                🛒 ລູກຄ້າຕໍ່ໄປ
              </button>
              <button className="btn-outline mt-2 w-full max-w-sm py-3" onClick={() => { setQoOpen(false); resetQo() }}>ປິດ</button>
            </div>
          )}
        </div>
      )}

      {/* Batch Confirm Modal */}
      {batchOpen && (() => {
        const pendingOnline = orders.filter(o =>
          o.type === 'online' && o.status === 'pending' && !o.done && !o.cancelled
        ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        const withSlip = pendingOnline.filter(o => o.slip_url)
        const allSlipSelected = withSlip.length > 0 && withSlip.every(o => batchSelected.has(o.id))
        return (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--cream)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'var(--brown)' }}>
              <button onClick={() => setBatchOpen(false)} className="text-xl font-black w-8" style={{ color: 'var(--cream)' }}>✕</button>
              <div className="flex-1 font-serif font-black text-lg" style={{ color: 'var(--cream)' }}>📋 ເລືອກ Preorder</div>
              <button
                onClick={() => {
                  if (allSlipSelected) setBatchSelected(new Set())
                  else setBatchSelected(new Set(withSlip.map(o => o.id)))
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-black active:scale-95 transition-all"
                style={{ background: allSlipSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)', color: 'var(--cream)' }}
              >
                {allSlipSelected ? '☐ ຍົກເລີກທັງໝົດ' : '☑ ເລືອກທີ່ມີສລິບ'}
              </button>
            </div>

            {/* Order list */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {pendingOnline.length === 0 && (
                <div className="text-center py-16 font-bold" style={{ color: 'var(--gray3)' }}>ບໍ່ມີ Preorder ຄ້າງ</div>
              )}
              {pendingOnline.map(o => {
                const customer = (() => { try { return JSON.parse(o.customer || '{}') } catch { return {} } })()
                const selected = batchSelected.has(o.id)
                const hasSlip = !!o.slip_url
                return (
                  <button
                    key={o.id}
                    onClick={() => {
                      if (!hasSlip) return
                      setBatchSelected(prev => {
                        const n = new Set(prev)
                        n.has(o.id) ? n.delete(o.id) : n.add(o.id)
                        return n
                      })
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-[0.98]"
                    style={{
                      background: selected ? '#dcfce7' : 'var(--warm-white)',
                      border: `2px solid ${selected ? '#16a34a' : hasSlip ? 'var(--cream3)' : '#f3e8e0'}`,
                      opacity: hasSlip ? 1 : 0.5,
                    }}
                  >
                    {/* Checkbox */}
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: selected ? '#16a34a' : 'var(--cream2)', border: `2px solid ${selected ? '#16a34a' : 'var(--cream3)'}` }}>
                      {selected && <span className="text-white text-xs font-black">✓</span>}
                    </div>
                    {/* Queue number */}
                    <div className="w-14 flex-shrink-0 font-black text-lg text-center" style={{ color: 'var(--brown)', fontVariantNumeric: 'tabular-nums' }}>
                      {String(o.qnum).padStart(4, '0')}
                    </div>
                    {/* Customer info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: 'var(--brown)' }}>
                        {customer.name || '—'}
                      </div>
                      <div className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>
                        {customer.phone || ''}
                      </div>
                    </div>
                    {/* Total */}
                    <div className="text-sm font-black flex-shrink-0" style={{ color: 'var(--brown2)' }}>
                      {(o.total || 0).toLocaleString()}
                    </div>
                    {/* Slip indicator */}
                    <div className="w-7 flex-shrink-0 text-center text-base">
                      {hasSlip ? '📎' : '—'}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 flex gap-3" style={{ borderTop: '1px solid var(--cream3)', background: 'var(--warm-white)' }}>
              <button
                onClick={() => setBatchOpen(false)}
                className="flex-1 py-4 rounded-2xl font-black text-base border-2"
                style={{ borderColor: 'var(--cream3)', color: 'var(--brown2)' }}
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={confirmBatch}
                disabled={batchSelected.size === 0}
                className="flex-[3] py-4 rounded-2xl font-black text-base text-white transition-all active:scale-95"
                style={{ background: batchSelected.size > 0 ? '#15803d' : '#a3a3a3' }}
              >
                ✓ ຢືນຢັນ {batchSelected.size > 0 ? `${batchSelected.size} ລາຍການ` : ''}
              </button>
            </div>
          </div>
        )
      })()}

      {/* Edit Order Modal */}
      {editOrder && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--cream)' }}>
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'var(--brown)' }}>
            <button onClick={() => setEditOrder(null)} className="text-xl font-black w-8" style={{ color: 'var(--cream)' }}>✕</button>
            <div className="flex-1 font-serif font-black text-lg" style={{ color: 'var(--cream)' }}>
              ✏️ ແກ້ໄຂ #{String(editOrder.qnum).padStart(4, '0')}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {menus.map((m, i) => {
                const qty = editItems[i] || 0
                const stockArr = editOrder.type === 'online' ? stockOnline : stockShop
                const oldItems = typeof editOrder.items === 'string' ? JSON.parse(editOrder.items) : editOrder.items || []
                const oldQty = oldItems.find(it => it.menuIdx === i)?.qty || 0
                const available = (stockArr[i] || 0) + oldQty
                const isOut = available === 0
                const img = images[i]
                return (
                  <div key={i} className={`rounded-2xl overflow-hidden border-2 transition-all ${qty > 0 ? 'border-[#3d1f0a]' : 'border-[#e8d5c0]'}`} style={{ background: 'var(--warm-white)' }}>
                    <div className="aspect-square relative overflow-hidden" style={{ background: 'var(--cream2)' }}>
                      {img ? <img src={img} alt={m.lo} className="w-full h-full object-cover" />
                        : <div className="absolute inset-0 flex items-center justify-center text-4xl">{EMOJIS[i] || '🍱'}</div>}
                      {qty > 0 && <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: 'var(--brown)', color: 'var(--cream)' }}>{qty}</div>}
                    </div>
                    <div className="p-2">
                      <div className="text-sm font-black leading-tight" style={{ color: 'var(--brown)' }}>{m.lo}</div>
                      <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>{(prices[i] || 0).toLocaleString()} ກີບ</div>
                    </div>
                    <div className="flex items-center justify-between px-2 py-2 border-t border-[#e8d5c0]" style={{ background: 'var(--cream2)' }}>
                      <button
                        onClick={() => setEditItems(prev => { const n = { ...prev }; const next = Math.max(0, (n[i] || 0) - 1); if (next === 0) delete n[i]; else n[i] = next; return n })}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-black disabled:opacity-30"
                        style={{ borderColor: 'var(--brown)', background: 'var(--warm-white)', color: 'var(--brown)' }}>−</button>
                      <span className="font-black text-sm" style={{ color: 'var(--brown)' }}>{qty}</span>
                      <button
                        onClick={() => setEditItems(prev => ({ ...prev, [i]: Math.min(available, (prev[i] || 0) + 1) }))}
                        disabled={isOut || qty >= available}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-black disabled:opacity-30"
                        style={{ borderColor: 'var(--brown)', background: 'var(--warm-white)', color: 'var(--brown)' }}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="p-4 border-t-2 border-[#e8d5c0] flex-shrink-0" style={{ background: 'var(--warm-white)' }}>
            <div className="flex justify-between mb-3 px-1">
              <span className="font-black" style={{ color: 'var(--brown)' }}>
                {Object.values(editItems).reduce((s, q) => s + q, 0)} ກ້ອນ
              </span>
              <span className="font-black" style={{ color: 'var(--brown)' }}>
                {Object.entries(editItems).reduce((s, [i, q]) => s + (prices[+i] || 0) * q, 0).toLocaleString()} ກີບ
              </span>
            </div>
            <button onClick={saveEditOrder} disabled={editSaving} className="btn-primary w-full">
              {editSaving ? '...' : '✅ ບັນທຶກການແກ້ໄຂ'}
            </button>
            <button onClick={() => setEditOrder(null)} className="btn-outline mt-2 w-full py-3 text-sm">ຍົກເລີກ</button>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      {slipModal && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--cream)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'var(--brown)' }}>
            <button onClick={() => setSlipModal(null)}
              className="flex items-center gap-1 font-black text-base active:opacity-70"
              style={{ color: 'var(--cream)', background: 'none', border: 'none' }}>
              ← ປິດ
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-lg">🧾</span>
              <span className="font-black text-base" style={{ color: 'var(--cream)' }}>
                ສລິບ {slipModal.qnum ? `#${String(slipModal.qnum).padStart(4, '0')}` : ''}
              </span>
            </div>
          </div>
          {/* Slip image — scrollable */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center p-4">
            <img src={slipModal.url} className="w-full max-w-lg rounded-2xl" alt="slip" />
          </div>
        </div>
      )}

      {/* PIN Modal Overlay */}
      {pinMode && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(61,31,10,0.85)' }}>
          <div className="w-full max-w-xs mx-4 rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'var(--cream)' }}>
            <PinPad
              title={
                pinMode === 'profit' ? '🔒 Profit' :
                (pinMode === 'set-staff' || pinMode === 'set-profit') ? '🔑 ຕັ້ງລະຫັດ' :
                '🗑 ລຶບລະຫັດ'
              }
              subtitle={pinModeSubtitle()}
              onSubmit={handlePinModeSubmit}
              pinInput={pinInput} setPinInput={setPinInput}
              error={pinError} setError={setPinError}
              onCancel={() => { setPinMode(null); setPinInput(''); setPinError(''); setPinStep(1); setPinNew('') }}
            />
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{ background: 'rgba(61,31,10,0.65)' }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--warm-white)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 text-center" style={{ background: 'var(--brown)' }}>
              <div className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>
                ຢືນຢັນ · Confirm
              </div>
            </div>

            {/* Message */}
            <div className="px-6 py-6 text-center">
              <div className="font-bold text-base leading-relaxed" style={{ color: 'var(--brown)' }}>
                {confirmModal.message}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 rounded-2xl font-black text-sm border-2"
                style={{ borderColor: 'var(--cream3)', color: 'var(--gray3)', background: 'var(--cream2)' }}
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={() => {
                  const cb = confirmModal.onConfirm
                  setConfirmModal(null)
                  cb()
                }}
                className="flex-1 py-3 rounded-2xl font-black text-sm text-white"
                style={{ background: '#dc2626' }}
              >
                ຢືນຢັນ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function PinPad({ title, subtitle, onSubmit, pinInput, setPinInput, error, setError, onCancel, fullScreen }) {
  function press(digit) {
    if (pinInput.length >= 6) return
    setError('')
    const next = pinInput + digit
    setPinInput(next)
    if (next.length === 6) setTimeout(() => onSubmit(next), 120)
  }
  function del() { setError(''); setPinInput(pinInput.slice(0, -1)) }

  const inner = (
    <div className="flex flex-col items-center py-10 px-6">
      <div className="font-serif text-2xl font-black mb-1" style={{ color: 'var(--brown)' }}>{title}</div>
      <div className="text-sm font-bold mb-7" style={{ color: 'var(--gray3)' }}>{subtitle}</div>
      {/* 6 dots */}
      <div className="flex gap-4 mb-4">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="w-4 h-4 rounded-full border-2 transition-all"
            style={{ borderColor: 'var(--brown)', background: i < pinInput.length ? 'var(--brown)' : 'transparent' }} />
        ))}
      </div>
      <div className="h-6 mb-3 flex items-center justify-center">
        {error && <span className="text-sm font-black text-red-600">{error}</span>}
      </div>
      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => press(String(n))}
            className="w-20 h-16 rounded-2xl text-2xl font-black transition-opacity active:opacity-60"
            style={{ background: 'var(--warm-white)', color: 'var(--brown)', border: '2px solid var(--cream3)' }}>
            {n}
          </button>
        ))}
        <button onClick={onCancel}
          className="w-20 h-16 rounded-2xl text-xs font-black transition-opacity active:opacity-60"
          style={{ background: 'var(--cream2)', color: 'var(--gray3)', border: '2px solid var(--cream3)' }}>
          ຍົກເລີກ
        </button>
        <button onClick={() => press('0')}
          className="w-20 h-16 rounded-2xl text-2xl font-black transition-opacity active:opacity-60"
          style={{ background: 'var(--warm-white)', color: 'var(--brown)', border: '2px solid var(--cream3)' }}>
          0
        </button>
        <button onClick={del}
          className="w-20 h-16 rounded-2xl text-2xl font-black transition-opacity active:opacity-60"
          style={{ background: 'var(--cream2)', color: 'var(--brown)', border: '2px solid var(--cream3)' }}>
          ⌫
        </button>
      </div>
    </div>
  )

  if (fullScreen) return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      {inner}
    </div>
  )
  return inner
}
