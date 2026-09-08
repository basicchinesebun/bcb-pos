'use strict'

// ESC/POS over libusb.
//
// The shop's printer currently has the WinUSB driver bound to it (swapped in
// with Zadig while fighting WebUSB in the browser build), so anything that
// prints through the Windows spooler — node-thermal-printer and friends — is
// off the table without unbinding that driver first, which is the riskiest
// step of the whole install. libusb talks to a WinUSB-bound device directly,
// so the printer works exactly as it stands today.
//
// The spec names `escpos` + `escpos-usb`; both are thin, long-unmaintained
// wrappers over this same `usb` package, and escpos-usb picks its device by
// scanning a hardcoded vendor list. Talking to `usb` directly is the same
// libusb transport with class-based discovery instead, which is what §3.1
// actually asks for. The bytes on the wire are identical.
//
// Nothing in here may throw on a machine with no printer attached: §2.1 is
// explicit that a plain laptop with no hardware must still sell and save.

let usb = null
let usbLoadError = null
try {
  usb = require('usb')
} catch (err) {
  // No native module (unsupported platform, failed rebuild). Printing is
  // reported as unavailable; every other part of the till carries on.
  usbLoadError = err.message
}

const USB_CLASS_PRINTER = 7
// node-usb exposes the libusb constants on its inner `usb` namespace; 2 is the
// value from the USB spec, kept as a fallback so a future reshuffle of the
// module's exports cannot silently make every endpoint look non-bulk.
const BULK = (usb && usb.usb && usb.usb.LIBUSB_TRANSFER_TYPE_BULK) || 2
const CHUNK = 4096

// A pulse aimed at a pin nothing is wired to is a no-op, and there is no
// single command every printer honours: ESC p is the buffered pulse whose `m`
// byte selects one of the connector's two pins, DLE DC4 is the real-time
// variant some firmwares act on exclusively because it skips the print buffer.
// Fire all four and let the drawer answer whichever it listens for. ~128ms
// pulse width — a stiff solenoid can fail to throw the latch on a short one.
const DRAWER_PULSES = [
  Buffer.from([0x1B, 0x70, 0x00, 0x40, 0xFA]), // ESC p, pin 2
  Buffer.from([0x1B, 0x70, 0x01, 0x40, 0xFA]), // ESC p, pin 5
  Buffer.from([0x10, 0x14, 0x01, 0x00, 0x02]), // DLE DC4 real-time, pin 2
  Buffer.from([0x10, 0x14, 0x01, 0x01, 0x02]), // DLE DC4 real-time, pin 5
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

function deviceKey(dev) {
  const d = dev.deviceDescriptor
  return `${d.idVendor.toString(16).padStart(4, '0')}:${d.idProduct.toString(16).padStart(4, '0')}`
}

function describe(dev) {
  const d = dev.deviceDescriptor
  return {
    key: deviceKey(dev),
    vendorId: d.idVendor,
    productId: d.idProduct,
    label: `${deviceKey(dev)} (bus ${dev.busNumber} · addr ${dev.deviceAddress})`,
  }
}

// A device is a candidate if any of its interfaces declares USB class 7
// (printer). That is how the class is meant to be identified, and it means a
// replacement printer from any brand is found without a code change — the
// explicit ask in §3.1.
function isPrinter(dev) {
  try {
    const cfg = dev.configDescriptor
    if (!cfg) return false
    return cfg.interfaces.some(alts => alts.some(alt => alt.bInterfaceClass === USB_CLASS_PRINTER))
  } catch (_) {
    return false
  }
}

function list() {
  if (!usb) return []
  try {
    return usb.getDeviceList().filter(isPrinter).map(describe)
  } catch (_) {
    return []
  }
}

// Pick the device the shop chose in Settings if it is still plugged in,
// otherwise the first printer found. Staff should never have to choose on a
// single-printer till.
function pick(preferredKey) {
  if (!usb) return null
  let devices
  try { devices = usb.getDeviceList().filter(isPrinter) } catch (_) { return null }
  if (!devices.length) return null
  if (preferredKey) {
    const match = devices.find(d => deviceKey(d) === preferredKey)
    if (match) return match
  }
  return devices[0]
}

// Claim the printer interface and hand back its bulk OUT endpoint. On Linux a
// kernel driver may already own the interface; detach it where the platform
// supports that (Windows/WinUSB has no equivalent and no need for one).
function claim(dev) {
  dev.open()
  let iface = null
  let endpoint = null
  for (const candidate of dev.interfaces) {
    const isPrinterIface = candidate.descriptor.bInterfaceClass === USB_CLASS_PRINTER
    const out = candidate.endpoints.find(e => e.direction === 'out' && e.transferType === BULK)
    if (!isPrinterIface || !out) continue
    if (typeof candidate.isKernelDriverActive === 'function') {
      try { if (candidate.isKernelDriverActive()) candidate.detachKernelDriver() } catch (_) {}
    }
    candidate.claim()
    iface = candidate
    endpoint = out
    break
  }
  if (!endpoint) {
    try { dev.close() } catch (_) {}
    throw new Error('ບໍ່ພົບຊ່ອງສົ່ງຂໍ້ມູນຂອງເຄື່ອງພິມ')
  }
  return { iface, endpoint }
}

function release(dev, iface) {
  try {
    if (iface) iface.release(true, () => { try { dev.close() } catch (_) {} })
    else dev.close()
  } catch (_) {}
}

// Open, write, close on every job. Holding the interface claimed for the life
// of the app means a printer unplugged mid-shift leaves a dead handle behind
// and every later print fails until restart; re-claiming per job costs a few
// milliseconds and survives replugging.
async function write(bytes, preferredKey) {
  if (!usb) throw new Error('ບໍ່ພົບເຄື່ອງພິມ' + (usbLoadError ? ` (${usbLoadError})` : ''))
  const dev = pick(preferredKey)
  if (!dev) throw new Error('ບໍ່ພົບເຄື່ອງພິມ')

  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
  const { iface, endpoint } = claim(dev)
  try {
    for (let i = 0; i < buf.length; i += CHUNK) {
      const chunk = buf.subarray(i, Math.min(i + CHUNK, buf.length))
      await new Promise((resolve, reject) => {
        endpoint.transfer(chunk, err => (err ? reject(err) : resolve()))
      })
    }
  } finally {
    release(dev, iface)
  }
  return true
}

// Pulses go out one at a time with a gap between them: a slow firmware can
// drop the tail of a sequence delivered as one blob, and the real-time
// commands are meant to be seen on their own.
async function kickDrawer(preferredKey) {
  if (!usb) throw new Error('ບໍ່ພົບເຄື່ອງພິມ')
  const dev = pick(preferredKey)
  if (!dev) throw new Error('ບໍ່ພົບເຄື່ອງພິມ')
  const { iface, endpoint } = claim(dev)
  try {
    for (const pulse of DRAWER_PULSES) {
      await new Promise((resolve, reject) => {
        endpoint.transfer(pulse, err => (err ? reject(err) : resolve()))
      })
      await sleep(150)
    }
  } finally {
    release(dev, iface)
  }
  return true
}

function status(preferredKey) {
  const printers = list()
  const selected = pick(preferredKey)
  return {
    available: !!usb,
    loadError: usbLoadError,
    printers,
    connected: !!selected,
    selected: selected ? describe(selected) : null,
  }
}

// Plain-text fallback for the rare case the renderer cannot produce a bitmap
// (no canvas, a font that never loads). Lao does not survive an ESC/POS code
// page, so this prints the numbers that matter — queue, totals, change — and
// says so. Better a legible partial receipt than none.
function textReceipt(order, shop, widthChars = 48) {
  const bytes = []
  const ESC = 0x1B, GS = 0x1D, LF = 0x0A
  const push = s => { for (const b of Buffer.from(s, 'ascii')) bytes.push(b) }
  const line = (ch = '-') => { bytes.push(ESC, 0x61, 0); push(ch.repeat(widthChars)); bytes.push(LF) }
  const row = (l, r) => {
    const pad = Math.max(1, widthChars - l.length - r.length)
    bytes.push(ESC, 0x61, 0); push(l + ' '.repeat(pad) + r); bytes.push(LF)
  }
  const centre = (s, big = false, bold = false) => {
    bytes.push(ESC, 0x61, 1, ESC, 0x45, bold ? 1 : 0, GS, 0x21, big ? 0x11 : 0)
    push(s); bytes.push(LF)
    bytes.push(ESC, 0x45, 0, GS, 0x21, 0)
  }

  bytes.push(ESC, 0x40)
  centre((shop.shop_name || 'Basic Chinese Bun').replace(/[^\x20-\x7E]/g, '') || 'BCB', false, true)
  line('=')
  centre('QUEUE')
  centre(String(order.qnum).padStart(4, '0'), true, true)
  centre(order.created_at || '')
  line()
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  items.forEach((it, i) => row(`#${i + 1} x${it.qty}`, (it.sub || 0).toLocaleString('en-US')))
  line('=')
  row('TOTAL', `${(order.total || 0).toLocaleString('en-US')} LAK`)
  if (order.paid_amount != null) {
    row('CASH', (order.paid_amount || 0).toLocaleString('en-US'))
    row('CHANGE', (order.change_amount || 0).toLocaleString('en-US'))
  }
  line('=')
  bytes.push(LF, LF, LF, LF, GS, 0x56, 0x00)
  return Buffer.from(bytes)
}

module.exports = { list, status, write, kickDrawer, textReceipt, DRAWER_PULSES }
