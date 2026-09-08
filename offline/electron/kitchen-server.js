'use strict'

const os = require('os')
const path = require('path')
const express = require('express')
const { WebSocketServer } = require('ws')

// The kitchen screen is the one part of this program that is not on the till,
// so it is the one part that needs the network. Shop Wi-Fi only — no internet
// involved. If the router is down this whole module simply never starts and
// the till goes on selling, printing and opening the drawer as normal (§2.1).

let server = null
let wss = null
let state = { running: false, port: 0, ips: [], clients: 0, error: '' }
let handlers = { onDone: null, listOpen: null }

function lanIps() {
  const out = []
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const addr of ifaces[name] || []) {
      if (addr.family === 'IPv4' && !addr.internal) out.push(addr.address)
    }
  }
  return out
}

function broadcast(msg) {
  if (!wss) return 0
  const payload = JSON.stringify(msg)
  let n = 0
  for (const client of wss.clients) {
    if (client.readyState === 1) { client.send(payload); n++ }
  }
  return n
}

function start(port, hooks) {
  handlers = { ...handlers, ...hooks }
  return new Promise(resolve => {
    if (server) return resolve(status())
    const app = express()
    app.use('/kitchen', express.static(path.join(__dirname, '..', 'kitchen')))
    app.get('/', (_req, res) => res.redirect('/kitchen'))
    app.get('/api/orders', (_req, res) => {
      try {
        res.json({ ok: true, orders: handlers.listOpen ? handlers.listOpen() : [] })
      } catch (err) {
        res.status(500).json({ ok: false, error: err.message })
      }
    })

    server = app.listen(port, () => {
      state = { running: true, port, ips: lanIps(), clients: 0, error: '' }
      resolve(status())
    })

    // A busy port (another copy of the program already running, or anything
    // else on 8080) must not take the till down with it.
    server.on('error', err => {
      state = { running: false, port, ips: lanIps(), clients: 0, error: err.message }
      server = null
      wss = null
      resolve(status())
    })

    wss = new WebSocketServer({ server, path: '/ws' })
    wss.on('connection', ws => {
      state.clients = wss.clients.size
      // A screen that has just connected — or reconnected after the router
      // blinked — needs the current board, not just whatever arrives next.
      try {
        ws.send(JSON.stringify({ type: 'sync', orders: handlers.listOpen ? handlers.listOpen() : [] }))
      } catch (_) {}
      ws.on('message', raw => {
        let msg
        try { msg = JSON.parse(raw.toString()) } catch (_) { return }
        if (msg.type === 'done' && handlers.onDone) {
          try { handlers.onDone(msg.id) } catch (_) {}
        }
      })
      ws.on('close', () => { state.clients = wss ? wss.clients.size : 0 })
    })
  })
}

function stop() {
  try { if (wss) wss.close() } catch (_) {}
  try { if (server) server.close() } catch (_) {}
  wss = null
  server = null
  state = { ...state, running: false, clients: 0 }
}

function status() {
  return { ...state, clients: wss ? wss.clients.size : 0, ips: lanIps() }
}

module.exports = { start, stop, status, broadcast, lanIps }
