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

const { app, BrowserWindow, shell, Menu, dialog } = require('electron')
const http = require('http')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const PORT = 47814              // fixed: the storage origin must not move
const HOST = '127.0.0.1'
const ROOT = path.join(__dirname, '..', 'site')
const START = '/staff/'

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

let win = null

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
    buildMenu()
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => app.quit())
}
