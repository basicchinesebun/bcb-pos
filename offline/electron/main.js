'use strict'

const { app, BrowserWindow, screen, ipcMain, protocol, dialog, net } = require('electron')
const path = require('path')
const fs = require('fs')
const url = require('url')

const db = require('./db')
const printer = require('./printer')
const backup = require('./backup')
const kitchen = require('./kitchen-server')

const DEV_URL = process.env.VITE_DEV_SERVER_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5273' : null)

let posWindow = null
let displayWindow = null
let imagesDir = null
let startupNotice = null

// Images live as ordinary files next to the database rather than as base64
// blobs inside it — a few hundred menu photos would make every query drag.
// A custom scheme keeps them reachable from both windows without turning on
// webSecurity: false.
protocol.registerSchemesAsPrivileged([
  { scheme: 'bcbimg', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true } },
])

function rendererFile(name) {
  return path.join(__dirname, '..', 'dist', name)
}

function loadRenderer(win, page) {
  if (DEV_URL) return win.loadURL(`${DEV_URL}/${page}`)
  return win.loadFile(rendererFile(page))
}

function createPosWindow() {
  const primary = screen.getPrimaryDisplay()
  posWindow = new BrowserWindow({
    x: primary.bounds.x,
    y: primary.bounds.y,
    width: Math.min(1366, primary.workAreaSize.width),
    height: Math.min(768, primary.workAreaSize.height),
    show: false,
    backgroundColor: '#fdf6ee',
    autoHideMenuBar: true,
    title: 'BCB POS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })
  posWindow.once('ready-to-show', () => {
    posWindow.maximize()
    posWindow.show()
  })
  posWindow.on('closed', () => { posWindow = null })
  loadRenderer(posWindow, 'index.html')
  return posWindow
}

// §2.1: a single-screen machine must not have a customer window thrown at it.
// Open one automatically only when there genuinely is a second screen; the
// till always carries a button to open one by hand.
function secondaryDisplay() {
  const all = screen.getAllDisplays()
  const primaryId = screen.getPrimaryDisplay().id
  return all.find(d => d.id !== primaryId) || null
}

function createDisplayWindow(force = false) {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.focus()
    return displayWindow
  }
  const target = secondaryDisplay()
  if (!target && !force) return null

  const bounds = target ? target.bounds : screen.getPrimaryDisplay().bounds
  displayWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    fullscreen: !!target,
    backgroundColor: '#3d1f0a',
    autoHideMenuBar: true,
    title: 'BCB — ຈໍລູກຄ້າ',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  displayWindow.on('closed', () => { displayWindow = null })
  loadRenderer(displayWindow, 'display.html')
  return displayWindow
}

function sendToDisplay(channel, payload) {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.webContents.send(channel, payload)
  }
}

function sendToPos(channel, payload) {
  if (posWindow && !posWindow.isDestroyed()) {
    posWindow.webContents.send(channel, payload)
  }
}

// Every IPC handler answers { ok, data } or { ok:false, error }. Nothing is
// allowed to fail silently — that is the bug this whole rewrite exists to
// avoid — so the renderer can always show the staff what went wrong.
function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return { ok: true, data: await fn(...args) }
    } catch (err) {
      console.error(`[ipc] ${channel}:`, err)
      return { ok: false, error: err.message || String(err) }
    }
  })
}

function openOrdersForKitchen() {
  return db.openOrders().map(o => ({
    id: o.id,
    qnum: o.qnum,
    items: JSON.parse(o.items),
    bag_label: o.bag_label,
    total: o.total,
    sold_by: o.sold_by,
    created_at: o.created_at,
  }))
}

function registerIpc() {
  // ─── settings / staff ───
  handle('settings:get', () => db.getSettings())
  handle('settings:set', obj => { db.setSettings(obj); return db.getSettings() })
  handle('staff:list', includeInactive => db.listStaff(includeInactive))
  handle('staff:login', pin => {
    const s = db.staffByPin(String(pin || '').trim())
    if (!s) throw new Error('ລະຫັດບໍ່ຖືກຕ້ອງ')
    return { id: s.id, name: s.name, is_owner: !!s.is_owner }
  })
  handle('staff:save', s => db.saveStaff(s))
  handle('staff:delete', id => db.deleteStaff(id))

  // ─── menus / stock ───
  handle('menus:list', () => db.listMenus())
  handle('menus:save', m => db.saveMenu(m))
  handle('menus:delete', id => db.deleteMenu(id))
  handle('stock:set', (id, n) => db.setStock(id, n))
  handle('stock:reset', n => db.resetStock(n))

  // ─── orders ───
  handle('orders:create', order => {
    const created = db.createOrder(order)
    // §6: taking the money and sending to the kitchen are one action. Staff
    // forgot the second button every single time in the old system, so there
    // is no second button.
    kitchen.broadcast({ type: 'new', order: { ...created, items: JSON.parse(created.items) } })
    return created
  })
  handle('orders:cancel', id => {
    const o = db.cancelOrder(id)
    kitchen.broadcast({ type: 'remove', id })
    return o
  })
  handle('orders:done', (id, done) => {
    const o = db.markDone(id, done)
    kitchen.broadcast({ type: 'remove', id })
    return o
  })
  handle('orders:list', opts => db.listOrders(opts || {}))
  handle('orders:open', () => db.openOrders())
  handle('orders:get', id => db.getOrder(id))
  handle('report:range', range => db.report(range))

  // ─── printer ───
  handle('printer:status', () => printer.status(db.getSetting('printer_device')))
  handle('printer:list', () => printer.list())
  handle('printer:print', bytes => printer.write(Buffer.from(bytes), db.getSetting('printer_device')))
  handle('printer:drawer', () => printer.kickDrawer(db.getSetting('printer_device')))
  handle('printer:textReceipt', order => {
    const width = db.getSetting('printer_width', '80') === '58' ? 32 : 48
    return Array.from(printer.textReceipt(order, db.getSettings(), width))
  })

  // ─── images ───
  handle('images:pick', async () => {
    const res = await dialog.showOpenDialog(posWindow, {
      title: 'ເລືອກຮູບພາບ',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
    })
    if (res.canceled || !res.filePaths.length) return null
    return importImage(res.filePaths[0])
  })
  handle('images:delete', name => {
    if (!name) return false
    const target = path.join(imagesDir, path.basename(name))
    if (fs.existsSync(target)) fs.unlinkSync(target)
    return true
  })

  // ─── customer display ───
  handle('display:open', () => {
    const win = createDisplayWindow(true)
    return !!win
  })
  handle('display:close', () => {
    if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close()
    return true
  })
  handle('display:state', state => {
    sendToDisplay('display:update', state)
    return true
  })
  handle('display:status', () => ({
    open: !!(displayWindow && !displayWindow.isDestroyed()),
    screens: screen.getAllDisplays().length,
  }))

  // ─── kitchen ───
  handle('kitchen:status', () => kitchen.status())
  handle('kitchen:restart', async port => {
    kitchen.stop()
    const p = parseInt(port, 10) || 8080
    db.setSetting('kitchen_port', p)
    return kitchen.start(p, { onDone: kitchenDone, listOpen: openOrdersForKitchen })
  })
  handle('queue:call', qnum => {
    db.setSetting('current_queue', qnum)
    sendToDisplay('display:queue', { qnum })
    kitchen.broadcast({ type: 'called', qnum })
    return true
  })

  // ─── data ───
  handle('backup:now', async () => {
    const res = await backup.run(db, db.getSetting('backup_dir') || backup.defaultDir())
    db.setSettings({ last_backup: res.ok ? res.at : db.getSetting('last_backup'), last_backup_error: res.error || '' })
    return res
  })
  handle('backup:info', () => ({
    dir: db.getSetting('backup_dir') || backup.defaultDir(),
    last: db.getSetting('last_backup'),
    error: db.getSetting('last_backup_error', ''),
    dbFile: db.file,
  }))
  handle('backup:pickDir', async () => {
    const res = await dialog.showOpenDialog(posWindow, { properties: ['openDirectory', 'createDirectory'] })
    if (res.canceled || !res.filePaths.length) return null
    db.setSetting('backup_dir', res.filePaths[0])
    return res.filePaths[0]
  })
  handle('data:importJson', () => importWebJson())
  handle('data:exportCsv', csv => saveCsv(csv))
  handle('app:notice', () => {
    const notice = startupNotice
    startupNotice = null
    return notice
  })
}

function importImage(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase() || '.png'
  const name = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  fs.mkdirSync(imagesDir, { recursive: true })
  fs.copyFileSync(sourcePath, path.join(imagesDir, name))
  return name
}

// The website already exports its whole configuration as JSON, so setting the
// backup till up is a file-picker away rather than an evening of retyping
// menus and prices. Only menus, prices and images are taken: orders belong to
// the machine that made them.
async function importWebJson() {
  const res = await dialog.showOpenDialog(posWindow, {
    title: 'ນຳເຂົ້າເມນູຈາກໄຟລ໌ JSON ຂອງເວັບ',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (res.canceled || !res.filePaths.length) return null

  const raw = JSON.parse(fs.readFileSync(res.filePaths[0], 'utf8'))
  const cfg = {}
  for (const row of raw.shop_config || []) cfg[row.key] = row.value

  const parse = (key, fallback) => {
    if (!cfg[key]) return fallback
    try { return JSON.parse(cfg[key]) } catch (_) { return fallback }
  }
  const menus = parse('menus', [])
  if (!menus.length) throw new Error('ໃນໄຟລ໌ບໍ່ມີເມນູ')
  const prices = parse('prices', [])
  const costs = parse('costs', [])
  const stock = parse('stock_shop', [])
  const images = parse('menu_images', {})

  let imported = 0
  let imagesSaved = 0
  const existing = db.listMenus()

  for (let i = 0; i < menus.length; i++) {
    const m = menus[i]
    const name = (m.lo || m.en || `ເມນູ ${i + 1}`).trim()
    let imageName = null
    const src = images[i] || images[String(i)]
    if (src && typeof src === 'string' && src.startsWith('data:')) {
      imageName = saveDataUrl(src)
      if (imageName) imagesSaved++
    } else if (src && /^https?:/.test(src)) {
      imageName = await downloadImage(src)
      if (imageName) imagesSaved++
    }
    // Matching on name keeps a re-import from duplicating the whole board;
    // stock stays as it is on the till, which is the one number the website
    // cannot know while the network is down.
    const match = existing.find(e => e.name === name)
    db.saveMenu({
      id: match ? match.id : undefined,
      name,
      price: prices[i] || (match ? match.price : 0),
      cost: costs[i] || (match ? match.cost : 0),
      stock: match ? match.stock : (stock[i] || 0),
      image_path: imageName || (match ? match.image_path : null),
      sort: i + 1,
      active: 1,
    })
    imported++
  }

  const info = parse('shop_info', null)
  if (info) {
    db.setSettings({
      shop_name: info.name || db.getSetting('shop_name'),
      shop_address: info.address || '',
      shop_phone: info.phone || '',
      receipt_footer: info.footer || db.getSetting('receipt_footer'),
    })
    if (info.logo && info.logo.startsWith('data:')) {
      const logo = saveDataUrl(info.logo)
      if (logo) db.setSetting('logo_path', logo)
    }
  }
  if (cfg.qr_image && cfg.qr_image.startsWith('data:')) {
    const qr = saveDataUrl(cfg.qr_image)
    if (qr) db.setSetting('qr_image_path', qr)
  }

  return { imported, imagesSaved }
}

function saveDataUrl(dataUrl) {
  const match = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  const name = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`
  fs.mkdirSync(imagesDir, { recursive: true })
  fs.writeFileSync(path.join(imagesDir, name), Buffer.from(match[2], 'base64'))
  return name
}

// An import may be run at home, on a machine that still has internet, where
// the website's image URLs resolve. On the till they will not, and that is
// fine — the menu still imports, just without the photo.
async function downloadImage(src) {
  try {
    const res = await net.fetch(src)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const ext = path.extname(new URL(src).pathname) || '.jpg'
    const name = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    fs.mkdirSync(imagesDir, { recursive: true })
    fs.writeFileSync(path.join(imagesDir, name), buf)
    return name
  } catch (_) {
    return null
  }
}

async function saveCsv(csv) {
  const res = await dialog.showSaveDialog(posWindow, {
    title: 'ບັນທຶກ CSV',
    defaultPath: `bcb-report-${backup.stamp()}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  })
  if (res.canceled || !res.filePath) return null
  // UTF-8 BOM, or Excel renders Lao as mojibake.
  fs.writeFileSync(res.filePath, '﻿' + csv, 'utf8')
  return res.filePath
}

function kitchenDone(id) {
  const order = db.markDone(id, true)
  sendToPos('orders:changed', order)
  kitchen.broadcast({ type: 'remove', id })
}

async function boot() {
  const userData = app.getPath('userData')
  imagesDir = path.join(userData, 'images')
  fs.mkdirSync(imagesDir, { recursive: true })

  db.open(path.join(userData, 'bcb-pos.db'))

  protocol.handle('bcbimg', request => {
    const name = path.basename(decodeURIComponent(new URL(request.url).pathname))
    const file = path.join(imagesDir, name)
    if (!file.startsWith(imagesDir) || !fs.existsSync(file)) {
      return new Response('not found', { status: 404 })
    }
    return net.fetch(url.pathToFileURL(file).toString())
  })

  registerIpc()
  createPosWindow()
  createDisplayWindow()

  const port = parseInt(db.getSetting('kitchen_port', '8080'), 10) || 8080
  kitchen.start(port, { onDone: kitchenDone, listOpen: openOrdersForKitchen })

  // §7.1 — nag on the way in, not on the way out. A shop that has not managed
  // a backup for a week is one reinstall away from losing everything, and the
  // owner is the only one who can act on that.
  const days = backup.daysSince(db.getSetting('last_backup'))
  if (days > 7) {
    startupNotice = {
      type: 'backup',
      days: Number.isFinite(days) ? Math.floor(days) : null,
      error: db.getSetting('last_backup_error', ''),
    }
  }

  // A second screen plugged in after opening should still get the customer
  // display without restarting the program.
  screen.on('display-added', () => { if (!displayWindow) createDisplayWindow() })
}

// Two tills writing to the same database file would corrupt it, and the
// kitchen port can only be held once.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (posWindow) { if (posWindow.isMinimized()) posWindow.restore(); posWindow.focus() }
  })

  app.whenReady().then(boot)

  app.on('window-all-closed', () => app.quit())

  // The backup runs here, before the database handle closes, and is given a
  // hard time limit. A pulled-out USB stick or a full disk must never leave
  // the program hanging on screen at closing time (§7.1).
  let quitting = false
  app.on('before-quit', async event => {
    if (quitting) return
    event.preventDefault()
    quitting = true
    try {
      const res = await Promise.race([
        backup.run(db, db.getSetting('backup_dir') || backup.defaultDir()),
        new Promise(resolve => setTimeout(() => resolve({ ok: false, error: 'ໝົດເວລາ' }), 8000)),
      ])
      db.setSettings({
        last_backup: res.ok ? res.at : db.getSetting('last_backup'),
        last_backup_error: res.ok ? '' : (res.error || 'ບໍ່ສຳເລັດ'),
      })
    } catch (err) {
      try { db.setSetting('last_backup_error', err.message) } catch (_) {}
    }
    kitchen.stop()
    try { db.close() } catch (_) {}
    app.exit(0)
  })
}
