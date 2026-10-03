// The till as a Windows program.
//
// The point of this is the first launch. A web page has to be fetched from a
// server before it can run even once, so the browser version always needs the
// internet at least one time — and a storm here takes the line out for a day.
// Installed from a USB stick, this needs it never.
//
// The app's own files are served over http://127.0.0.1 rather than opened as
// file:// URLs. That is not decoration: on file:// the page has an opaque
// origin, so localStorage, IndexedDB and service workers either fail outright
// or are wiped between launches — and IndexedDB is where offline sales live.
// A fixed loopback origin gives the storage somewhere stable to live.

const { app, BrowserWindow, shell, Menu, dialog, session } = require('electron')
const http = require('http')
const fs = require('fs')
const path = require('path')
const { checkForUpdate, resolveSiteRoot, currentBuild } = require('./updater')

const PORT = 47814              // fixed: the storage origin must not move
const HOST = '127.0.0.1'
const BUNDLED_ROOT = path.join(__dirname, '..', 'site')
// Where the shop's own code is served from: a downloaded update if one has been
// installed, otherwise the copy that shipped inside the program. Decided once,
// at launch, so an update landing mid-service cannot change the files under a
// page that is already open.
let ROOT = BUNDLED_ROOT
const START = '/staff/'

// Where updates come from. The practice site serves the same files the browser
// version runs on, so there is nothing extra to host.
const UPDATE_BASE = process.env.BCB_UPDATE_URL || 'https://test.basicchinesebun.com/'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

function safeJoin(root, urlPath) {
  // Everything here is local, but the server still must not be talked out of
  // the site directory by a request full of "..".
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  const resolved = path.resolve(root, '.' + decoded)
  return resolved.startsWith(path.resolve(root)) ? resolved : null
}

function resolveFile(urlPath) {
  let p = safeJoin(ROOT, urlPath)
  if (!p) return null
  try {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html')
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
    // The export writes /staff/index.html; a request for /staff should find it.
    const withHtml = p + '.html'
    if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) return withHtml
    const asDir = path.join(p, 'index.html')
    if (fs.existsSync(asDir) && fs.statSync(asDir).isFile()) return asDir
  } catch (_) { }
  return null
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const file = resolveFile(req.url || '/')
      if (!file) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('not found')
        return
      }
      const ext = path.extname(file).toLowerCase()
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        // The files change only when the app is reinstalled, but a stale shell
        // after an update is a support call nobody can make during an outage.
        'Cache-Control': 'no-cache',
        'Service-Worker-Allowed': '/',
      })
      fs.createReadStream(file).pipe(res)
    })
    server.on('error', reject)
    server.listen(PORT, HOST, () => resolve(server))
  })
}

// The receipt printer, the cash drawer and the customer display all reach the
// hardware through WebUSB, Web Serial and Web Bluetooth. In a browser the user
// picks the device from a chooser the browser draws. Electron draws no chooser
// at all: it raises an event and waits, and if nothing answers, requestDevice()
// hangs or comes back empty — so in the packaged app the printer buttons would
// simply do nothing, with no error to explain why.
//
// The till has one printer and one drawer, so answering with the first device
// offered is the right behaviour, and the choice is remembered so a reconnect
// does not change which one it is.
const ORIGIN = `http://${HOST}:${PORT}`
const remembered = { usb: null, serial: null, bluetooth: null }

function isOurs(url) {
  try { return new URL(url).origin === ORIGIN } catch (_) { return false }
}

function wireDeviceAccess(ses) {
  // Everything here is the shop's own hardware, reached from the app's own
  // pages served off loopback. Nothing else is allowed near it.
  ses.setPermissionCheckHandler((wc, permission, origin) =>
    ['usb', 'serial', 'hid', 'bluetooth'].includes(permission) && isOurs(origin || (wc && wc.getURL())))
  ses.setPermissionRequestHandler((wc, permission, callback) =>
    callback(['usb', 'serial', 'hid', 'bluetooth', 'clipboard-read', 'clipboard-sanitized-write'].includes(permission)
      && isOurs(wc.getURL())))
  ses.setDevicePermissionHandler(details => isOurs(details.origin))
}

function wireDeviceChoosers(wc) {
  wc.session.on('select-usb-device', (event, details, callback) => {
    event.preventDefault()
    const keep = details.deviceList.find(d => d.deviceId === remembered.usb)
    const pick = keep || details.deviceList[0]
    remembered.usb = pick ? pick.deviceId : null
    callback(pick ? pick.deviceId : undefined)
  })
  wc.session.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault()
    const keep = portList.find(p => p.portId === remembered.serial)
    const pick = keep || portList[0]
    remembered.serial = pick ? pick.portId : null
    callback(pick ? pick.portId : '')
  })
  // Bluetooth scanning calls back repeatedly as devices appear. Answer with
  // the first one that has a name — an unnamed beacon is not the printer —
  // and leave it alone afterwards.
  wc.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault()
    const keep = deviceList.find(d => d.deviceId === remembered.bluetooth)
    const pick = keep || deviceList.find(d => d.deviceName) || deviceList[0]
    if (pick) { remembered.bluetooth = pick.deviceId; callback(pick.deviceId) }
    // No callback when there is nothing yet: the scan carries on and this
    // fires again. Calling back with '' here would cancel it outright.
  })
  // A device unplugged mid-service must not keep being offered.
  wc.session.on('usb-device-revoked', (e, d) => { if (d && d.device && d.device.deviceId === remembered.usb) remembered.usb = null })
}

let win = null
let updateReady = null

async function runUpdateCheck(announce) {
  const res = await checkForUpdate({
    baseUrl: UPDATE_BASE,
    userData: app.getPath('userData'),
    bundledRoot: BUNDLED_ROOT,
    onLog: m => console.log('updater:', m),
  })
  if (res.status === 'updated') {
    updateReady = res.build
    if (win) {
      // Said in the page rather than in a dialog: a modal in front of a queue
      // of customers is worse than the problem it is reporting.
      win.webContents.executeJavaScript(
        `window.dispatchEvent(new CustomEvent('bcb-update-ready',{detail:${JSON.stringify(res.build)}}))`
      ).catch(() => { })
    }
    if (announce) {
      dialog.showMessageBox(win, {
        type: 'info', buttons: ['ຕົກລົງ'],
        message: 'ມີເວີຊັນໃໝ່ແລ້ວ',
        detail: 'ດາວໂຫຼດແລ້ວ — ຈະໃຊ້ໄດ້ເມື່ອເປີດໂປຣແກຣມໃໝ່ຄັ້ງຕໍ່ໄປ',
      })
    }
  } else if (announce) {
    dialog.showMessageBox(win, {
      type: res.status === 'current' ? 'info' : 'warning', buttons: ['ຕົກລົງ'],
      message: res.status === 'current' ? 'ໃຊ້ເວີຊັນຫຼ້າສຸດຢູ່ແລ້ວ' : 'ກວດຫາເວີຊັນໃໝ່ບໍ່ໄດ້',
      detail: res.status === 'current' ? '' : 'ອາດຈະບໍ່ມີອິນເຕີເນັດ — ໂປຣແກຣມຍັງໃຊ້ໄດ້ຕາມປົກກະຕິ',
    })
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#fdf6ee',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      // The page is our own code, served from loopback, and talks to nothing
      // in Node. Keep the renderer sandboxed.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  wireDeviceChoosers(win.webContents)
  win.once('ready-to-show', () => win.show())
  win.loadURL(`http://${HOST}:${PORT}${START}`)

  // A link to somewhere else opens in the real browser; this window is a till.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`http://${HOST}:${PORT}`)) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })
}

// A short menu, because the window hides the bar by default: staff need a
// reload they can reach when a screen gets stuck, and nothing else.
function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'BCB',
      submenu: [
        { label: 'ໂຫຼດໃໝ່', accelerator: 'F5', click: () => win && win.reload() },
        { label: 'ເຕັມຈໍ', accelerator: 'F11', click: () => win && win.setFullScreen(!win.isFullScreen()) },
        { type: 'separator' },
        { label: 'ໜ້າຂາຍ (Staff)', click: () => win && win.loadURL(`http://${HOST}:${PORT}/staff/`) },
        { label: 'ໜ້າຄົວ (Kitchen)', click: () => win && win.loadURL(`http://${HOST}:${PORT}/kitchen/`) },
        { label: 'ຈໍລູກຄ້າ (Display)', click: () => win && win.loadURL(`http://${HOST}:${PORT}/display/`) },
        { label: 'ບອດຄິວ (Queue)', click: () => win && win.loadURL(`http://${HOST}:${PORT}/queue/`) },
        { type: 'separator' },
        { label: 'ກວດຫາເວີຊັນໃໝ່', click: () => runUpdateCheck(true) },
        { type: 'separator' },
        { label: 'ເຄື່ອງມືນັກພັດທະນາ', accelerator: 'F12', click: () => win && win.webContents.toggleDevTools() },
        { type: 'separator' },
        { role: 'quit', label: 'ອອກ' },
      ],
    },
    { role: 'editMenu', label: 'ແກ້ໄຂ' },
  ]))
}

// One till, one window. A second launch raises the one already running rather
// than opening a rival copy fighting over the same port and the same storage.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus() }
  })

  app.whenReady().then(async () => {
    try {
      await startServer()
    } catch (err) {
      dialog.showErrorBox('ເປີດບໍ່ໄດ້', 'ບໍ່ສາມາດເປີດເຊີບເວີພາຍໃນໄດ້:\n' + (err && err.message))
      app.quit()
      return
    }
    // Pick the copy to serve before anything is served, so the files cannot
    // change under a page that is already open.
    ROOT = resolveSiteRoot(app.getPath('userData'), BUNDLED_ROOT)
    console.log('serving', ROOT, '| build', currentBuild(app.getPath('userData'), BUNDLED_ROOT))

    wireDeviceAccess(session.defaultSession)
    buildMenu()
    createWindow()

    // Look for a new build a few seconds in, once the till is already usable.
    // It installs beside the running copy and takes effect at the next launch;
    // nothing is interrupted, and with no line it simply does nothing.
    setTimeout(() => runUpdateCheck(false), 8000)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => app.quit())
}
