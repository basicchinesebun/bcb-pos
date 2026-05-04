'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const EMOJIS = ['🥟','🍫','🍵','🧁','🍞','🥐','🍮']

const STATUS_COLORS = {
  walkin: 'bg-blue-50 text-blue-700',
  online: 'bg-orange-50 text-orange-700',
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  done: 'bg-green-100 text-green-900',
  called: 'bg-[#3d1f0a] text-[#fdf6ee]',
}

export default function StaffPage() {
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [menus, setMenus] = useState([])
  const [prices, setPrices] = useState([])
  const [stockTotal, setStockTotal] = useState([])
  const [stockShop, setStockShop] = useState([])
  const [stockOnline, setStockOnline] = useState([])
  const [images, setImages] = useState({})
  const [imgPreviews, setImgPreviews] = useState({})
  const [qrImage, setQrImage] = useState(null)
  const [qrPreview, setQrPreview] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun', address: '', phone: '', footer: 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ', logo: '' })
  const [settings, setSettings] = useState({ soundOn: true, walkinOn: true, onlineOn: true, autoprintOn: false })
  const [branches, setBranches] = useState([
    { id: 'simeuang',  name: 'ສາຂາສີເມື່ອງ',  nameEn: 'Si Meuang Branch',  visible: true, schedule: 'ຈ · ພ · ສ (Mon / Wed / Fri)', mapUrl: '', facebookUrl: '', tiktokUrl: '', phone1: '', phone2: '', whatsapp: '' },
    { id: 'houayhong', name: 'ສາຂາຫວຍຫົງ', nameEn: 'Houay Hong Branch', visible: true, schedule: 'ຄ · ສກ · ອ (Tue / Thu / Sat)', mapUrl: '', facebookUrl: '', tiktokUrl: '', phone1: '', phone2: '', whatsapp: '' },
  ])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState([])
  const [slipModal, setSlipModal] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null) // { message, onConfirm }

  const [archiveOpen, setArchiveOpen] = useState(false)
  const [expandedArchive, setExpandedArchive] = useState(new Set())
  const [salesDate, setSalesDate] = useState(new Date().toISOString().split('T')[0])
  const [isOnline, setIsOnline] = useState(true)
  const [liveStatus, setLiveStatus] = useState('connecting') // 'live' | 'connecting' | 'error'
  const [loading, setLoading] = useState(true)
  const voicesRef = useRef([])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    loadAll()
    const timer = setTimeout(() => setLoading(false), 6000)

    // Real-time orders — direct state mutations (instant UI) + status tracking
    const ch = supabase.channel('staff-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        payload => setOrders(prev => [payload.new, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        payload => setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' },
        payload => setOrders(prev => prev.filter(o => o.id !== payload.old.id)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config' }, () => loadConfig())
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

  function showToast(msg, type = '') {
    const id = Date.now() + Math.random()
    setToast(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToast(prev => prev.filter(t => t.id !== id)), 3000)
  }

  function showConfirm(message, onConfirm) {
    setConfirmModal({ message, onConfirm })
  }

  function announce(qnum) {
    if (!settings.soundOn) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(`หมายเลข ${String(qnum).padStart(3, '0')} รับสินค้าได้เลยค่ะ`)
    const v = voicesRef.current.find(v => v.lang === 'th-TH') || voicesRef.current[0]
    if (v) u.voice = v
    u.lang = 'th-TH'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  async function loadAll() {
    await Promise.all([loadOrders(), loadConfig()])
    setLoading(false)
  }

  async function loadOrders() {
    if (!supabase) return
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  const DEFAULT_MENUS = [
    { lo: 'ຊາລາເປົາໝູສັບ', en: 'Pork Steamed Bun' },
    { lo: 'ໝັນໂຖ Dark Chocolate', en: 'Dark Choc Mantou' },
    { lo: 'ໝັນໂຖ Matcha', en: 'Matcha Mantou' },
    { lo: 'ເມນູ 4', en: 'Menu 4' },
    { lo: 'ເມນູ 5', en: 'Menu 5' },
    { lo: 'ເມນູ 6', en: 'Menu 6' },
    { lo: 'ເມນູ 7', en: 'Menu 7' },
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
    const loadedStockTotal = cfg.stock_total ? JSON.parse(cfg.stock_total) : new Array(loadedMenus.length).fill(0)
    const loadedStockShop = cfg.stock_shop ? JSON.parse(cfg.stock_shop) : new Array(loadedMenus.length).fill(0)
    const loadedStockOnline = cfg.stock_online ? JSON.parse(cfg.stock_online) : new Array(loadedMenus.length).fill(0)

    setMenus(loadedMenus)
    setPrices(loadedPrices)
    setStockTotal(loadedStockTotal)
    setStockShop(loadedStockShop)
    setStockOnline(loadedStockOnline)
    // ตรวจสต็อกต่ำหลังโหลด
    setTimeout(() => checkLowStock(loadedStockShop), 500)
    if (cfg.menu_images) setImages(JSON.parse(cfg.menu_images))
    if (cfg.qr_image) setQrImage(cfg.qr_image)
    if (cfg.shop_info) setShopInfo(prev => ({ ...prev, ...JSON.parse(cfg.shop_info) }))
    // Fix stale closure: use functional update for settings
    if (cfg.settings) setSettings(prev => ({ ...prev, ...JSON.parse(cfg.settings) }))
    if (cfg.branches) setBranches(JSON.parse(cfg.branches))

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

  // ─── Orders ───
  const filteredOrders = orders.filter(o => {
    if (filter !== 'all' && o.type !== filter) return false
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    if (String(o.qnum).includes(q)) return true
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    if (items.some(it => (it.name || '').toLowerCase().includes(q))) return true
    if (o.customer) {
      const c = typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer
      if ((c.name || '').toLowerCase().includes(q)) return true
      if ((c.phone || '').includes(q)) return true
    }
    return false
  })
  const activeOrders = filteredOrders.filter(o => !o.done && !o.cancelled && o.status !== 'rejected')
  const archivedOrders = filteredOrders.filter(o => o.done || o.cancelled || o.status === 'rejected')
  const waiting = orders.filter(o => !o.done && !o.cancelled && o.status !== 'rejected').length
  const done = orders.filter(o => o.done).length
  const pendingOnline = orders.filter(o => o.type === 'online' && o.status === 'pending' && !o.cancelled).length
  const LOW_STOCK = 5
  const lowStockMenus = menus.map((m, i) => ({ name: m.lo, shop: stockShop[i] || 0, online: stockOnline[i] || 0 }))
    .filter(m => m.shop <= LOW_STOCK || m.online <= LOW_STOCK)

  async function doneOrder(o) {
    const doneAt = new Date().toISOString()
    // Optimistic update — moves card to archive immediately without waiting for realtime
    setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, done: true, done_at: doneAt } : ord))
    await supabase.from('orders').update({ done: true, done_at: doneAt }).eq('id', o.id)
    announce(o.qnum)
    showToast(`✅ ຄິວ ${String(o.qnum).padStart(3,'0')} Done`, 'green')
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
    showToast(`✅ ຢືນຢັນ #${String(o.qnum).padStart(3,'0')}`, 'green')
    if (settings.autoprintOn) setTimeout(() => smartPrint(o), 300)
  }

  function rejectOrder(o) {
    showConfirm('ຢືນຢັນການຍົກເລີກອໍເດີນີ້ບໍ?', async () => {
      // Optimistic update — vanish from active list immediately
      setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, status: 'rejected' } : ord))
      // Return stock
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
      const newStock = [...stockOnline]
      items.forEach(it => { newStock[it.menuIdx] = (newStock[it.menuIdx] || 0) + it.qty })
      await saveConfig('stock_online', newStock)
      await supabase.from('orders').update({ status: 'rejected' }).eq('id', o.id)
      showToast('✕ ປະຕິເສດ', 'orange')
    })
  }

  function cancelOrder(o) {
    showConfirm('ຢືນຢັນການຍົກເລີກອໍເດີນີ້ບໍ?', async () => {
      // Optimistic update
      setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, cancelled: true } : ord))
      const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
      const arr = o.type === 'online' ? [...stockOnline] : [...stockShop]
      items.forEach(it => { arr[it.menuIdx] = (arr[it.menuIdx] || 0) + it.qty })
      await saveConfig(o.type === 'online' ? 'stock_online' : 'stock_shop', arr)
      await supabase.from('orders').update({ cancelled: true }).eq('id', o.id)
      showToast('ຍົກເລີກ', 'orange')
    })
  }

  async function undoOrder(id, field) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, [field]: false } : o))
    await supabase.from('orders').update({ [field]: false }).eq('id', id)
  }

  // ─── Menus ───
  async function saveMenus() {
    const newMenus = menus.map((m, i) => ({
      ...m,
      lo: document.getElementById(`mn-${i}`)?.value || m.lo,
    }))
    const newPrices = menus.map((_, i) => parseInt(document.getElementById(`mp-${i}`)?.value || 0) || 0)
    await saveConfig('menus', newMenus)
    await saveConfig('prices', newPrices)
    showToast('ບັນທຶກເມນູ ✅', 'green')
  }

  async function uploadMenuImg(e, i) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImgPreviews(prev => ({ ...prev, [i]: ev.target.result }))
    reader.readAsDataURL(file)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const contentType = file.type || (ext === 'png' ? 'image/png' : 'image/jpeg')
    const { error } = await supabase.storage.from('bcb - upload').upload(`menu/${i}.${ext}`, file, { upsert: true, contentType })
    if (error) { console.error('uploadMenuImg error:', error); showToast('❌ ' + (error.message || 'ອັບໂຫລດຜິດ'), 'red'); setImgPreviews(prev => { const n = {...prev}; delete n[i]; return n }); return }
    const { data } = supabase.storage.from('bcb - upload').getPublicUrl(`menu/${i}.${ext}`)
    const newImg = { ...images, [i]: data.publicUrl }
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
    const contentType = file.type || 'image/jpeg'
    const { error } = await supabase.storage.from('bcb - upload').upload('qr/payment.jpg', file, { upsert: true, contentType })
    if (error) { console.error('uploadQR error:', error); showToast('❌ ' + (error.message || 'ຜິດ'), 'red'); setQrPreview(null); return }
    const { data } = supabase.storage.from('bcb - upload').getPublicUrl('qr/payment.jpg')
    setQrImage(data.publicUrl)
    setQrPreview(null)
    await saveConfig('qr_image', data.publicUrl)
    showToast('ອັບໂຫລດ QR ✅', 'green')
  }

  // ─── Shop Info + Logo ───
  async function saveShopInfo() {
    const info = {
      name: document.getElementById('si-name')?.value || shopInfo.name,
      address: document.getElementById('si-addr')?.value || '',
      phone: document.getElementById('si-phone')?.value || '',
      footer: document.getElementById('si-footer')?.value || 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ',
      logo: shopInfo.logo || '',
    }
    await saveConfig('shop_info', info)
    setShopInfo(info)
    showToast('ບັນທຶກ ✅', 'green')
  }

  async function uploadLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
    const contentType = file.type || 'image/jpeg'
    const { error } = await supabase.storage.from('bcb - upload').upload('shop/logo.jpg', file, { upsert: true, contentType })
    if (error) { console.error('uploadLogo error:', error); showToast('❌ ' + (error.message || 'ອັບໂຫລດຜິດ'), 'red'); setLogoPreview(null); return }
    const { data } = supabase.storage.from('bcb - upload').getPublicUrl('shop/logo.jpg')
    const newInfo = { ...shopInfo, logo: data.publicUrl }
    setShopInfo(newInfo)
    setLogoPreview(null)
    await saveConfig('shop_info', newInfo)
    showToast('ອັບໂຫລດໂລໂກ້ ✅', 'green')
  }

  async function removeLogo() {
    const newInfo = { ...shopInfo, logo: '' }
    await saveConfig('shop_info', newInfo)
    setShopInfo(newInfo)
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
    const data = buildEscPos(o)
    const chunkSize = 64
    try {
      for (let i = 0; i < data.length; i += chunkSize) {
        await usbDeviceRef.current.transferOut(usbEndpointRef.current.endpointNumber, data.slice(i, i + chunkSize))
      }
      showToast('ພິມແລ້ວ ✅', 'green')
    } catch (e) {
      showToast('❌ USB ພິມຜິດ', 'red')
    }
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
    write(String(o.qnum).padStart(3, '0'), { align: 1, big: true, bold: true })
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
    const data = buildEscPos(o)
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
      } catch (e) { showToast('❌ ພິມຜິດ', 'red'); return }
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
  function printOrder(o) {
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    const itemsHtml = items.map(it => `<div style="display:flex;justify-content:space-between;"><span>${it.name} x${it.qty}</span><span>${it.sub?.toLocaleString()}</span></div>`).join('')
    const w = window.open('', '_blank', 'width=320,height=600')
    w.document.write(`
      <html><head><style>
        body{font-family:monospace;padding:10px;max-width:300px;margin:0 auto;}
        .shop{font-size:18px;font-weight:900;text-align:center;}
        .sub{font-size:11px;text-align:center;color:#666;margin-top:2px;}
        .div{border:none;border-top:1px dashed #000;margin:8px 0;}
        .qnum{font-size:48px;font-weight:900;text-align:center;margin:6px 0;}
        .qlbl{font-size:10px;text-align:center;color:#666;}
        .total{display:flex;justify-content:space-between;font-weight:900;margin-top:4px;}
        .foot{font-size:10px;text-align:center;color:#666;margin-top:8px;}
      </style></head><body>
        <div class="shop">${shopInfo.name}</div>
        ${shopInfo.address ? `<div class="sub">${shopInfo.address}</div>` : ''}
        ${shopInfo.phone ? `<div class="sub">Tel: ${shopInfo.phone}</div>` : ''}
        <hr class="div">
        <div class="qlbl">ເລກຄິວ · QUEUE</div>
        <div class="qnum">${String(o.qnum).padStart(3,'0')}</div>
        <div class="sub">${new Date(o.created_at).toLocaleString('lo-LA')}</div>
        <hr class="div">
        ${itemsHtml}
        <hr class="div">
        <div class="total"><span>ລວມ</span><span>${o.total?.toLocaleString()} ກີບ</span></div>
        <div class="foot">${shopInfo.footer}</div>
      </body></html>
    `)
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 300)
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
  salesOrders.forEach(o => {
    const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
    items.forEach(it => { menuCount[it.name] = (menuCount[it.name] || 0) + it.qty })
  })

  // Get all sales dates
  const salesDates = [...new Set(orders.filter(o => o.done).map(o =>
    new Date(o.done_at || o.created_at).toISOString().split('T')[0]
  ))].sort().reverse()
  if (!salesDates.includes(salesDate)) salesDates.unshift(salesDate)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="text-sm font-bold" style={{ color: 'var(--brown)' }}>ກຳລັງໂຫຼດ...</div>
    </div>
  )

  if (!supabase) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="text-sm font-bold text-center px-6" style={{ color: 'var(--brown)' }}>
        ບໍ່ສາມາດເຊື່ອມຕໍ່ຖານຂໍ້ມູນໄດ້<br/>ກວດສອບ Environment Variables
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)', paddingBottom: 64 }}>
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
      {lowStockMenus.length > 0 && (
        <div className="px-3 py-2 text-xs font-black" style={{ background: '#fef3c7', color: '#92400e' }}>
          ⚠ ສຕ໋ອກໃກ້ໝົດ: {lowStockMenus.map(m => `${m.name} (ຮ້ານ:${m.shop} ອອນໄລ:${m.online})`).join(' · ')}
        </div>
      )}

      {/* ─── ORDERS TAB ─── */}
      {tab === 'orders' && (
        <>
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ background: 'var(--brown)' }}>
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
                🖨 {usbConnected ? '✓' : 'USB'}
              </button>
              <button onClick={connectPrinter} className={`text-xs font-black px-3 py-2 rounded-lg border ${btConnected ? 'border-green-400 text-green-300' : 'border-[rgba(253,246,238,0.35)] text-[#fdf6ee]'}`}>
                🖨 {btConnected ? '✓' : 'BT'}
              </button>
              <button onClick={() => alert('ຕ້ອງຊອກຫາ ↺ Reset ໃນລາຍການ')} className="text-xs font-black px-3 py-2 rounded-lg border border-red-400 text-red-300">↺</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            {[['ລໍຖ້າ', waiting, 'var(--brown)'], ['ສຳເລັດ', done, 'var(--green,#2d6a2d)'], ['ທັງໝົດ', orders.length, 'var(--gray3)']].map(([l, n, c]) => (
              <div key={l} className="card text-center">
                <div className="text-3xl font-black" style={{ color: c }}>{n}</div>
                <div className="text-xs font-bold mt-1" style={{ color: 'var(--gray3)' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Sidebar + Orders layout */}
          <div className="flex flex-col md:grid md:grid-cols-[320px_1fr] max-w-6xl mx-auto">
            {/* Sidebar */}
            <div className="p-3 flex flex-col gap-3">
              {/* Settings */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>⚙ ຕັ້ງຄ່າ</summary>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    ['soundOn', '🔊 ສຽງຮຽກຄິວ'],
                    ['walkinOn', '🏪 ເປີດ Walk-in'],
                    ['onlineOn', '🌐 ເປີດ Online'],
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
                </div>
              </details>

              {/* Menu Edit */}
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>🍱 ເມນູ & ລາຄາ</summary>
                <div className="mt-3">
                  {menus.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center py-2 border-b border-[#f5ebe0]">
                      <span className="text-xs font-black w-4" style={{ color: 'var(--cream3)' }}>{i+1}</span>
                      <div className="flex-1 flex flex-col gap-1">
                        <input id={`mn-${i}`} defaultValue={m.lo} className="input-field text-xs py-2" />
                        <input id={`mp-${i}`} defaultValue={prices[i] || ''} type="text" inputMode="numeric" placeholder="0" className="input-field text-xs py-2" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <label className="w-10 h-10 rounded-lg border-2 border-dashed border-[#e8d5c0] flex items-center justify-center cursor-pointer overflow-hidden relative">
                          {imgPreviews[i]
                            ? <><img src={imgPreviews[i]} className="w-full h-full object-cover" /><span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white bg-black/40">...</span></>
                            : images[i] ? <img src={images[i]} className="w-full h-full object-cover" /> : <span className="text-xl">{EMOJIS[i]||'🍱'}</span>}
                          <input type="file" accept="image/*" className="hidden" onChange={e => uploadMenuImg(e, i)} />
                        </label>
                        {images[i] && !imgPreviews[i] && <button onClick={() => removeMenuImg(i)} className="text-xs text-red-500">✕</button>}
                      </div>
                    </div>
                  ))}
                  <button onClick={saveMenus} className="btn-primary mt-3 text-sm py-3">💾 ບັນທຶກ</button>
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
              <details className="card">
                <summary className="font-black text-xs tracking-widest uppercase cursor-pointer" style={{ color: 'var(--brown3)' }}>🏪 ຂໍ້ມູນຮ້ານ</summary>
                <div className="mt-3 flex flex-col gap-3">
                  {/* Logo */}
                  <div className="flex gap-3 items-start">
                    <div className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex items-center justify-center flex-shrink-0 relative ${logoPreview || shopInfo.logo ? 'border-[#a0522d]' : 'border-dashed border-[#e8d5c0]'}`} style={{ background: 'var(--cream)' }}>
                      {logoPreview
                        ? <><img src={logoPreview} className="w-full h-full object-cover" alt="preview" /><span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white bg-black/40">...</span></>
                        : shopInfo.logo ? <img src={shopInfo.logo} className="w-full h-full object-cover" alt="logo" /> : <span className="text-2xl">🏪</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="px-3 py-2 rounded-lg border border-[#3d1f0a] text-xs font-black cursor-pointer" style={{ color: 'var(--brown)', background: 'var(--warm-white)' }}>
                        📤 ອັບໂຫລດໂລໂກ້
                        <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                      </label>
                      {shopInfo.logo && <button onClick={removeLogo} className="text-xs text-red-500 font-black">✕ ລຶບ</button>}
                    </div>
                  </div>
                  {[['si-name','ຊື່ຮ້ານ',shopInfo.name,'text'],['si-addr','ທີ່ຢູ່',shopInfo.address,'text'],['si-phone','ເບີໂທ',shopInfo.phone,'tel']].map(([id,l,v,t]) => (
                    <div key={id}>
                      <label className="text-xs font-black uppercase tracking-widest block mb-1" style={{ color: 'var(--brown2)' }}>{l}</label>
                      <input id={id} defaultValue={v} type={t} className="input-field text-sm py-2" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest block mb-1" style={{ color: 'var(--brown2)' }}>Footer ໃບເສດ</label>
                    <textarea id="si-footer" defaultValue={shopInfo.footer} className="input-field text-sm py-2" rows={2} />
                  </div>
                  <button onClick={saveShopInfo} className="btn-primary text-sm py-3">💾 ບັນທຶກ</button>
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
            <div className="p-3">
              <div className="flex gap-2 items-center mb-2 flex-wrap">
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--gray3)' }}>ລາຍການ</span>
                <div className="flex gap-1 ml-auto">
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

              {activeOrders.length === 0 && <div className="text-center py-12 text-lg font-bold" style={{ color: 'var(--cream3)' }}>ຍັງບໍ່ມີອໍເດີ</div>}

              <div className="flex flex-col gap-3">
                {activeOrders.map(o => {
                  const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items || []
                  const cust = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
                  const time = new Date(o.created_at).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
                  const borderColor = o.cancelled || o.status === 'rejected' ? '#fca5a5' : o.done ? '#e8d5c0' : '#3d1f0a'

                  return (
                    <div key={o.id} className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${borderColor}`, background: 'var(--warm-white)' }}>

                      <div className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-serif text-2xl font-black" style={{ color: 'var(--brown)' }}>
                            #{String(o.qnum).padStart(3,'0')}
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>{time}</div>
                            <span className={`tag text-xs mt-1 ${o.type === 'online' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                              {o.type === 'online' ? '🌐 Online' : '🏪 Walk-in'}
                            </span>
                            {o.done && <span className="tag bg-green-50 text-green-700 text-xs ml-1">✓ Done</span>}
                            {o.cancelled && <span className="tag bg-red-50 text-red-700 text-xs ml-1">✕ ຍົກເລີກ</span>}
                            {o.status === 'rejected' && <span className="tag bg-red-50 text-red-700 text-xs ml-1">✕ ປະຕິເສດ</span>}
                            {o.status === 'confirmed' && !o.done && <span className="tag bg-green-50 text-green-700 text-xs ml-1">✓ ຢືນຢັນ</span>}
                            {o.type === 'online' && o.status === 'pending' && !o.cancelled && <span className="tag bg-yellow-50 text-yellow-700 text-xs ml-1">⏳ ລໍຖ້າ</span>}
                          </div>
                        </div>

                        {/* Customer info */}
                        {cust && (
                          <div className="rounded-xl p-2 mb-2 text-sm font-bold leading-6" style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
                            <div>👤 {cust.name} · 📞 {cust.phone}</div>
                            <div>📅 {cust.date} · 🕐 {cust.time}</div>
                            {cust.note && <div>📝 {cust.note}</div>}
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
                          <div className="mb-2 cursor-pointer" onClick={() => setSlipModal(o.slip_url)}>
                            <img src={o.slip_url} className="w-24 rounded-lg border-2 border-[#e8d5c0]" alt="slip" />
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
              </div>

              {/* ─── Archive ─── */}
              {archivedOrders.length > 0 && (
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
                              <span className="font-black text-sm w-10 flex-shrink-0" style={{ color: 'var(--brown)' }}>#{String(o.qnum).padStart(3,'0')}</span>
                              <span className="text-xs flex-shrink-0" style={{ color: 'var(--gray3)' }}>{time}</span>
                              <span className={`tag text-xs flex-shrink-0 ${o.type === 'online' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{o.type === 'online' ? '🌐' : '🏪'}</span>
                              {o.done && <span className="tag bg-green-50 text-green-700 text-xs flex-shrink-0">✓ Done</span>}
                              {o.cancelled && <span className="tag bg-red-50 text-red-700 text-xs flex-shrink-0">✕ ຍົກເລີກ</span>}
                              {o.status === 'rejected' && <span className="tag bg-red-50 text-red-700 text-xs flex-shrink-0">✕ ປະຕິເສດ</span>}
                              <span className="ml-auto text-xs font-black flex-shrink-0" style={{ color: 'var(--brown)' }}>{(o.total||0).toLocaleString()}</span>
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
                                  <div className="mb-2 cursor-pointer" onClick={() => setSlipModal(o.slip_url)}>
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
        </>
      )}

      {/* ─── SALES TAB ─── */}
      {tab === 'sales' && (
        <>
          <div className="sticky top-0 z-10 px-4 py-3" style={{ background: 'var(--brown)' }}>
            <div className="font-serif text-lg font-black" style={{ color: 'var(--cream)' }}>ຍອດຂາຍ · Sales</div>
          </div>
          <div className="max-w-lg mx-auto p-4">
            <select value={salesDate} onChange={e => setSalesDate(e.target.value)} className="input-field mb-4">
              {salesDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <div className="rounded-2xl p-4 flex justify-between items-center mb-3" style={{ background: 'var(--brown)' }}>
              <span className="text-sm font-bold" style={{ color: 'rgba(253,246,238,0.7)' }}>ຍອດລວມ</span>
              <span className="font-serif text-2xl font-black" style={{ color: 'var(--cream)' }}>{salesTotal.toLocaleString()} ກີບ</span>
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
        </>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 flex" style={{ background: 'var(--brown)', borderTop: '2px solid var(--brown2)' }}>
        {[['orders','📋','ອໍເດີ'],['sales','📊','ຍອດຂາຍ']].map(([t,icon,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 flex flex-col items-center py-3 gap-1 border-none text-xs font-bold ${tab===t ? 'text-[#fdf6ee]' : 'text-[rgba(253,246,238,0.45)]'}`} style={{ background: 'transparent' }}>
            <span className="text-2xl">{icon}</span>{l}
          </button>
        ))}
      </div>

      {/* Slip Modal */}
      {slipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(61,31,10,0.7)' }} onClick={() => setSlipModal(null)}>
          <div className="max-w-lg w-full rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={slipModal} className="w-full rounded-2xl" alt="slip" />
            <button onClick={() => setSlipModal(null)} className="btn-outline mt-2 text-sm py-3">ປິດ</button>
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
