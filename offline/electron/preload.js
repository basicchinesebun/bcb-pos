'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// The renderer gets a named list of calls and nothing else — no node, no
// filesystem, no arbitrary IPC channel. Every call resolves to
// { ok, data } or { ok:false, error }; api.call() below is what the UI uses so
// a failure always surfaces as a message on the till instead of a silent no-op.
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

const api = {
  settings: {
    get: () => invoke('settings:get'),
    set: obj => invoke('settings:set', obj),
  },
  staff: {
    list: includeInactive => invoke('staff:list', includeInactive),
    login: pin => invoke('staff:login', pin),
    save: s => invoke('staff:save', s),
    remove: id => invoke('staff:delete', id),
  },
  menus: {
    list: () => invoke('menus:list'),
    save: m => invoke('menus:save', m),
    remove: id => invoke('menus:delete', id),
    setStock: (id, n) => invoke('stock:set', id, n),
    resetStock: n => invoke('stock:reset', n),
  },
  orders: {
    create: o => invoke('orders:create', o),
    cancel: id => invoke('orders:cancel', id),
    done: (id, done) => invoke('orders:done', id, done),
    list: opts => invoke('orders:list', opts),
    open: () => invoke('orders:open'),
    get: id => invoke('orders:get', id),
    report: range => invoke('report:range', range),
  },
  printer: {
    status: () => invoke('printer:status'),
    list: () => invoke('printer:list'),
    // Uint8Array does not survive structured cloning through every Electron
    // version cleanly; a plain array always does and the cost is trivial for
    // a receipt-sized payload.
    print: bytes => invoke('printer:print', Array.from(bytes)),
    drawer: () => invoke('printer:drawer'),
    textReceipt: order => invoke('printer:textReceipt', order),
  },
  images: {
    pick: () => invoke('images:pick'),
    remove: name => invoke('images:delete', name),
    url: name => (name ? `bcbimg://images/${encodeURIComponent(name)}` : null),
  },
  display: {
    open: () => invoke('display:open'),
    close: () => invoke('display:close'),
    push: state => invoke('display:state', state),
    status: () => invoke('display:status'),
  },
  kitchen: {
    status: () => invoke('kitchen:status'),
    restart: port => invoke('kitchen:restart', port),
  },
  queue: {
    call: qnum => invoke('queue:call', qnum),
  },
  data: {
    backupNow: () => invoke('backup:now'),
    backupInfo: () => invoke('backup:info'),
    pickBackupDir: () => invoke('backup:pickDir'),
    importJson: () => invoke('data:importJson'),
    exportCsv: csv => invoke('data:exportCsv', csv),
    notice: () => invoke('app:notice'),
  },
  on: (channel, fn) => {
    const allowed = ['display:update', 'display:queue', 'orders:changed']
    if (!allowed.includes(channel)) return () => {}
    const listener = (_event, payload) => fn(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
}

contextBridge.exposeInMainWorld('bcb', api)
