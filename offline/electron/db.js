'use strict'

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

// Every write in this file either succeeds or throws. Nothing is swallowed:
// the original web build logged a failed write to the console and carried on,
// so stock quietly stopped being deducted and nobody noticed for weeks. The
// IPC layer turns a throw into a visible error on the till, which is the whole
// point of the exercise.

let db = null
let dbFile = null

const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  qnum           INTEGER NOT NULL,
  items          TEXT NOT NULL,
  bag_label      TEXT,
  total          INTEGER NOT NULL,
  paid_amount    INTEGER,
  change_amount  INTEGER,
  payment_method TEXT,
  sold_by        TEXT,
  cancelled      INTEGER DEFAULT 0,
  done           INTEGER DEFAULT 0,
  done_at        TEXT,
  synced_at      TEXT,
  created_at     TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS menus (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  price      INTEGER NOT NULL,
  cost       INTEGER DEFAULT 0,
  stock      INTEGER DEFAULT 0,
  image_path TEXT,
  sort       INTEGER DEFAULT 0,
  active     INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS staff (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL,
  pin      TEXT NOT NULL UNIQUE,
  is_owner INTEGER DEFAULT 0,
  active   INTEGER DEFAULT 1
);

-- key is the primary key, not a UNIQUE index beside an id. The web build had
-- it the other way round and upserts silently inserted duplicate rows instead
-- of replacing them, so settings changes appeared to save but never took.
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menus_sort ON menus(sort, id);
`

const DEFAULT_SETTINGS = {
  shop_name: 'Basic Chinese Bun',
  logo_path: '',
  qr_image_path: '',
  next_queue: '0',
  current_queue: '0',
  printer_width: '80',
  printer_device: '',
  shop_address: '',
  shop_phone: '',
  receipt_footer: 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ',
  kitchen_port: '8080',
  voice_enabled: '1',
  last_backup: '',
  backup_dir: '',
}

function open(file) {
  dbFile = file
  fs.mkdirSync(path.dirname(file), { recursive: true })
  db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  migrate()
  seed()
  return db
}

// Columns added after the first release. SQLite has no "ADD COLUMN IF NOT
// EXISTS", so check the table info rather than relying on a try/catch that
// would also swallow a real error.
function migrate() {
  const cols = db.prepare('PRAGMA table_info(orders)').all().map(c => c.name)
  const wanted = [
    ['synced_at', 'TEXT'],
    ['paid_amount', 'INTEGER'],
    ['change_amount', 'INTEGER'],
    ['sold_by', 'TEXT'],
  ]
  for (const [name, type] of wanted) {
    if (!cols.includes(name)) db.exec(`ALTER TABLE orders ADD COLUMN ${name} ${type}`)
  }
  const menuCols = db.prepare('PRAGMA table_info(menus)').all().map(c => c.name)
  if (!menuCols.includes('cost')) db.exec('ALTER TABLE menus ADD COLUMN cost INTEGER DEFAULT 0')
}

function seed() {
  const ins = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) ins.run(k, v)
  })
  tx()

  // The shop has to be able to sell the moment the program opens, so there is
  // always at least one owner login. 888888 is the documented default and is
  // editable from Settings — it is never read from a constant at sale time.
  const staffCount = db.prepare('SELECT COUNT(*) n FROM staff').get().n
  if (staffCount === 0) {
    db.prepare('INSERT INTO staff (name, pin, is_owner, active) VALUES (?, ?, 1, 1)')
      .run('ເຈົ້າຂອງຮ້ານ', '888888')
  }
}

// ─── settings ───
function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

function getSetting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : fallback
}

function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, String(value))
  return true
}

function setSettings(obj) {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
  db.transaction(() => {
    for (const [k, v] of Object.entries(obj)) stmt.run(k, String(v == null ? '' : v))
  })()
  return true
}

// ─── staff ───
function listStaff(includeInactive = false) {
  return db.prepare(
    `SELECT id, name, pin, is_owner, active FROM staff ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY is_owner DESC, id`
  ).all()
}

function staffByPin(pin) {
  return db.prepare('SELECT id, name, pin, is_owner FROM staff WHERE pin = ? AND active = 1').get(String(pin))
}

function saveStaff(s) {
  const pin = String(s.pin || '').trim()
  if (!s.name || !s.name.trim()) throw new Error('ຕ້ອງໃສ່ຊື່ພະນັກງານ')
  if (!/^\d{4,8}$/.test(pin)) throw new Error('ລະຫັດຕ້ອງເປັນຕົວເລກ 4-8 ຫຼັກ')
  const clash = db.prepare('SELECT id FROM staff WHERE pin = ? AND id != ?').get(pin, s.id || 0)
  if (clash) throw new Error('ລະຫັດນີ້ຖືກໃຊ້ແລ້ວ')
  if (s.id) {
    db.prepare('UPDATE staff SET name = ?, pin = ?, is_owner = ?, active = ? WHERE id = ?')
      .run(s.name.trim(), pin, s.is_owner ? 1 : 0, s.active === 0 ? 0 : 1, s.id)
    return s.id
  }
  return db.prepare('INSERT INTO staff (name, pin, is_owner, active) VALUES (?, ?, ?, 1)')
    .run(s.name.trim(), pin, s.is_owner ? 1 : 0).lastInsertRowid
}

function deleteStaff(id) {
  // Locking everyone out of a till that has no network and no recovery path is
  // unrecoverable, so the last remaining owner cannot be removed.
  const target = db.prepare('SELECT is_owner FROM staff WHERE id = ?').get(id)
  if (!target) throw new Error('ບໍ່ພົບພະນັກງານ')
  if (target.is_owner) {
    const owners = db.prepare('SELECT COUNT(*) n FROM staff WHERE is_owner = 1 AND active = 1').get().n
    if (owners <= 1) throw new Error('ຕ້ອງເຫຼືອເຈົ້າຂອງຮ້ານຢ່າງໜ້ອຍ 1 ຄົນ')
  }
  db.prepare('DELETE FROM staff WHERE id = ?').run(id)
  return true
}

// ─── menus ───
function listMenus(includeInactive = true) {
  return db.prepare(
    `SELECT * FROM menus ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY sort, id`
  ).all()
}

function saveMenu(m) {
  if (!m.name || !m.name.trim()) throw new Error('ຕ້ອງໃສ່ຊື່ເມນູ')
  const price = Math.max(0, parseInt(m.price, 10) || 0)
  const cost = Math.max(0, parseInt(m.cost, 10) || 0)
  const stock = Math.max(0, parseInt(m.stock, 10) || 0)
  if (m.id) {
    db.prepare('UPDATE menus SET name = ?, price = ?, cost = ?, stock = ?, image_path = ?, sort = ?, active = ? WHERE id = ?')
      .run(m.name.trim(), price, cost, stock, m.image_path || null, m.sort || 0, m.active === 0 ? 0 : 1, m.id)
    return m.id
  }
  const nextSort = db.prepare('SELECT COALESCE(MAX(sort), 0) + 1 s FROM menus').get().s
  return db.prepare('INSERT INTO menus (name, price, cost, stock, image_path, sort, active) VALUES (?, ?, ?, ?, ?, ?, 1)')
    .run(m.name.trim(), price, cost, stock, m.image_path || null, m.sort || nextSort).lastInsertRowid
}

function deleteMenu(id) {
  db.prepare('DELETE FROM menus WHERE id = ?').run(id)
  return true
}

function setStock(id, stock) {
  const n = Math.max(0, parseInt(stock, 10) || 0)
  const r = db.prepare('UPDATE menus SET stock = ? WHERE id = ?').run(n, id)
  if (r.changes !== 1) throw new Error('ບັນທຶກສະຕັອກບໍ່ສຳເລັດ')
  return n
}

function resetStock(value) {
  const n = Math.max(0, parseInt(value, 10) || 0)
  db.prepare('UPDATE menus SET stock = ? WHERE active = 1').run(n)
  return true
}

// ─── orders ───
// The queue number, the order row and every stock deduction land in one
// transaction. A half-written sale — money taken, stock untouched, or two
// customers handed the same queue number — is worse than a failed one, and the
// caller is told which it was.
function createOrder(order) {
  const items = order.items || []
  if (!items.length) throw new Error('ບໍ່ມີລາຍການສິນຄ້າ')

  const tx = db.transaction(() => {
    for (const it of items) {
      const row = db.prepare('SELECT name, stock FROM menus WHERE id = ?').get(it.menu_id)
      if (!row) throw new Error(`ບໍ່ພົບເມນູ (id ${it.menu_id})`)
      if (row.stock < it.qty) throw new Error(`${row.name} ເຫຼືອພຽງ ${row.stock}`)
    }
    const next = (parseInt(getSetting('next_queue', '0'), 10) || 0) + 1
    setSetting('next_queue', next)

    const info = db.prepare(`
      INSERT INTO orders (qnum, items, bag_label, total, paid_amount, change_amount, payment_method, sold_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
    `).run(
      next,
      JSON.stringify(items),
      order.bag_label || null,
      Math.round(order.total || 0),
      order.paid_amount == null ? null : Math.round(order.paid_amount),
      order.change_amount == null ? null : Math.round(order.change_amount),
      order.payment_method || 'cash',
      order.sold_by || null
    )

    const dec = db.prepare('UPDATE menus SET stock = stock - ? WHERE id = ? AND stock >= ?')
    for (const it of items) {
      const r = dec.run(it.qty, it.menu_id, it.qty)
      if (r.changes !== 1) throw new Error(`ຫັກສະຕັອກບໍ່ສຳເລັດ: ${it.name}`)
    }
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid)
  })

  return tx()
}

// Cancelling puts the stock back, once. Cancelling an already-cancelled order
// is a no-op rather than a second refund of stock that was never sold.
function cancelOrder(id) {
  const tx = db.transaction(() => {
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!o) throw new Error('ບໍ່ພົບບິນ')
    if (o.cancelled) return o
    db.prepare('UPDATE orders SET cancelled = 1 WHERE id = ?').run(id)
    const items = JSON.parse(o.items)
    const inc = db.prepare('UPDATE menus SET stock = stock + ? WHERE id = ?')
    for (const it of items) if (it.menu_id) inc.run(it.qty, it.menu_id)
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  })
  return tx()
}

function markDone(id, done = true) {
  const r = db.prepare("UPDATE orders SET done = ?, done_at = CASE WHEN ? THEN datetime('now','localtime') ELSE NULL END WHERE id = ?")
    .run(done ? 1 : 0, done ? 1 : 0, id)
  if (r.changes !== 1) throw new Error('ອັບເດດບິນບໍ່ສຳເລັດ')
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
}

function getOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
}

function listOrders({ from, to, limit = 500 } = {}) {
  if (from && to) {
    return db.prepare('SELECT * FROM orders WHERE date(created_at) BETWEEN ? AND ? ORDER BY id DESC LIMIT ?')
      .all(from, to, limit)
  }
  return db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT ?').all(limit)
}

function openOrders() {
  return db.prepare('SELECT * FROM orders WHERE done = 0 AND cancelled = 0 ORDER BY id').all()
}

// Costs are read from the menu row at report time rather than frozen onto the
// order. The shop wants "what would this sale earn at today's cost", and a
// backup till that never syncs has no better source of truth anyway.
function report({ from, to }) {
  const orders = db.prepare('SELECT * FROM orders WHERE date(created_at) BETWEEN ? AND ? AND cancelled = 0 ORDER BY id')
    .all(from, to)
  const costById = new Map(db.prepare('SELECT id, cost FROM menus').all().map(m => [m.id, m.cost || 0]))

  let total = 0, cash = 0, transfer = 0, cost = 0
  const byMenu = new Map()
  const byStaff = new Map()

  for (const o of orders) {
    total += o.total || 0
    if (o.payment_method === 'cash') cash += o.total || 0
    else transfer += o.total || 0

    let items = []
    try { items = JSON.parse(o.items) } catch (_) { items = [] }
    let orderCost = 0
    for (const it of items) {
      const c = (costById.get(it.menu_id) || 0) * it.qty
      orderCost += c
      const key = it.name || `#${it.menu_id}`
      const agg = byMenu.get(key) || { name: key, qty: 0, revenue: 0, cost: 0 }
      agg.qty += it.qty
      agg.revenue += it.sub || 0
      agg.cost += c
      byMenu.set(key, agg)
    }
    cost += orderCost

    const who = o.sold_by || 'ບໍ່ລະບຸ'
    const st = byStaff.get(who) || { name: who, bills: 0, total: 0 }
    st.bills += 1
    st.total += o.total || 0
    byStaff.set(who, st)
  }

  return {
    from, to,
    bills: orders.length,
    total, cash, transfer, cost,
    profit: total - cost,
    byMenu: [...byMenu.values()].sort((a, b) => b.qty - a.qty),
    byStaff: [...byStaff.values()].sort((a, b) => b.total - a.total),
    cancelled: db.prepare('SELECT COUNT(*) n FROM orders WHERE date(created_at) BETWEEN ? AND ? AND cancelled = 1').get(from, to).n,
  }
}

function close() {
  if (db) { db.close(); db = null }
}

module.exports = {
  open, close,
  get file() { return dbFile },
  get handle() { return db },
  getSettings, getSetting, setSetting, setSettings,
  listStaff, staffByPin, saveStaff, deleteStaff,
  listMenus, saveMenu, deleteMenu, setStock, resetStock,
  createOrder, cancelOrder, markDone, getOrder, listOrders, openOrders, report,
}
