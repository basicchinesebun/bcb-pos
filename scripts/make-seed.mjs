// Bake the shop's settings into the Windows build.
//
// The browser version gets its menus, prices and staff PIN from Supabase, and
// caches them afterwards. A till installed from a USB stick that has never
// been online has no cache to fall back on, so it came up, served its own
// pages perfectly, and then sat on "cannot check the Staff code" — open, and
// useless. This writes a snapshot into the bundle for it to start from.
//
// It also reserves a block of queue numbers on the server at packaging time,
// so even a till that is never online hands out numbers nobody else will.
// Without that it would have to invent them, and two tills would collide.
//
// Run from scripts/build-desktop.sh. Reads the same env vars as the app.

import fs from 'node:fs'
import path from 'node:path'

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OUT = process.argv[2] || 'out-desktop/offline-seed.json'
const QNUM_BLOCK = Number(process.env.SEED_QNUM_BLOCK || 500)

if (!URL_ || !KEY) {
  console.error('make-seed: NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY not set — cannot build a seed.')
  console.error('make-seed: the installed till would have no settings to start from. Refusing.')
  process.exit(1)
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function main() {
  const res = await fetch(`${URL_}/rest/v1/shop_config?select=key,value`, { headers })
  if (!res.ok) throw new Error(`shop_config: HTTP ${res.status} ${await res.text()}`)
  const rows = await res.json()
  if (!Array.isArray(rows) || !rows.length) throw new Error('shop_config came back empty')

  const have = new Set(rows.map(r => r.key))
  // Without these the till cannot be unlocked or cannot sell. Better to fail
  // the build here than to ship an installer that dead-ends at the shop.
  for (const need of ['staff_pin', 'menus', 'prices']) {
    if (!have.has(need)) throw new Error(`shop_config is missing "${need}"`)
  }

  // A device id fixed at packaging time, so the block below belongs to this
  // installer and this installer only.
  const deviceId = 'desktop-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

  let qnumLease = null
  const lease = await fetch(`${URL_}/rest/v1/rpc/lease_qnums`, {
    method: 'POST', headers,
    body: JSON.stringify({ p_device: deviceId, p_count: QNUM_BLOCK, p_hours: 24 * 365 }),
  })
  if (lease.ok) {
    const d = await lease.json()
    if (d && d.ok) qnumLease = { from: d.from, to: d.to, next: d.from }
  }
  if (!qnumLease) {
    throw new Error('could not reserve queue numbers — a till that is never online would have to invent them')
  }

  const seed = {
    generated_at: new Date().toISOString(),
    source: URL_,
    device_id: deviceId,
    qnum_lease: qnumLease,
    rows,
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(seed))
  console.log(`make-seed: ${rows.length} settings, queue numbers ${qnumLease.from}-${qnumLease.to}, device ${deviceId}`)
  console.log(`make-seed: wrote ${OUT}`)
}

main().catch(e => { console.error('make-seed failed:', e.message); process.exit(1) })
