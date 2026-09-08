// Minimal canvas shim: enough for canvasToEscPos and binarizeLogo, which are
// the two pieces where a mistake shows up as unreadable paper rather than an
// exception.
class Ctx {
  constructor(c) { this.c = c; this.imageSmoothingEnabled = true }
  fillRect(x, y, w, h) {
    const [r, g, b] = this.c._parse(this.fillStyle)
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      const i = (yy * this.c.width + xx) * 4
      this.c.data[i] = r; this.c.data[i+1] = g; this.c.data[i+2] = b; this.c.data[i+3] = 255
    }
  }
  drawImage(img, x, y, w, h) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const px = img.pixelAt(Math.floor(xx / w * img.width), Math.floor(yy / h * img.height))
      const i = ((y + yy) * this.c.width + (x + xx)) * 4
      this.c.data[i] = px[0]; this.c.data[i+1] = px[1]; this.c.data[i+2] = px[2]; this.c.data[i+3] = 255
    }
  }
  getImageData(x, y, w, h) { return { data: this.c.data, width: w, height: h } }
  putImageData(d) { this.c.data = d.data }
}
class Canvas {
  constructor() { this._w = 0; this._h = 0; this.data = new Uint8ClampedArray(0) }
  get width() { return this._w }
  set width(v) { this._w = v; this._alloc() }
  get height() { return this._h }
  set height(v) { this._h = v; this._alloc() }
  _alloc() { this.data = new Uint8ClampedArray(Math.max(0, this._w * this._h * 4)) }
  _parse(s) { return s === '#fff' || s === '#ffffff' ? [255,255,255] : [0,0,0] }
  getContext() { return this._ctx || (this._ctx = new Ctx(this)) }
}
global.document = { createElement: () => new Canvas() }

const { canvasToEscPos, binarizeLogo, dotWidth } = await import('../src/lib/receipt.js')

let pass = 0, fail = 0
const check = (n, c, x = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (x ? ' — ' + x : ''))) }

console.log('\n[paper width]')
check('80mm is 576 dots', dotWidth('80') === 576)
check('58mm is 384 dots', dotWidth('58') === 384)
check('unset defaults to 80mm, per the spec', dotWidth(undefined) === 576)

console.log('\n[ESC/POS raster conversion]')
const c = new Canvas()
c.width = 576; c.height = 3
const ctx = c.getContext()
ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 576, 3)
// One black dot at top-left: the highest bit of the first byte must be set.
c.data[0] = c.data[1] = c.data[2] = 0
const bytes = canvasToEscPos(c)
const wb = 576 / 8
check('GS v 0 raster header emitted', bytes[0] === 0x1B && bytes[1] === 0x40 && bytes[2] === 0x1D && bytes[3] === 0x76 && bytes[4] === 0x30)
check('width in bytes encoded little-endian', bytes[6] === (wb & 0xFF) && bytes[7] === (wb >> 8))
check('height encoded little-endian', bytes[8] === 3 && bytes[9] === 0)
check('payload is exactly width_bytes x height', bytes.length === 10 + wb * 3 + 7)
check('a black pixel sets the top bit of its byte', bytes[10] === 0x80, '0x' + bytes[10].toString(16))
check('white stays clear', bytes[11] === 0x00)
// The cut is last: that trailing byte arriving intact is how the shop proved
// the printer reads the whole stream.
check('feed then full cut at the very end',
  Array.from(bytes.slice(-7)).join(',') === '10,10,10,10,29,86,0')

console.log('\n[logo binarisation — Otsu + invert]')
const mk = (w, h, fn) => ({ width: w, height: h, pixelAt: fn })
// White line art on a dark brown ground — the shop's actual logo shape. Most
// of it is dark, so it must come out inverted: black art on white paper.
const darkGround = mk(8, 8, (x, y) => (x === 3 || x === 4) ? [255, 255, 255] : [61, 31, 10])
const binA = binarizeLogo(darkGround, 8)
const ink = (canvas, x, y) => canvas.data[(y * 8 + x) * 4] === 0
check('light-on-dark logo is inverted, not printed as a slab',
  ink(binA, 3, 0) && !ink(binA, 0, 0))
let inkCount = 0
for (let i = 0; i < 64; i++) if (binA.data[i * 4] === 0) inkCount++
check('inverted result is mostly white paper, not mostly ink', inkCount === 16, String(inkCount))

// Ordinary dark artwork on white: must be left alone.
const lightGround = mk(8, 8, (x, y) => (x === 3 || x === 4) ? [0, 0, 0] : [255, 255, 255])
const binB = binarizeLogo(lightGround, 8)
check('dark-on-light logo is left as it is', ink(binB, 3, 0) && !ink(binB, 0, 0))
check('output is strictly 1-bit — no grey reaches the head',
  Array.from(binA.data).filter((_, i) => i % 4 !== 3).every(v => v === 0 || v === 255))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
