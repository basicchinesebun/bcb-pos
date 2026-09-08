import {
  singleBag, bagPerMenu, bagPerPiece, splitEvenly, missingFromBags,
  roomFor, setBagQty, adjustBagQty, bagLabel, totalPieces, MAX_BAGS,
} from '../src/lib/bags.js'

let pass = 0, fail = 0
const check = (n, c, x = '') => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n + (x ? ' — ' + x : ''))) }

const NAMES = { 1: 'ຊາລາເປົາ', 2: 'ໝັນໂຖ' }
const nameOf = id => NAMES[id]
const cart = [
  { menu_id: 1, name: 'ຊາລາເປົາ', qty: 80 },
  { menu_id: 2, name: 'ໝັນໂຖ', qty: 5 },
]
const sum = bags => bags.reduce((s, b) => s + Object.values(b).reduce((a, q) => a + q, 0), 0)

console.log('\n[quick modes]')
check('single bag holds everything', singleBag(cart).length === 1 && sum(singleBag(cart)) === 85)
check('one bag per menu', bagPerMenu(cart).length === 2 && sum(bagPerMenu(cart)) === 85)
check('one bag per piece', bagPerPiece(cart).length === 85 && sum(bagPerPiece(cart)) === 85)
check('piece count drives the >20 warning', totalPieces(cart) === 85)

console.log('\n[split evenly — the new feature]')
const four = splitEvenly(cart, 4)
check('80 into 4 bags is 20 each', four.every(b => b[1] === 20), JSON.stringify(four))
check('5 spread across 4 bags is 2,1,1,1', four.map(b => b[2] || 0).join(',') === '2,1,1,1')
check('nothing is lost in the split', sum(four) === 85)
const three = splitEvenly([{ menu_id: 1, name: 'a', qty: 80 }], 3)
check('80 into 3 is 27,27,26 — never off by more than one', three.map(b => b[1]).join(',') === '27,27,26')
check('split into 1 equals a single bag', sum(splitEvenly(cart, 1)) === 85 && splitEvenly(cart, 1).length === 1)
check('more bags than pieces drops the empties', splitEvenly([{ menu_id: 1, name: 'a', qty: 2 }], 6).length === 2)
check('garbage input does not produce zero bags', splitEvenly(cart, 'abc').length === 1)
check('absurd bag count is capped', splitEvenly(cart, 9999).length <= MAX_BAGS)
check('cap still loses nothing', sum(splitEvenly(cart, 9999)) === 85)

console.log('\n[incomplete detection — the other new feature]')
check('a complete arrangement reports nothing missing', missingFromBags(cart, singleBag(cart)).length === 0)
check('no arrangement at all is not "incomplete"', missingFromBags(cart, null).length === 0)
const short = [{ 1: 78, 2: 5 }]
const miss = missingFromBags(cart, short)
check('two buns left out is caught', miss.length === 1 && miss[0].packedQty === 78 && miss[0].qty === 80)
check('over-packing is caught too', missingFromBags(cart, [{ 1: 81, 2: 5 }]).length === 1)
check('an empty bag list means everything is missing', missingFromBags(cart, []).length === 2)

console.log('\n[manual editing stays within what was sold]')
let bags = [{}, {}]
bags = setBagQty(bags, cart, 0, 1, 100)
check('cannot put more in a bag than was sold', bags[0][1] === 80)
check('and then there is no room left elsewhere', roomFor(cart, bags, 1, 1) === 0)
bags = adjustBagQty(bags, cart, 1, 1, 1)
check('+ on a full arrangement is a no-op', (bags[1][1] || 0) === 0)
bags = adjustBagQty(bags, cart, 0, 1, -30)
check('− frees room again', bags[0][1] === 50 && roomFor(cart, bags, 1, 1) === 30)
bags = setBagQty(bags, cart, 0, 1, 0)
check('zeroing removes the entry rather than storing 0', !(1 in bags[0]))
bags = setBagQty(bags, cart, 0, 1, -5)
check('negative input clamps to nothing', !(1 in bags[0]))

console.log('\n[receipt label]')
check('label matches the format in the spec',
  bagLabel([{ 1: 2 }, { 2: 1, 1: 1 }], nameOf) === 'ຖົງ 1: ຊາລາເປົາ ×2 | ຖົງ 2: ຊາລາເປົາ ×1, ໝັນໂຖ ×1',
  bagLabel([{ 1: 2 }, { 2: 1, 1: 1 }], nameOf))
check('bag contents listed in the same order regardless of insertion order',
  bagLabel([{ 2: 1, 1: 1 }], nameOf) === bagLabel([{ 1: 1, 2: 1 }], nameOf))
check('no arrangement means no label on the receipt', bagLabel(null, nameOf) === null)
check('empty arrangement means no label', bagLabel([], nameOf) === null)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
