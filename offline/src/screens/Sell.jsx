import { useState, useMemo, useCallback, useEffect } from 'react'
import { api, call, imageUrl, money } from '../lib/api'
import { Numpad, Modal, Confirm, useLongPress } from '../lib/ui'
import { receiptBytes } from '../lib/receipt'
import {
  EACH_BAG_WARN, singleBag, bagPerMenu, bagPerPiece, splitEvenly,
  missingFromBags, roomFor, setBagQty, adjustBagQty, bagLabel as buildBagLabel,
} from '../lib/bags'

// One selling mode, not two. The web build had a separate "pack straight into
// bags" flow beside the normal one and staff regularly started an order in the
// wrong one; here you always choose items first and arrange bags after.

function MenuCard({ menu, qty, onAdd, onTypeQty }) {
  const out = menu.stock <= 0
  const press = useLongPress(() => { if (!out) onTypeQty() }, () => { if (!out) onAdd() })
  const img = imageUrl(menu.image_path)
  return (
    <button
      type="button"
      className={`menu-card ${out ? 'menu-out' : ''} ${qty > 0 ? 'menu-picked' : ''}`}
      disabled={out}
      {...press}
    >
      <div className="menu-img">
        {img ? <img src={img} alt="" draggable={false} /> : <span className="menu-emoji">🥟</span>}
        {qty > 0 && <span className="menu-badge">{qty}</span>}
      </div>
      <div className="menu-name">{menu.name}</div>
      <div className="menu-foot">
        <span className="menu-price">{money(menu.price)}</span>
        <span className={`menu-stock ${menu.stock <= 5 ? 'stock-low' : ''}`}>
          {out ? 'ໝົດ' : `ເຫຼືອ ${menu.stock}`}
        </span>
      </div>
    </button>
  )
}

export default function Sell({ staff, menus, settings, openOrders, toast, reloadMenus, reloadOpen }) {
  const [cart, setCart] = useState({})
  const [bags, setBags] = useState(null)      // null = not arranged yet
  const [qtyFor, setQtyFor] = useState(null)  // { menuId, bagIdx|null, value }
  const [bagModal, setBagModal] = useState(false)
  const [splitAsk, setSplitAsk] = useState(null)
  const [pay, setPay] = useState(null)        // { method, tendered }
  const [confirmIncomplete, setConfirmIncomplete] = useState(null)
  const [busy, setBusy] = useState(false)

  const active = useMemo(() => menus.filter(m => m.active), [menus])
  const byId = useMemo(() => new Map(menus.map(m => [m.id, m])), [menus])

  const cartItems = useMemo(() => (
    Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, qty]) => {
        const m = byId.get(Number(id))
        return m ? { menu_id: m.id, name: m.name, price: m.price, qty, sub: m.price * qty } : null
      })
      .filter(Boolean)
  ), [cart, byId])

  const total = cartItems.reduce((s, i) => s + i.sub, 0)
  const pieces = cartItems.reduce((s, i) => s + i.qty, 0)

  const setQty = useCallback((menuId, n) => {
    const m = byId.get(menuId)
    const capped = Math.max(0, Math.min(n, m ? m.stock : n))
    if (m && n > m.stock) toast(`${m.name} ເຫຼືອພຽງ ${m.stock}`, 'warn')
    setCart(prev => {
      const next = { ...prev }
      if (capped <= 0) delete next[menuId]
      else next[menuId] = capped
      return next
    })
    // Any change to what is being bought invalidates a bag arrangement built
    // from the old contents — better to make staff redo it than to print a
    // breakdown that no longer matches the receipt.
    setBags(null)
  }, [byId, toast])

  const add = useCallback((menuId, n = 1) => {
    setQty(menuId, (cart[menuId] || 0) + n)
  }, [cart, setQty])

  const clearAll = useCallback(() => {
    setCart({})
    setBags(null)
    setPay(null)
    api.display.push({ items: [], total: 0 }).catch(() => {})
  }, [])

  // ─── bag arrangement ───
  const missing = useMemo(() => missingFromBags(cartItems, bags), [cartItems, bags])

  // 1 piece per bag is genuinely useful for a handful of items and absurd for
  // 80, which is exactly what the web build let staff do. Warn, then obey.
  const bagEach = () => {
    if (pieces > EACH_BAG_WARN) {
      setConfirmIncomplete({
        message: `ຈະໄດ້ ${pieces} ຖົງ — ຫຼາຍເກີນໄປບໍ?`,
        confirmLabel: `ເອົາ ${pieces} ຖົງ`,
        onOk: () => { setBags(bagPerPiece(cartItems)); setConfirmIncomplete(null) },
      })
      return
    }
    setBags(bagPerPiece(cartItems))
  }

  const bagLabel = useMemo(
    () => buildBagLabel(bags, id => byId.get(id)?.name || '?'),
    [bags, byId]
  )

  // ─── payment ───
  const openPay = method => {
    if (!cartItems.length) return
    // The web build let an incomplete arrangement through and the missing
    // items simply vanished off the printed breakdown. Say so first.
    if (bags && missing.length) {
      setConfirmIncomplete({
        message: `ຈັດຖົງບໍ່ຄົບ: ${missing.map(m => `${m.name} ${m.packedQty}/${m.qty}`).join(', ')}`,
        confirmLabel: 'ຂາຍຕໍ່ໄປ',
        onOk: () => { setConfirmIncomplete(null); startPay(method) },
      })
      return
    }
    startPay(method)
  }

  const startPay = method => {
    setPay({ method, tendered: '' })
    // Only now does the customer screen leave the menu board. Half-built carts
    // flashing up while someone is still reading the menu is worse than
    // useless, so nothing is pushed until a payment method is chosen.
    api.display.push({
      items: cartItems.map(i => ({ name: i.name, qty: i.qty, sub: i.sub })),
      total,
      method,
      qr: method === 'qr' ? imageUrl(settings.qr_image_path) : null,
    }).catch(() => {})
  }

  // Cash is typed in thousands: staff punch 61 for a 61,000 kip note. Nobody
  // has time to type three zeroes on every sale.
  const tenderedValue = pay?.method === 'cash' ? (parseInt(pay.tendered, 10) || 0) * 1000 : 0
  const change = tenderedValue - total

  const closePay = () => {
    setPay(null)
    api.display.push({ items: [], total: 0 }).catch(() => {})
  }

  async function printReceipt(order) {
    try {
      const bytes = await receiptBytes(order, {
        shopName: settings.shop_name,
        address: settings.shop_address,
        phone: settings.shop_phone,
        footer: settings.receipt_footer,
        logoUrl: imageUrl(settings.logo_path),
        paperMm: settings.printer_width,
      })
      await call(api.printer.print, bytes)
      return true
    } catch (err) {
      // §2.1 — no printer is a normal state, not a crash. The sale is already
      // saved; the receipt is the only thing lost.
      toast(`ບໍ່ພົບເຄື່ອງພິມ · ບິນ #${String(order.qnum).padStart(4, '0')} ບັນທຶກແລ້ວ`, 'warn')
      return false
    }
  }

  async function finish() {
    if (busy) return
    if (pay.method === 'cash' && change < 0) { toast('ເງິນທີ່ຮັບບໍ່ພໍ', 'error'); return }
    setBusy(true)
    let order
    try {
      order = await call(api.orders.create, {
        items: cartItems,
        bag_label: bagLabel,
        total,
        payment_method: pay.method,
        paid_amount: pay.method === 'cash' ? tenderedValue : total,
        change_amount: pay.method === 'cash' ? change : 0,
        sold_by: staff.name,
      })
    } catch (err) {
      // The money has not been taken yet if this fails, so stop here loudly
      // rather than half-completing the sale.
      toast(`ບັນທຶກບໍ່ສຳເລັດ: ${err.message}`, 'error')
      setBusy(false)
      return
    }

    toast(`ຂາຍແລ້ວ · ຄິວ ${String(order.qnum).padStart(4, '0')}`, 'ok')
    setCart({}); setBags(null); setPay(null)

    // Everything after the sale is best-effort: the order is in the database
    // and on the kitchen board already, and none of this may undo that.
    printReceipt(order)
    if (pay.method === 'cash') {
      call(api.printer.drawer).catch(() => {})
    }
    api.display.push({ items: [], total: 0 }).catch(() => {})
    reloadMenus().catch(() => {})
    reloadOpen().catch(() => {})
    setBusy(false)
  }

  // A sale that ends any way at all must leave the customer screen back on the
  // menu board. The old system could sit showing a paid order's total for the
  // next customer to puzzle over.
  useEffect(() => () => { api.display.push({ items: [], total: 0 }).catch(() => {}) }, [])

  return (
    <div className="sell">
      <section className="menu-pane">
        {active.length === 0 ? (
          <div className="empty">
            ຍັງບໍ່ມີເມນູ — ໄປທີ່ ⚙️ ຕັ້ງຄ່າ ເພື່ອເພີ່ມເມນູ ຫຼື ນຳເຂົ້າຈາກໄຟລ໌ JSON ຂອງເວັບ
          </div>
        ) : (
          <div className="menu-grid">
            {active.map(m => (
              <MenuCard
                key={m.id}
                menu={m}
                qty={cart[m.id] || 0}
                onAdd={() => add(m.id)}
                onTypeQty={() => setQtyFor({ menuId: m.id, value: String(cart[m.id] || '') })}
              />
            ))}
          </div>
        )}
      </section>

      <aside className="cart-pane">
        <div className="cart-head">
          <span>ລາຍການ</span>
          {cartItems.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>ລົບທັງໝົດ</button>
          )}
        </div>

        <div className="cart-list">
          {cartItems.length === 0 && <div className="cart-empty">ຈິ້ມເມນູເພື່ອເລີ່ມຂາຍ<br /><small>ກົດຄ້າງ = ພິມຈຳນວນ</small></div>}
          {cartItems.map(it => (
            <div key={it.menu_id} className="cart-row">
              <div className="cart-name">{it.name}</div>
              <div className="cart-ctrl">
                <button type="button" className="qty-btn" onClick={() => setQty(it.menu_id, it.qty - 1)}>−</button>
                <button
                  type="button"
                  className="qty-num"
                  onClick={() => setQtyFor({ menuId: it.menu_id, value: String(it.qty) })}
                >{it.qty}</button>
                <button type="button" className="qty-btn" onClick={() => setQty(it.menu_id, it.qty + 1)}>+</button>
              </div>
              <div className="cart-sub">{money(it.sub)}</div>
            </div>
          ))}
        </div>

        {cartItems.length > 0 && (
          <div className="bag-box">
            <div className="bag-head">
              <span>ແຍກຖົງ</span>
              {bags && (
                <span className={missing.length ? 'bag-warn' : 'bag-ok'}>
                  {bags.length} ຖົງ{missing.length ? ' · ບໍ່ຄົບ' : ' ✓'}
                </span>
              )}
            </div>
            <div className="bag-btns">
              <button type="button" className="chip" onClick={() => setBags(singleBag(cartItems))}>ຖົງດຽວ</button>
              <button type="button" className="chip" onClick={() => setBags(bagPerMenu(cartItems))}>ແຍກເມນູ</button>
              <button type="button" className="chip" onClick={() => setSplitAsk('')}>ແບ່ງເທົ່າກັນ</button>
              <button type="button" className="chip" onClick={bagEach}>ແຍກທຸກກ້ອນ</button>
              <button type="button" className="chip" onClick={() => { if (!bags) setBags(singleBag(cartItems)); setBagModal(true) }}>ຈັດເອງ</button>
              {bags && <button type="button" className="chip chip-x" onClick={() => setBags(null)}>ລ້າງ</button>}
            </div>
            {bagLabel && <div className="bag-label">{bagLabel}</div>}
          </div>
        )}

        <div className="cart-foot">
          <div className="total-row">
            <span>ລວມ {pieces > 0 ? `· ${pieces} ກ້ອນ` : ''}</span>
            <strong>{money(total)} ກີບ</strong>
          </div>
          <div className="row gap">
            <button type="button" className="btn btn-primary flex1" disabled={!cartItems.length} onClick={() => openPay('cash')}>
              💵 ເງິນສົດ
            </button>
            <button type="button" className="btn btn-outline flex1" disabled={!cartItems.length} onClick={() => openPay('qr')}>
              📱 ໂອນ
            </button>
          </div>
        </div>
      </aside>

      {qtyFor && (
        <Modal title={`ຈຳນວນ · ${byId.get(qtyFor.menuId)?.name || ''}`} onClose={() => setQtyFor(null)}>
          <div className="qty-display">{qtyFor.value || '0'}</div>
          <Numpad
            value={qtyFor.value}
            onChange={v => setQtyFor(q => ({ ...q, value: v }))}
            onSubmit={() => {
              const n = parseInt(qtyFor.value, 10) || 0
              if (qtyFor.bagIdx == null) setQty(qtyFor.menuId, n)
              else setBags(prev => setBagQty(prev, cartItems, qtyFor.bagIdx, qtyFor.menuId, n))
              setQtyFor(null)
            }}
          />
        </Modal>
      )}

      {splitAsk !== null && (
        <Modal title="ແບ່ງເປັນຈັກຖົງ?" onClose={() => setSplitAsk(null)}>
          <div className="qty-display">{splitAsk || '0'}</div>
          <Numpad
            value={splitAsk}
            onChange={setSplitAsk}
            onSubmit={() => { setBags(splitEvenly(cartItems, splitAsk)); setSplitAsk(null) }}
          />
        </Modal>
      )}

      {bagModal && bags && (
        <Modal title="ຈັດຖົງເອງ" wide onClose={() => setBagModal(false)}>
          <BagEditor
            bags={bags}
            setBags={setBags}
            cartItems={cartItems}
            onQty={(bagIdx, menuId, value) => setQtyFor({ menuId, bagIdx, value })}
          />
        </Modal>
      )}

      {pay && (
        <Modal title={pay.method === 'cash' ? 'ຮັບເງິນສົດ' : 'ຮັບເງິນໂອນ'} onClose={closePay}>
          <div className="pay-total">
            <span>ຍອດທີ່ຕ້ອງຈ່າຍ</span>
            <strong>{money(total)} ກີບ</strong>
          </div>
          {pay.method === 'cash' ? (
            <>
              <div className="pay-tendered">
                <span>ຮັບມາ</span>
                <strong>{money(tenderedValue)}</strong>
              </div>
              <div className={`pay-change ${change < 0 ? 'change-bad' : ''}`}>
                <span>ເງິນທອນ</span>
                <strong>{change < 0 ? `ຂາດ ${money(-change)}` : money(change)}</strong>
              </div>
              <div className="quick-cash">
                {[20, 50, 100, 200, 500].map(k => (
                  <button key={k} type="button" className="chip" onClick={() => setPay(p => ({ ...p, tendered: String(k) }))}>
                    {k}k
                  </button>
                ))}
                <button type="button" className="chip" onClick={() => setPay(p => ({ ...p, tendered: String(Math.ceil(total / 1000)) }))}>
                  ພໍດີ
                </button>
              </div>
              <Numpad
                value={pay.tendered}
                onChange={v => setPay(p => ({ ...p, tendered: v }))}
                thousands
              />
            </>
          ) : (
            <div className="pay-qr">
              {imageUrl(settings.qr_image_path)
                ? <img src={imageUrl(settings.qr_image_path)} alt="QR" />
                : <div className="empty">ຍັງບໍ່ໄດ້ຕັ້ງຮູບ QR ໃນໜ້າຕັ້ງຄ່າ</div>}
              <div className="pay-qr-note">QR ຂຶ້ນຢູ່ຈໍລູກຄ້າແລ້ວ</div>
            </div>
          )}
          <button type="button" className="btn btn-primary btn-big" disabled={busy || (pay.method === 'cash' && change < 0)} onClick={finish}>
            {busy ? 'ກຳລັງບັນທຶກ…' : 'ຈົບການຂາຍ'}
          </button>
        </Modal>
      )}

      {confirmIncomplete && (
        <Confirm
          message={confirmIncomplete.message}
          confirmLabel={confirmIncomplete.confirmLabel}
          onConfirm={confirmIncomplete.onOk}
          onCancel={() => setConfirmIncomplete(null)}
        />
      )}
    </div>
  )
}

function BagEditor({ bags, setBags, cartItems, onQty }) {
  const remaining = menuId => roomFor(cartItems, bags, -1, menuId)

  return (
    <div className="bag-editor">
      <div className="bag-remaining">
        {cartItems.map(it => {
          const left = remaining(it.menu_id)
          return (
            <span key={it.menu_id} className={`chip ${left === 0 ? 'chip-done' : 'chip-todo'}`}>
              {it.name} ເຫຼືອ {left}
            </span>
          )
        })}
      </div>

      <div className="bag-cols">
        {bags.map((bag, i) => (
          <div key={i} className="bag-col">
            <div className="bag-col-head">
              ຖົງ {i + 1}
              <button type="button" className="modal-x" onClick={() => setBags(prev => prev.filter((_, j) => j !== i))}>✕</button>
            </div>
            {cartItems.map(it => (
              <div key={it.menu_id} className="bag-item">
                <span className="bag-item-name">{it.name}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setBags(prev => adjustBagQty(prev, cartItems, i, it.menu_id, -1))}
                >−</button>
                <button type="button" className="qty-num" onClick={() => onQty(i, it.menu_id, String(bag[it.menu_id] || 0))}>
                  {bag[it.menu_id] || 0}
                </button>
                <button
                  type="button"
                  className="qty-btn"
                  disabled={remaining(it.menu_id) <= 0}
                  onClick={() => setBags(prev => adjustBagQty(prev, cartItems, i, it.menu_id, 1))}
                >+</button>
              </div>
            ))}
          </div>
        ))}
        <button type="button" className="bag-add" onClick={() => setBags(prev => [...prev, {}])}>+ ເພີ່ມຖົງ</button>
      </div>
    </div>
  )
}
