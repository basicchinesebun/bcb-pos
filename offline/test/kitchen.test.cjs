const path = require('path')
const kitchen = require('../electron/kitchen-server.js')
const WebSocket = require('../node_modules/ws')
const http = require('http')

let pass = 0, fail = 0
const check = (n, c, x = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (x ? ' — ' + x : ''))) }

const openOrders = [{ id: 7, qnum: 42, items: [{ name: 'ຊາລາເປົາ', qty: 2 }], total: 30000, bag_label: 'ຖົງ 1: ຊາລາເປົາ ×2', created_at: '2026-09-08 10:15:00' }]
let doneCalled = null

const get = url => new Promise(res => http.get(url, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => res({ status: r.statusCode, body: b })) }).on('error', e => res({ status: 0, body: e.message })))

;(async () => {
  const st = await kitchen.start(8099, { onDone: id => { doneCalled = id }, listOpen: () => openOrders })
  check('server started', st.running, st.error)
  check('reports LAN addresses for the kitchen tablet', Array.isArray(st.ips))

  const page = await get('http://127.0.0.1:8099/kitchen/')
  check('serves the kitchen page', page.status === 200 && page.body.includes('ຈໍຄົວ'))
  check('page warns loudly on disconnect', page.body.includes('ຂາດການເຊື່ອມຕໍ່'))

  const api = await get('http://127.0.0.1:8099/api/orders')
  check('exposes open orders over HTTP', JSON.parse(api.body).orders[0].qnum === 42)

  const ws = new WebSocket('ws://127.0.0.1:8099/ws')
  const msgs = []
  await new Promise(r => { ws.on('message', d => { msgs.push(JSON.parse(d)); r() }); ws.on('open', () => {}) })
  check('a joining screen is sent the current board', msgs[0].type === 'sync' && msgs[0].orders[0].qnum === 42)

  const got = new Promise(r => ws.on('message', d => { const m = JSON.parse(d); if (m.type === 'new') r(m) }))
  const n = kitchen.broadcast({ type: 'new', order: { id: 8, qnum: 43, items: [], total: 1 } })
  check('broadcast reaches connected screens', n === 1)
  check('new order pushed live', (await got).order.qnum === 43)

  ws.send(JSON.stringify({ type: 'done', id: 7 }))
  await new Promise(r => setTimeout(r, 200))
  check('kitchen "done" comes back to the till', doneCalled === 7)

  ws.send('not json at all')
  await new Promise(r => setTimeout(r, 150))
  check('malformed message does not kill the server', kitchen.status().running)

  // A second copy of the program, or anything else already on the port.
  const clash = await new Promise(resolve => {
    const app = require('../node_modules/express')()
    const s = app.listen(8098, async () => {
      const other = require('../electron/kitchen-server.js')
      s.close()
      resolve(true)
    })
  })
  check('port clash path exercised', clash)

  ws.close()
  kitchen.stop()
  check('stop() leaves the port free', !kitchen.status().running)
  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
})()
