'use client'

// Selling through an outage that can last a whole day.
//
// Two things in this app are decided by the database and not by the till: the
// queue number (next_qnum) and the stock (take_stock), both under a row lock.
// That is what stops two tills selling the same bun. With no connection the
// till cannot ask, so it has to already be holding the answer — it leases a
// block of queue numbers and a slice of the shelf while it still has a line to
// the database, and sells out of those. Nothing is guessed, so when the
// connection returns there is nothing to reconcile: the numbers were already
// reserved and the buns were already off the shelf.
//
// What is left to do on reconnect is only to push the orders that were written
// while offline, and to hand back the part of the reserve that went unsold.

const DB_NAME = 'bcb-offline'
const DB_VERSION = 1
const OUTBOX = 'outbox'   // orders written offline, waiting to be pushed
const META = 'meta'       // device id, queue-number block, stock held

let dbPromise = null

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('no-indexeddb'))
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(OUTBOX)) db.createObjectStore(OUTBOX, { keyPath: 'client_id' })
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

// Resolves with the request's own result. The first version decided whether it
// had a result by testing `result !== undefined`, and so returned the raw
// IDBRequest whenever a key was simply missing — which is every key on a till's
// first run. getHeldStock() then handed back a request object instead of {},
// every lookup on it read 0, and an offline sale reported the shelf empty with
// twenty buns reserved. Ask the request whether it is a request instead.
function tx(store, mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    let out
    try { out = fn(t.objectStore(store)) } catch (e) { reject(e); return }
    const isRequest = out && typeof IDBRequest !== 'undefined' && out instanceof IDBRequest
    t.oncomplete = () => resolve(isRequest ? out.result : out)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  }))
}

const metaGet = key => tx(META, 'readonly', s => s.get(key))
const metaPut = (key, val) => tx(META, 'readwrite', s => s.put(val, key))

// ─── Device identity ───
// Each till needs a name of its own, because a lease belongs to a device. It
// lives in localStorage rather than IndexedDB so it survives even if the
// database is cleared, and so it can be read synchronously at startup.
export function deviceId() {
  if (typeof localStorage === 'undefined') return 'unknown'
  let id = localStorage.getItem('bcb_device_id')
  if (!id) {
    id = 'till-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
    localStorage.setItem('bcb_device_id', id)
  }
  return id
}

export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Older WebViews: good enough for a key that only has to be unique per till.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ─── Queue-number block ───

export async function getQnumLease() {
  return (await metaGet('qnum_lease')) || null
}

// Ask the database for a block and keep it. Called whenever the till is online
// and running low, so there is always a block in hand before the line drops.
export async function leaseQnums(supabase, count = 120) {
  const existing = await getQnumLease()
  const left = existing ? existing.to - existing.next + 1 : 0
  if (left >= Math.ceil(count / 3)) return existing   // still plenty in hand
  const { data, error } = await supabase.rpc('lease_qnums', {
    p_device: deviceId(), p_count: count, p_key: 'next_queue_walkin', p_hours: 36,
  })
  if (error || !data?.ok) {
    // Worth saying out loud: with no block in hand the till cannot sell at all
    // once the line drops, and that is not something to discover during a storm.
    console.error('leaseQnums failed:', error || data)
    return existing
  }
  // A block that still has numbers left is kept and the new one queued behind
  // it, so numbers are handed out in order and none are skipped.
  const lease = (existing && left > 0 && existing.to + 1 === data.from)
    ? { from: existing.from, to: data.to, next: existing.next }
    : { from: data.from, to: data.to, next: data.from }
  await metaPut('qnum_lease', lease)
  return lease
}

// Take the next number from the block. Returns null when the block is spent —
// the caller must then refuse the sale rather than invent a number, because an
// invented one would collide with a real order.
export async function nextLeasedQnum() {
  const lease = await getQnumLease()
  if (!lease || lease.next > lease.to) return null
  const n = lease.next
  await metaPut('qnum_lease', { ...lease, next: n + 1 })
  return n
}

// ─── Stock held by this device ───

export async function getHeldStock() {
  return (await metaGet('stock_held')) || {}
}

// What has been sold out of the reserve since it was taken. Empty means the
// reserve is untouched and only needs topping up, not settling.
export async function getOfflineSold() {
  return (await metaGet('stock_sold_offline')) || {}
}

// Hold `target` of each menu. The database gives what it can and says what the
// device ended up with, which may be less — the shelf is the limit, and that
// is the whole point.
export async function leaseStock(supabase, target, key = 'stock_shop') {
  const { data, error } = await supabase.rpc('lease_stock', {
    p_device: deviceId(), p_key: key, p_target: target, p_hours: 36,
  })
  if (error || !data?.ok) return null
  const held = {}
  Object.entries(data.held || {}).forEach(([k, v]) => { held[k] = Number(v) || 0 })
  await metaPut('stock_held', held)
  await metaPut('stock_sold_offline', (await metaGet('stock_sold_offline')) || {})
  return { held, stock: data.stock }
}

// Sell out of what the device is holding. All-or-nothing, exactly like
// take_stock: if any line is short nothing is taken and the caller is told
// what is actually left, so a half-filled order is never written.
export async function takeHeldStock(deltas) {
  const held = await getHeldStock()
  const short = {}
  Object.entries(deltas).forEach(([k, qty]) => {
    const want = Number(qty) || 0
    if (want > 0 && (held[k] || 0) < want) short[k] = held[k] || 0
  })
  if (Object.keys(short).length) return { ok: false, short, held }
  const next = { ...held }
  Object.entries(deltas).forEach(([k, qty]) => { next[k] = (next[k] || 0) - (Number(qty) || 0) })
  await metaPut('stock_held', next)
  const sold = (await metaGet('stock_sold_offline')) || {}
  Object.entries(deltas).forEach(([k, qty]) => { sold[k] = (sold[k] || 0) + (Number(qty) || 0) })
  await metaPut('stock_sold_offline', sold)
  return { ok: true, held: next }
}

// Back online: tell the database what was actually sold out of the reserve and
// let it put the rest back on the shelf.
export async function settleStockLease(supabase, key = 'stock_shop') {
  const sold = (await metaGet('stock_sold_offline')) || {}
  const { data, error } = await supabase.rpc('release_stock_lease', {
    p_device: deviceId(), p_key: key, p_used: sold,
  })
  if (error) return null
  await metaPut('stock_held', {})
  await metaPut('stock_sold_offline', {})
  return data
}

// ─── Outbox ───

export async function queueOrder(row) {
  const entry = { ...row, client_id: row.client_id || uuid(), queued_at: new Date().toISOString() }
  await tx(OUTBOX, 'readwrite', s => s.put(entry))
  return entry
}

export function pendingOrders() {
  return tx(OUTBOX, 'readonly', s => s.getAll()).then(r => r || [])
}

export async function pendingCount() {
  const all = await pendingOrders()
  return all.length
}

// Push everything that was written offline. client_id carries a unique index,
// so a push that runs twice — a flaky line is exactly when that happens —
// lands on the same row instead of creating a second order.
export async function flushOutbox(supabase) {
  const all = await pendingOrders()
  if (!all.length) return { pushed: 0, failed: 0 }
  let pushed = 0, failed = 0
  for (const entry of all) {
    const { queued_at, ...row } = entry
    const { error } = await supabase.from('orders').upsert(row, { onConflict: 'client_id' })
    if (error) { failed++; continue }
    await tx(OUTBOX, 'readwrite', s => s.delete(entry.client_id))
    pushed++
  }
  return { pushed, failed }
}
