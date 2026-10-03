// Updating the till over a bad line.
//
// The program is 370 MB, almost all of it Chromium, and it changes about never.
// The shop's own code — the menus, the buttons, the arithmetic, the receipts —
// is about five. Shipping the whole thing for a one-line fix would mean a
// 153 MB download on an internet that goes out in storms, so this fetches only
// the five.
//
// It writes the new copy beside the old one and only switches at the next
// launch, so a download that dies halfway cannot leave the till half-updated
// in the middle of service. The copy that shipped inside the program is never
// touched, so there is always something to fall back to.
//
// No dependencies: a tar.gz is a gzip stream Node can already read, wrapped
// around a format simple enough to walk through in forty lines. Pulling in a
// zip library for this would have put third-party code in the update path.

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const MANIFEST = 'desktop/manifest.json'
const BUNDLE = 'desktop/site.tar.gz'

// Walk a tar archive and write the files out. Only regular files and
// directories: the bundle is produced by our own script, and anything else in
// it — a symlink, a device node — has no business being written to disk.
function untar(buf, dest) {
  let off = 0
  let written = 0
  while (off + 512 <= buf.length) {
    const header = buf.subarray(off, off + 512)
    // Two zero blocks mark the end.
    if (header.every(b => b === 0)) break
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '')
    const sizeField = header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim()
    const size = parseInt(sizeField, 8) || 0
    const type = String.fromCharCode(header[156]) || '0'
    // GNU long names and pax headers are not produced by our script; skip them
    // rather than writing a file called "././@LongLink".
    const skip = type === 'L' || type === 'K' || type === 'x' || type === 'g'
    off += 512
    const body = buf.subarray(off, off + size)
    off += Math.ceil(size / 512) * 512

    if (skip || !name || name.includes('..')) continue
    const out = path.join(dest, name)
    if (!path.resolve(out).startsWith(path.resolve(dest))) continue
    if (type === '5') {
      fs.mkdirSync(out, { recursive: true })
    } else if (type === '0' || type === '\0' || type === '') {
      fs.mkdirSync(path.dirname(out), { recursive: true })
      fs.writeFileSync(out, body)
      written++
    }
  }
  return written
}

async function fetchBuffer(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// Where the running copy lives: the newest downloaded one if there is a good
// one, otherwise the copy inside the program.
function resolveSiteRoot(userData, bundledRoot) {
  try {
    const active = path.join(userData, 'site-active.json')
    if (!fs.existsSync(active)) return bundledRoot
    const { dir, build } = JSON.parse(fs.readFileSync(active, 'utf8'))
    // A directory is only ever named here after it was fully written, but
    // check anyway — a half-deleted profile should fall back, not fail.
    if (dir && fs.existsSync(path.join(dir, 'staff', 'index.html'))) {
      return dir
    }
    console.warn('updater: active build', build, 'is unusable, falling back to the bundled copy')
  } catch (e) {
    console.warn('updater: could not read the active build:', e.message)
  }
  return bundledRoot
}

function currentBuild(userData, bundledRoot) {
  try {
    const active = path.join(userData, 'site-active.json')
    if (fs.existsSync(active)) return JSON.parse(fs.readFileSync(active, 'utf8')).build || null
  } catch (_) { }
  try {
    const seed = path.join(bundledRoot, 'offline-seed.json')
    if (fs.existsSync(seed)) return JSON.parse(fs.readFileSync(seed, 'utf8')).build || null
  } catch (_) { }
  return null
}

// Returns { status, build } — status is 'updated', 'current', or 'offline'.
// Never throws: a failed update check must not stop the till from opening.
async function checkForUpdate({ baseUrl, userData, bundledRoot, onLog = () => { } }) {
  try {
    const manifest = JSON.parse((await fetchBuffer(new URL(MANIFEST, baseUrl).href)).toString('utf8'))
    const have = currentBuild(userData, bundledRoot)
    if (!manifest.build) return { status: 'current', build: have }
    if (manifest.build === have) {
      onLog(`already on ${have}`)
      return { status: 'current', build: have }
    }

    onLog(`downloading ${manifest.build}`)
    const gz = await fetchBuffer(new URL(BUNDLE, baseUrl).href)
    const tar = zlib.gunzipSync(gz)

    // Into a temporary directory first, then renamed. A download that dies
    // halfway leaves a .part nobody is pointed at, not a broken till.
    const finalDir = path.join(userData, 'site-' + manifest.build)
    const tmpDir = finalDir + '.part'
    fs.rmSync(tmpDir, { recursive: true, force: true })
    fs.mkdirSync(tmpDir, { recursive: true })
    const n = untar(tar, tmpDir)
    if (!fs.existsSync(path.join(tmpDir, 'staff', 'index.html'))) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
      throw new Error('the downloaded bundle has no staff page in it')
    }
    fs.rmSync(finalDir, { recursive: true, force: true })
    fs.renameSync(tmpDir, finalDir)

    fs.writeFileSync(path.join(userData, 'site-active.json'),
      JSON.stringify({ build: manifest.build, dir: finalDir, at: new Date().toISOString() }))
    onLog(`installed ${manifest.build} (${n} files) — active at next launch`)

    // Keep the previous one, drop anything older. Somewhere to go back to
    // without keeping every build the shop has ever had.
    try {
      const keep = new Set([path.basename(finalDir)])
      fs.readdirSync(userData)
        .filter(d => d.startsWith('site-') && d !== 'site-active.json')
        .sort()
        .slice(0, -2)
        .forEach(d => { if (!keep.has(d)) fs.rmSync(path.join(userData, d), { recursive: true, force: true }) })
    } catch (_) { }

    return { status: 'updated', build: manifest.build }
  } catch (e) {
    onLog('no update: ' + e.message)
    return { status: 'offline', error: e.message }
  }
}

module.exports = { checkForUpdate, resolveSiteRoot, currentBuild, untar }
