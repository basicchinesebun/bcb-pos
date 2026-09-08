import { useState, useEffect, useRef } from 'react'
import { api, imageUrl, money } from './lib/api'

// The screen facing the customer paying at the counter. Default state is the
// menu board; an order takes it over only while payment is happening, and it
// must always find its way back on its own. The web build could sit showing a
// finished order's total to the next person in the queue.
export default function Display() {
  const [state, setState] = useState({ items: [], total: 0 })
  const [menus, setMenus] = useState([])
  const [settings, setSettings] = useState({})
  const [called, setCalled] = useState(null)
  const calledTimer = useRef(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [m, s] = await Promise.all([api.menus.list(), api.settings.get()])
        if (!alive) return
        if (m.ok) setMenus(m.data)
        if (s.ok) setSettings(s.data)
      } catch (_) {}
    }
    load()
    // This screen runs unattended all day. If a push is ever missed the board
    // still catches up on its own rather than freezing on stale content.
    const poll = setInterval(load, 15000)
    return () => { alive = false; clearInterval(poll) }
  }, [])

  useEffect(() => api.on('display:update', payload => {
    setState(payload && payload.items ? payload : { items: [], total: 0 })
  }), [])

  // Each call replaces the previous banner outright — without clearing the
  // old timer, an earlier call's timeout would wipe a number that had only
  // just gone up.
  useEffect(() => api.on('display:queue', payload => {
    clearTimeout(calledTimer.current)
    setCalled(payload.qnum)
    calledTimer.current = setTimeout(() => setCalled(null), 12000)
  }), [])

  const hasOrder = state.items && state.items.length > 0
  const showQr = !!state.qr && state.method !== 'cash'

  // In-stock items first; sold-out ones sink and drop off the board once there
  // are enough in-stock items to fill it.
  const board = menus
    .filter(m => m.active)
    .sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0))
    .slice(0, 8)

  return (
    <div className="disp">
      <div className="disp-brand">{settings.shop_name || 'Basic Chinese Bun'}</div>

      {!hasOrder ? (
        <div className="disp-board">
          <div className="disp-board-title">ເມນູມື້ນີ້ · Today's Menu</div>
          {board.length === 0 ? (
            <div className="disp-empty">ຍັງບໍ່ໄດ້ຕັ້ງເມນູ</div>
          ) : (
            <div className="disp-grid">
              {board.map(m => (
                <div key={m.id} className={`disp-card ${m.stock <= 0 ? 'disp-out' : ''}`}>
                  <div className="disp-card-img">
                    {imageUrl(m.image_path) ? <img src={imageUrl(m.image_path)} alt="" /> : <span>🥟</span>}
                  </div>
                  <div className="disp-card-body">
                    <div className="disp-card-name">{m.name}</div>
                    <div className="disp-card-price">{m.stock <= 0 ? 'ໝົດ' : `${money(m.price)} ກີບ`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`disp-order ${showQr ? 'disp-order-qr' : ''}`}>
          <div className="disp-bill">
            <div className="disp-bill-head">ລາຍການ · Your Order</div>
            <div className="disp-bill-items">
              {state.items.map((it, i) => (
                <div key={i} className="disp-bill-row">
                  <span>{it.name} × {it.qty}</span>
                  <span>{money(it.sub)}</span>
                </div>
              ))}
            </div>
            <div className="disp-bill-total">
              <span>ລວມ · TOTAL</span>
              <strong>{money(state.total)} ກີບ</strong>
            </div>
            {state.method === 'cash' && state.change != null && (
              <div className="disp-bill-change">
                <span>ເງິນທອນ</span><strong>{money(state.change)}</strong>
              </div>
            )}
          </div>
          {showQr && (
            <div className="disp-qr">
              <div className="disp-qr-title">ສະແກນເພື່ອຊຳລະ</div>
              <img src={state.qr} alt="QR" />
            </div>
          )}
        </div>
      )}

      {called != null && (
        <div className="disp-called">
          <div className="disp-called-label">ຄິວ</div>
          <div className="disp-called-num">{String(called).padStart(4, '0')}</div>
        </div>
      )}
    </div>
  )
}
