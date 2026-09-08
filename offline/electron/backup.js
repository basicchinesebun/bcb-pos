'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')

// §7.1 — the whole shop's takings live in one file on one machine. The most
// common way it disappears is a repair shop reinstalling Windows without
// knowing there was anything to save, so the copies must live outside the
// program folder and must happen without anyone remembering to press
// anything.

const KEEP = 30

function defaultDir() {
  return path.join(os.homedir(), 'Documents', 'BCB-POS-Backup')
}

function stamp(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// SQLite in WAL mode keeps recent writes in a sidecar file, so a plain copy of
// the .db can miss today's sales entirely. better-sqlite3's backup() walks the
// live database properly; a file copy is only the fallback for when the
// handle is already gone.
async function snapshot(db, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  if (db && db.handle && db.handle.open) {
    await db.handle.backup(target)
  } else {
    fs.copyFileSync(db.file, target)
  }
  return target
}

function prune(dir) {
  let files
  try {
    files = fs.readdirSync(dir).filter(f => /^bcb-\d{4}-\d{2}-\d{2}(-\d+)?\.db$/.test(f))
  } catch (_) { return 0 }
  if (files.length <= KEEP) return 0
  const sorted = files
    .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => a.t - b.t)
  let removed = 0
  for (const { f } of sorted.slice(0, sorted.length - KEEP)) {
    try { fs.unlinkSync(path.join(dir, f)); removed++ } catch (_) {}
  }
  return removed
}

// Anything mounted that is not a fixed disk is treated as removable. This is
// deliberately loose — copying an extra file onto a second internal drive is
// harmless, missing the USB stick that was the whole point is not.
function removableTargets() {
  const out = []
  if (process.platform === 'win32') {
    // Drive letters other than C:. execSync for a WMI query would block the
    // quit path, so probe cheaply instead.
    for (const letter of 'DEFGHIJKLMNOPQRSTUVWXYZ') {
      const root = `${letter}:\\`
      try {
        fs.accessSync(root, fs.constants.W_OK)
        out.push(path.join(root, 'BCB-POS-Backup'))
      } catch (_) {}
    }
  } else {
    for (const base of ['/media', '/run/media', '/mnt', '/Volumes']) {
      let entries
      try { entries = fs.readdirSync(base, { withFileTypes: true }) } catch (_) { continue }
      for (const e of entries) {
        if (!e.isDirectory()) continue
        const p = path.join(base, e.name)
        try {
          fs.accessSync(p, fs.constants.W_OK)
          out.push(path.join(p, 'BCB-POS-Backup'))
        } catch (_) {}
      }
    }
  }
  return out
}

// Never allowed to block or fail the quit path: a full disk or a USB stick
// pulled out mid-copy must not hang or crash the program on the way down. The
// outcome is recorded so the next launch can complain instead.
async function run(db, dir) {
  const targetDir = dir || defaultDir()
  const result = { at: new Date().toISOString(), ok: false, path: '', usb: [], error: '' }
  try {
    let name = `bcb-${stamp()}.db`
    let target = path.join(targetDir, name)
    // Reopening the till twice in a day must not overwrite the morning's copy
    // with the evening's — keep both.
    let n = 1
    while (fs.existsSync(target)) {
      name = `bcb-${stamp()}-${n++}.db`
      target = path.join(targetDir, name)
    }
    await snapshot(db, target)
    prune(targetDir)
    result.ok = true
    result.path = target

    for (const usbDir of removableTargets()) {
      try {
        const usbTarget = path.join(usbDir, name)
        fs.mkdirSync(usbDir, { recursive: true })
        fs.copyFileSync(target, usbTarget)
        prune(usbDir)
        result.usb.push(usbTarget)
      } catch (_) {
        // A stick that was pulled out or is write-protected is not an error
        // worth failing the whole backup over.
      }
    }
  } catch (err) {
    result.error = err.message
  }
  return result
}

function daysSince(iso) {
  if (!iso) return Infinity
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return Infinity
  return (Date.now() - t) / 86400000
}

module.exports = { run, prune, defaultDir, daysSince, stamp, KEEP }
