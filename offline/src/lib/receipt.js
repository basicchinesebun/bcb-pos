// Receipt bitmap rendering, ported straight from the web build's
// `renderReceiptCanvas` / `binarizeLogo` / `canvasToEscPos`. That code was
// proved against the shop's actual ICOD printer — paper cut, legible logo,
// correct dot width — so it is carried over rather than rediscovered. Only the
// data it reads has changed: menus and settings now come from SQLite.
//
// The bitmap path exists because a thermal head cannot render Lao from its own
// code pages. Drawing the receipt as an image and shipping raster bytes is the
// only way the shop's own language reaches the paper.

// 80mm paper is 576 dots on a standard head, 58mm is 384.
export function dotWidth(paperMm) {
  return String(paperMm) === '58' ? 384 : 576
}

export function loadImage(src) {
  if (!src) return Promise.resolve(null)
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// A thermal head is 1-bit: every dot is burned or not, there is no grey. A
// logo that is white lettering inside a dark shape therefore prints as a black
// blob — smoothing on the way down to printer resolution drags those thin
// white strokes toward mid-grey, and the print threshold rounds mid-grey down
// to black, swallowing the letters.
//
// So binarise the logo up front, at exactly the size it will occupy on paper,
// using Otsu's method to pick the split point (works whatever colours the
// shop's logo happens to use rather than assuming a fixed cutoff). The caller
// blits the result with smoothing off so nothing re-blurs it.
export function binarizeLogo(img, sizePx) {
  const c = document.createElement('canvas')
  c.width = sizePx; c.height = sizePx
  const cx = c.getContext('2d')
  cx.imageSmoothingEnabled = true
  cx.imageSmoothingQuality = 'high'
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, sizePx, sizePx)
  cx.drawImage(img, 0, 0, sizePx, sizePx)

  const imgData = cx.getImageData(0, 0, sizePx, sizePx)
  const px = imgData.data
  const n = sizePx * sizePx
  const gray = new Uint8Array(n)
  const hist = new Array(256).fill(0)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    const g = Math.round(0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2])
    gray[i] = g
    hist[g]++
  }

  // Otsu: pick the cutoff that best separates the histogram into two groups.
  let sum = 0
  for (let t = 0; t < 256; t++) sum += t * hist[t]
  let sumB = 0, wB = 0, best = 0, threshold = 128
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = n - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) * (mB - mF)
    if (between > best) { best = between; threshold = t }
  }

  // A logo drawn as light artwork on a dark fill — the shop's own mark is
  // white line art on brown — would otherwise print as a solid black slab with
  // the artwork knocked out of it: heavy, slow, unreadable. If most of the
  // mark lands on the dark side, invert, so what reaches the paper is black
  // line art on white. Logos that are already dark-on-light are left alone.
  let darkCount = 0
  for (let i = 0; i < n; i++) if (gray[i] <= threshold) darkCount++
  const invert = darkCount > n / 2

  for (let i = 0; i < n; i++) {
    const isDark = gray[i] <= threshold
    const ink = invert ? !isDark : isDark
    const v = ink ? 0 : 255
    const o = i * 4
    px[o] = px[o + 1] = px[o + 2] = v
    px[o + 3] = 255
  }
  cx.putImageData(imgData, 0, 0)
  return c
}

export function downsampleCanvas(src, targetW) {
  const ratio = targetW / src.width
  const targetH = Math.round(src.height * ratio)
  const dst = document.createElement('canvas')
  dst.width = targetW; dst.height = targetH
  const ctx = dst.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, targetW, targetH)
  ctx.drawImage(src, 0, 0, targetW, targetH)
  return dst
}

export function canvasToEscPos(canvas) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const pixels = ctx.getImageData(0, 0, W, H).data
  const wb = Math.ceil(W / 8)
  const bitmap = new Uint8Array(wb * H)
  for (let row = 0; row < H; row++) {
    for (let bx = 0; bx < wb; bx++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const x = bx * 8 + bit
        if (x < W) {
          const i = (row * W + x) * 4
          const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
          if (gray < 160) byte |= (1 << (7 - bit))  // 160, not 128 — bolder text
        }
      }
      bitmap[row * wb + bx] = byte
    }
  }
  const xL = wb & 0xFF, xH = (wb >> 8) & 0xFF
  const yL = H & 0xFF, yH = (H >> 8) & 0xFF
  const header = new Uint8Array([0x1B, 0x40, 0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH])
  // Feed past the tear bar, then full cut. The cut arriving intact is how the
  // shop's printer proved it reads the whole command stream.
  const footer = new Uint8Array([0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x00])
  const out = new Uint8Array(header.length + bitmap.length + footer.length)
  out.set(header, 0); out.set(bitmap, header.length); out.set(footer, header.length + bitmap.length)
  return out
}

// Two passes over the same op list: the first measures, the second draws at
// the height that fell out of the measurement. Simpler than predicting the
// height of wrapped Lao text up front, and it cannot disagree with itself.
export async function renderReceiptCanvas(order, opts) {
  const {
    shopName = 'Basic Chinese Bun',
    address = '',
    phone = '',
    footer = 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ',
    logoUrl = null,
    width: W = 560,
  } = opts || {}

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const dt = order.created_at ? new Date(order.created_at.replace(' ', 'T')) : new Date()
  const p = n => String(n).padStart(2, '0')
  const dateStr = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`

  if (document.fonts && document.fonts.ready) await document.fonts.ready
  const s = W / 560
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = 100
  const ctx = canvas.getContext('2d')
  const f = (sz, wt = '400') => `${wt} ${Math.round(sz * s)}px 'Noto Sans Lao', 'Noto Serif Lao', sans-serif`

  const logoImg = await loadImage(logoUrl)

  let y = 0
  const ops = []
  const push = fn => ops.push(fn)
  const dash = () => {
    ctx.lineWidth = Math.max(2, Math.round(2 * s))
    ctx.setLineDash([Math.round(6 * s), Math.round(4 * s)])
    ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(W - 10, y)
    ctx.strokeStyle = '#000'; ctx.stroke()
    ctx.setLineDash([]); ctx.lineWidth = 1
    y += Math.round(14 * s)
  }
  const text = (str, size, weight, align, colour = '#000') => push(() => {
    ctx.font = f(size, weight); ctx.textAlign = align; ctx.fillStyle = colour
    const x = align === 'center' ? W / 2 : align === 'right' ? W - 10 : 10
    ctx.fillText(str, x, y += Math.round(size * 1.25 * s))
  })

  if (logoImg) push(() => {
    // Half the paper width. A 72px logo has not got enough head dots to
    // resolve lettering inside it; binarised at final paper resolution and
    // blitted with smoothing off so the downsample cannot soften it.
    const logoPx = Math.round((W / s) * 0.5)
    const ls = logoPx * s
    const bin = binarizeLogo(logoImg, logoPx)
    const smoothing = ctx.imageSmoothingEnabled
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(bin, (W - ls) / 2, y + Math.round(10 * s), ls, ls)
    ctx.imageSmoothingEnabled = smoothing
    y += ls + Math.round(14 * s)
  })

  text(shopName || 'BCB', 28, '900', 'center')
  if (address) text(address, 18, '400', 'center')
  if (phone) text('Tel: ' + phone, 18, '400', 'center')
  push(() => { y += Math.round(8 * s); dash() })
  text('ເລກຄິວ · QUEUE', 17, '400', 'center')
  text(String(order.qnum).padStart(4, '0'), 88, '900', 'center')
  text(dateStr, 18, '400', 'center')
  if (order.sold_by) text('ຜູ້ຂາຍ: ' + order.sold_by, 16, '400', 'center')
  push(() => { y += Math.round(8 * s); dash() })

  items.forEach(it => push(() => {
    ctx.font = f(20); ctx.textAlign = 'left'; ctx.fillStyle = '#000'
    ctx.fillText(`${it.name} x${it.qty}`, 10, y += Math.round(28 * s))
    ctx.textAlign = 'right'; ctx.fillText((it.sub || 0).toLocaleString(), W - 10, y)
  }))

  // The bag breakdown is printed so the customer can check at the counter that
  // what is in front of them matches what they were charged for.
  if (order.bag_label) {
    push(() => { y += Math.round(6 * s); dash() })
    String(order.bag_label).split(' | ').forEach(part => text(part, 17, '700', 'left'))
  }

  push(() => { y += Math.round(8 * s); dash() })
  push(() => {
    const bx = Math.round(16 * s)
    const totalStr = (order.total || 0).toLocaleString()
    ctx.font = f(26, '900')
    const numW = ctx.measureText(totalStr).width
    ctx.font = f(12, '700')
    const curW = ctx.measureText('ກີບ').width
    const gap = Math.round(4 * s)
    const totalTextW = numW + gap + curW
    const boxTopPad = Math.round(14 * s)
    const labelH = Math.round(Math.round(11 * s) * 1.4)
    const gapInner = Math.round(8 * s)
    const amountH = Math.round(Math.round(26 * s) * 1.4)
    const boxH = boxTopPad + labelH + gapInner + amountH + Math.round(14 * s)
    y += Math.round(8 * s)
    const boxY = y
    const boxW = W - bx * 2
    ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, Math.round(2 * s)); ctx.setLineDash([])
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(bx, boxY, boxW, boxH, Math.round(8 * s))
    else ctx.rect(bx, boxY, boxW, boxH)
    ctx.stroke()
    const labelBaseline = boxY + boxTopPad + labelH * 0.75
    ctx.font = f(11, '700'); ctx.textAlign = 'center'; ctx.fillStyle = '#555'
    ctx.fillText('ລວມທັງໝົດ · Total', W / 2, labelBaseline)
    const amountBaseline = labelBaseline + gapInner + amountH * 0.8
    const startX = (W - totalTextW) / 2
    ctx.font = f(26, '900'); ctx.textAlign = 'left'; ctx.fillStyle = '#000'
    ctx.fillText(totalStr, startX, amountBaseline)
    ctx.font = f(12, '700')
    ctx.fillText('ກີບ', startX + numW + gap, amountBaseline)
    y = boxY + boxH
  })

  if (order.payment_method === 'cash' && order.paid_amount != null) {
    push(() => { y += Math.round(6 * s) })
    push(() => {
      ctx.font = f(19); ctx.textAlign = 'left'; ctx.fillStyle = '#000'
      ctx.fillText('ຮັບເງິນ', 10, y += Math.round(26 * s))
      ctx.textAlign = 'right'; ctx.fillText((order.paid_amount || 0).toLocaleString(), W - 10, y)
    })
    push(() => {
      ctx.font = f(19, '900'); ctx.textAlign = 'left'; ctx.fillStyle = '#000'
      ctx.fillText('ເງິນທອນ', 10, y += Math.round(26 * s))
      ctx.textAlign = 'right'; ctx.fillText((order.change_amount || 0).toLocaleString(), W - 10, y)
    })
  } else if (order.payment_method === 'qr') {
    text('ຊຳລະຜ່ານການໂອນ', 18, '700', 'center')
  }

  text(footer || 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ', 17, '400', 'center')
  push(() => { y += Math.round(16 * s) })

  y = 0; ops.forEach(fn => fn())
  const H = y + Math.round(20 * s)

  canvas.height = H
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
  y = 0; ops.forEach(fn => fn())
  return canvas
}

// Rendered at twice the paper width and downsampled: the extra pass is what
// makes Lao glyphs hold together at 203dpi instead of turning to mush.
export async function receiptBytes(order, opts) {
  const paperDots = dotWidth(opts?.paperMm)
  const hires = await renderReceiptCanvas(order, { ...opts, width: paperDots * 2 })
  return canvasToEscPos(downsampleCanvas(hires, paperDots))
}
