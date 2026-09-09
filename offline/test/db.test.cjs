// Exercises the real db.js against a real SQLite file.
//
// better-sqlite3 in this project is compiled against Electron's ABI, so plain
// `node` cannot load it. The runner starts this file through Electron with
// ELECTRON_RUN_AS_NODE=1, which is the same JavaScript engine the program
// itself uses — so this tests the module exactly as it ships.
const path = require('path')
const fs = require('fs')
const os = require('os')

const db = require('../electron/db.js')
const backup = require('../electron/backup.js')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bcb-test-'))
const file = path.join(tmp, 'bcb-pos.db')

let pass = 0, fail = 0
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log('  ok   ' + name) }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')) }
}

;(async () => {
db.open(file)

console.log('\n[schema + seed]')
const s = db.getSettings()
check('settings seeded with key as PK', s.next_queue === '0' && s.printer_width === '80')
const staff = db.listStaff()
check('owner seeded, editable pin not hardcoded at sale time', staff.length === 1 && staff[0].pin === '888888' && staff[0].is_owner === 1)
check('login by pin works', !!db.staffByPin('888888'))
check('wrong pin rejected', !db.staffByPin('123456'))

console.log('\n[settings upsert — the bug from the old system]')
db.setSetting('shop_name', 'BCB Test')
db.setSetting('shop_name', 'BCB Test 2')
check('upsert replaces rather than duplicating', db.getSetting('shop_name') === 'BCB Test 2')
check('one row only', db.handle.prepare("SELECT COUNT(*) n FROM settings WHERE key='shop_name'").get().n === 1)

console.log('\n[menus + stock]')
const bun = db.saveMenu({ name: 'ຊາລາເປົາໝູສັບ', price: 15000, cost: 6000, stock: 10 })
const choc = db.saveMenu({ name: 'ໝັນໂຖ Dark Chocolate', price: 20000, cost: 9000, stock: 3 })
check('menus created', db.listMenus().length === 2)
try { db.saveMenu({ name: '  ', price: 1 }); check('blank name rejected', false) }
catch (e) { check('blank name rejected', true) }

console.log('\n[sale: queue, stock deduction, sold_by]')
const order = db.createOrder({
  items: [{ menu_id: bun, name: 'ຊາລາເປົາໝູສັບ', qty: 4, price: 15000, sub: 60000 },
          { menu_id: choc, name: 'ໝັນໂຖ Dark Chocolate', qty: 1, price: 20000, sub: 20000 }],
  bag_label: 'ຖົງ 1: ຊາລາເປົາໝູສັບ ×4 | ຖົງ 2: ໝັນໂຖ Dark Chocolate ×1',
  total: 80000, payment_method: 'cash', paid_amount: 100000, change_amount: 20000, sold_by: 'ນາງ ກ',
})
check('queue number starts at 1', order.qnum === 1)
check('next_queue advanced', db.getSetting('next_queue') === '1')
check('sold_by recorded', order.sold_by === 'ນາງ ກ')
check('bag label stored', order.bag_label.includes('ຖົງ 2'))
const afterSale = db.listMenus()
check('stock deducted (bun 10->6)', afterSale.find(m => m.id === bun).stock === 6)
check('stock deducted (choc 3->2)', afterSale.find(m => m.id === choc).stock === 2)

console.log('\n[overselling is refused, and refused atomically]')
let threw = false
try {
  db.createOrder({ items: [{ menu_id: choc, name: 'x', qty: 99, price: 20000, sub: 1980000 }], total: 1980000, payment_method: 'cash' })
} catch (e) { threw = true }
check('oversell throws (never silent)', threw)
check('queue NOT consumed by failed sale', db.getSetting('next_queue') === '1')
check('stock untouched by failed sale', db.listMenus().find(m => m.id === choc).stock === 2)
check('no orphan order row', db.listOrders().length === 1)

console.log('\n[cancel returns stock, exactly once]')
db.cancelOrder(order.id)
check('bun stock restored 6->10', db.listMenus().find(m => m.id === bun).stock === 10)
db.cancelOrder(order.id)
check('double cancel does not double-refund', db.listMenus().find(m => m.id === bun).stock === 10)

console.log('\n[kitchen done + reports]')
const o2 = db.createOrder({ items: [{ menu_id: bun, name: 'ຊາລາເປົາໝູສັບ', qty: 2, price: 15000, sub: 30000 }], total: 30000, payment_method: 'qr', sold_by: 'ນາງ ຂ' })
check('second queue number', o2.qnum === 2)
check('open orders shows only unfinished', db.openOrders().length === 1)
db.markDone(o2.id, true)
check('done clears the kitchen board', db.openOrders().length === 0)

const today = new Date(); const p = n => String(n).padStart(2, '0')
const day = `${today.getFullYear()}-${p(today.getMonth()+1)}-${p(today.getDate())}`
const rep = db.report({ from: day, to: day })
check('cancelled bill excluded from takings', rep.total === 30000, JSON.stringify(rep.total))
check('cancelled counted separately', rep.cancelled === 1)
check('transfer split correct', rep.transfer === 30000 && rep.cash === 0)
check('profit uses per-menu cost (30000 - 2x6000)', rep.profit === 18000, String(rep.profit))
check('best sellers ranked', rep.byMenu[0].name === 'ຊາລາເປົາໝູສັບ' && rep.byMenu[0].qty === 2)
check('per-staff totals', rep.byStaff[0].name === 'ນາງ ຂ' && rep.byStaff[0].total === 30000)

console.log('\n[staff rules]')
const emp = db.saveStaff({ name: 'ພະນັກງານ ຄ', pin: '1234', is_owner: 0 })
check('staff added', db.listStaff().length === 2)
try { db.saveStaff({ name: 'ງ', pin: '1234' }); check('duplicate pin rejected', false) }
catch (e) { check('duplicate pin rejected', true) }
try { db.saveStaff({ name: 'ງ', pin: '12' }); check('short pin rejected', false) }
catch (e) { check('short pin rejected', true) }
try { db.deleteStaff(staff[0].id); check('last owner protected', false) }
catch (e) { check('last owner protected', true) }
check('non-owner deletable', db.deleteStaff(emp) === true)

console.log('\n[backup]')
const res = await backup.run(db, path.join(tmp, 'backups'))
check('backup written', res.ok && fs.existsSync(res.path), res.error)
const copy = new (require('better-sqlite3'))(res.path, { readonly: true })
check('backup contains the sales (WAL included)', copy.prepare('SELECT COUNT(*) n FROM orders').get().n === 2)
copy.close()
const res2 = await backup.run(db, path.join(tmp, 'backups'))
check('same-day second backup does not overwrite', res2.path !== res.path && fs.existsSync(res.path))
// A regular file standing where the backup folder should be: same shape of
// failure as a full disk or a USB stick pulled out mid-copy.
const blocker = path.join(tmp, 'not-a-folder')
fs.writeFileSync(blocker, 'x')
const bad = await backup.run(db, path.join(blocker, 'sub'))
check('unwritable target reports instead of throwing', bad.ok === false && !!bad.error)
check('daysSince treats never-backed-up as overdue', backup.daysSince('') === Infinity)

console.log('\n[statistics: 17 menus, only some sell, over several days]')
{
  // A fresh shop so the numbers are easy to reason about.
  const t2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bcb-stats-'))
  db.close()
  db.open(path.join(t2, 'stats.db'))

  const ids = []
  for (let i = 1; i <= 17; i++) {
    ids.push(db.saveMenu({ name: `ເມນູ ${i}`, price: 10000, cost: 4000, stock: 1000 }))
  }
  check('17 menus on the board', db.listMenus().length === 17)

  // Three trading days. Menus 1-3 sell every day, 4 sells on one day only,
  // the other 13 never sell at all — the shop's real pattern.
  const days = ['2026-09-01', '2026-09-02', '2026-09-03']
  const mkOrder = (day, items, method) => {
    const o = db.createOrder({ items, total: items.reduce((s, i) => s + i.sub, 0), payment_method: method, sold_by: 'ນາງ ກ' })
    db.handle.prepare("UPDATE orders SET created_at = ? WHERE id = ?").run(day + ' 10:00:00', o.id)
    return o
  }
  for (const day of days) {
    mkOrder(day, [
      { menu_id: ids[0], name: 'ເມນູ 1', qty: 5, price: 10000, sub: 50000 },
      { menu_id: ids[1], name: 'ເມນູ 2', qty: 2, price: 10000, sub: 20000 },
    ], 'cash')
    mkOrder(day, [{ menu_id: ids[2], name: 'ເມນູ 3', qty: 1, price: 10000, sub: 10000 }], 'qr')
  }
  mkOrder(days[1], [{ menu_id: ids[3], name: 'ເມນູ 4', qty: 3, price: 10000, sub: 30000 }], 'cash')

  const r = db.report({ from: '2026-09-01', to: '2026-09-03' })

  check('three trading days counted', r.tradingDays === 3, String(r.tradingDays))
  check('range total correct', r.total === 270000, String(r.total))
  check('7 bills', r.bills === 7)

  check('every menu appears, sold or not', r.byMenu.length === 17, String(r.byMenu.length))
  check('4 menus actually sold', r.soldMenus === 4, String(r.soldMenus))
  check('13 menus sold nothing and are named', r.unsoldMenus.length === 13, String(r.unsoldMenus.length))
  check('best seller ranked first', r.byMenu[0].name === 'ເມນູ 1' && r.byMenu[0].qty === 15)
  check('unsold menus carry a real zero, not a missing row',
    r.byMenu.find(m => m.name === 'ເມນູ 17').qty === 0)

  check('per-day rows, one per trading day', r.byDay.length === 3)
  check('day 1 total', r.byDay[0].total === 80000, String(r.byDay[0].total))
  check('day 2 includes the one-off menu', r.byDay[1].total === 110000, String(r.byDay[1].total))
  check('day rows carry the piece count', r.byDay[0].pieces === 8, String(r.byDay[0].pieces))
  check('day profit uses per-menu cost', r.byDay[0].profit === 80000 - 8 * 4000, String(r.byDay[0].profit))
  check('day totals reconcile with the range total',
    r.byDay.reduce((s, d) => s + d.total, 0) === r.total)

  console.log('\n[the long-format table meant for AI/spreadsheet analysis]')
  check('one row per menu per trading day', r.daily.length === 17 * 3, String(r.daily.length))
  check('rows only for days the shop traded — no false zeroes on closed days',
    new Set(r.daily.map(x => x.date)).size === 3)
  const d2 = r.daily.filter(x => x.date === '2026-09-02')
  check('a menu that sold that day shows its quantity',
    d2.find(x => x.name === 'ເມນູ 4').qty === 3)
  check('a menu that sold on other days shows 0 on this one, not nothing',
    r.daily.find(x => x.date === '2026-09-01' && x.name === 'ເມນູ 4').qty === 0)
  check('quantities reconcile with the per-menu totals',
    r.daily.filter(x => x.name === 'ເມນູ 1').reduce((s, x) => s + x.qty, 0) === 15)
  check('revenue reconciles with the range total',
    r.daily.reduce((s, x) => s + x.revenue, 0) === r.total)
  check('profit is revenue minus cost on every row',
    r.daily.every(x => x.profit === x.revenue - x.cost))

  console.log('\n[a cancelled bill must not pollute the statistics]')
  const doomed = mkOrder(days[2], [{ menu_id: ids[4], name: 'ເມນູ 5', qty: 9, price: 10000, sub: 90000 }], 'cash')
  db.cancelOrder(doomed.id)
  const r2 = db.report({ from: '2026-09-01', to: '2026-09-03' })
  check('cancelled sale excluded from the totals', r2.total === 270000, String(r2.total))
  check('cancelled sale does not make a menu look sold',
    r2.unsoldMenus.includes('ເມນູ 5'))
  check('and it is still reported separately', r2.cancelled === 1)

  console.log('\n[an empty range]')
  const r3 = db.report({ from: '2020-01-01', to: '2020-01-02' })
  check('no trading days', r3.tradingDays === 0 && r3.byDay.length === 0)
  check('no daily rows invented for a range with no sales', r3.daily.length === 0)
  check('every menu still reported as unsold', r3.unsoldMenus.length === 17)
}

db.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
})()
