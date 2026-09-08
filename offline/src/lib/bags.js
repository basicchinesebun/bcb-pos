// Bag arrangement, kept out of the component so it can be tested on its own.
// Two of these behaviours are new here and absent from the web build: an even
// split into N bags, and noticing that an arrangement does not add up.
//
// A "bag" is a plain { [menuId]: qty } map; an arrangement is an array of them.
// `items` is always the cart: [{ menu_id, name, qty, ... }].

export const EACH_BAG_WARN = 20
export const MAX_BAGS = 50

export function singleBag(items) {
  return [Object.fromEntries(items.map(i => [i.menu_id, i.qty]))]
}

export function bagPerMenu(items) {
  return items.map(i => ({ [i.menu_id]: i.qty }))
}

export function bagPerPiece(items) {
  const out = []
  for (const it of items) for (let i = 0; i < it.qty; i++) out.push({ [it.menu_id]: 1 })
  return out
}

export function totalPieces(items) {
  return items.reduce((s, i) => s + i.qty, 0)
}

// 80 buns into 4 bags is 20 each; 81 into 4 is 21, 20, 20, 20. Remainders go
// to the earliest bags so the difference is never more than one piece, and
// mixed carts are split menu by menu rather than by running total.
export function splitEvenly(items, n) {
  const count = Math.max(1, Math.min(parseInt(n, 10) || 1, MAX_BAGS))
  const out = Array.from({ length: count }, () => ({}))
  for (const it of items) {
    const base = Math.floor(it.qty / count)
    const rem = it.qty % count
    for (let i = 0; i < count; i++) {
      const q = base + (i < rem ? 1 : 0)
      if (q > 0) out[i][it.menu_id] = q
    }
  }
  // With more bags than pieces the tail comes out empty; an empty bag on a
  // receipt is just confusing.
  return out.filter(b => Object.keys(b).length > 0)
}

export function packedTotals(bags) {
  const out = {}
  for (const bag of bags || []) {
    for (const [id, q] of Object.entries(bag)) out[id] = (out[id] || 0) + q
  }
  return out
}

// The web build let a half-finished arrangement through and the unpacked items
// simply vanished from the printed breakdown — the customer was charged for
// them and never saw them listed. This is what the warning before payment is
// built on.
export function missingFromBags(items, bags) {
  if (!bags) return []
  const packed = packedTotals(bags)
  return items
    .map(it => ({ ...it, packedQty: packed[it.menu_id] || 0 }))
    .filter(it => it.packedQty !== it.qty)
}

// How many more of this menu may still be put into bag `bagIdx` before the
// arrangement would hold more than was actually sold.
export function roomFor(items, bags, bagIdx, menuId) {
  const want = items.find(i => i.menu_id === menuId)?.qty || 0
  const elsewhere = (bags || []).reduce((s, b, j) => (j === bagIdx ? s : s + (b[menuId] || 0)), 0)
  return Math.max(0, want - elsewhere)
}

export function setBagQty(bags, items, bagIdx, menuId, n) {
  const capped = Math.max(0, Math.min(parseInt(n, 10) || 0, roomFor(items, bags, bagIdx, menuId)))
  return bags.map((bag, i) => {
    if (i !== bagIdx) return bag
    const next = { ...bag }
    if (capped <= 0) delete next[menuId]
    else next[menuId] = capped
    return next
  })
}

export function adjustBagQty(bags, items, bagIdx, menuId, delta) {
  const current = bags[bagIdx]?.[menuId] || 0
  return setBagQty(bags, items, bagIdx, menuId, current + delta)
}

// 'ຖົງ 1: ຊາລາເປົາ ×2 | ຖົງ 2: …' — printed on the receipt so the customer can
// check the bags in front of them against what they paid for.
export function bagLabel(bags, nameOf) {
  if (!bags || bags.length === 0) return null
  return bags.map((bag, i) => {
    const parts = Object.entries(bag)
      .filter(([, q]) => q > 0)
      // Sorted by menu id explicitly: every bag then lists its contents in the
      // same order, so a customer checking bag 3 against bag 1 reads the same
      // sequence. Relying on object key order would give the same result today
      // but only by accident of how JS orders integer-like keys.
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([id, q]) => `${nameOf(Number(id))} ×${q}`)
    return `ຖົງ ${i + 1}: ${parts.join(', ')}`
  }).join(' | ')
}
