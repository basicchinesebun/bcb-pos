import { useState, useEffect, useCallback } from 'react'
import { api, call, imageUrl, money, todayStr } from '../lib/api'
import { Modal, Confirm } from '../lib/ui'
import { receiptBytes } from '../lib/receipt'

// Calls the queue number out loud. Thai voices are what Windows actually ships
// with in this region and they read Lao numerals close enough for a customer
// waiting for "42" to know it is their turn; if no voice is installed at all
// the call is silent rather than an error.
function speak(qnum, enabled) {
  if (!enabled) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  try {
    const text = `ຄິວ ${qnum}`
    const u = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find(v => /^lo/i.test(v.lang)) || voices.find(v => /^th/i.test(v.lang))
    if (voice) u.voice = voice
    u.lang = voice ? voice.lang : 'th-TH'
    u.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch (_) {}
}

export default function Orders({ settings, toast, reloadMenus, reloadOpen }) {
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('open')  // open | history
  const [from, setFrom] = useState(todayStr())
  const [to, setTo] = useState(todayStr())
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const voiceOn = settings.voice_enabled !== '0'

  const load = useCallback(async () => {
    try {
      setOrders(view === 'open' ? await call(api.orders.open) : await call(api.orders.list, { from, to }))
    } catch (err) {
      toast(err.message, 'error')
    }
  }, [view, from, to, toast])

  useEffect(() => { load() }, [load])

  // The kitchen tablet ticks things off too, so the till's board follows.
  useEffect(() => api.on('orders:changed', () => load()), [load])

  const done = async o => {
    try {
      await call(api.orders.done, o.id, true)
      await call(api.queue.call, o.qnum)
      speak(o.qnum, voiceOn)
      toast(`ຄິວ ${String(o.qnum).padStart(4, '0')} ພ້ອມແລ້ວ`, 'ok')
      load(); reloadOpen().catch(() => {})
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const recall = async o => {
    try { await call(api.queue.call, o.qnum) } catch (_) {}
    speak(o.qnum, voiceOn)
  }

  const cancel = o => setConfirm({
    message: `ຍົກເລີກບິນ ຄິວ ${String(o.qnum).padStart(4, '0')} (${money(o.total)} ກີບ)? ສະຕັອກຈະຖືກຄືນໃຫ້`,
    onOk: async () => {
      setConfirm(null)
      try {
        await call(api.orders.cancel, o.id)
        toast('ຍົກເລີກແລ້ວ · ຄືນສະຕັອກແລ້ວ', 'ok')
        load(); reloadMenus().catch(() => {}); reloadOpen().catch(() => {})
      } catch (err) {
        toast(err.message, 'error')
      }
    },
  })

  const reprint = async o => {
    try {
      const bytes = await receiptBytes(o, {
        shopName: settings.shop_name,
        address: settings.shop_address,
        phone: settings.shop_phone,
        footer: settings.receipt_footer,
        logoUrl: imageUrl(settings.logo_path),
        paperMm: settings.printer_width,
      })
      await call(api.printer.print, bytes)
      toast('ພິມແລ້ວ', 'ok')
    } catch (err) {
      toast(`ພິມບໍ່ໄດ້: ${err.message}`, 'error')
    }
  }

  return (
    <div className="orders">
      <div className="orders-bar">
        <div className="seg">
          <button type="button" className={view === 'open' ? 'seg-on' : ''} onClick={() => setView('open')}>ກຳລັງເຮັດ</button>
          <button type="button" className={view === 'history' ? 'seg-on' : ''} onClick={() => setView('history')}>ຍ້ອນຫຼັງ</button>
        </div>
        {view === 'history' && (
          <div className="row gap">
            <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
            <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={load}>ໂຫຼດໃໝ່</button>
      </div>

      {orders.length === 0 && <div className="empty">{view === 'open' ? 'ບໍ່ມີບິນທີ່ຄ້າງ' : 'ບໍ່ມີບິນໃນຊ່ວງນີ້'}</div>}

      <div className="order-grid">
        {orders.map(o => {
          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
          return (
            <div key={o.id} className={`order-card ${o.cancelled ? 'order-cancelled' : ''} ${o.done ? 'order-done' : ''}`}>
              <div className="order-top">
                <span className="order-q">{String(o.qnum).padStart(4, '0')}</span>
                <span className="order-meta">
                  {o.created_at?.slice(11, 16)} · {o.payment_method === 'cash' ? 'ສົດ' : 'ໂອນ'}
                  {o.sold_by ? ` · ${o.sold_by}` : ''}
                </span>
              </div>
              <div className="order-items">
                {items.map((it, i) => <div key={i}>{it.name} ×{it.qty}</div>)}
              </div>
              {o.bag_label && <div className="order-bags">{o.bag_label}</div>}
              <div className="order-total">{money(o.total)} ກີບ</div>
              <div className="order-actions">
                {!o.cancelled && !o.done && (
                  <button type="button" className="btn btn-primary btn-sm flex1" onClick={() => done(o)}>ເສັດແລ້ວ · ເອີ້ນຄິວ</button>
                )}
                {o.done && !o.cancelled && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => recall(o)}>🔊 ເອີ້ນຊ້ຳ</button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => reprint(o)}>🖨</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(o)}>ເບິ່ງ</button>
                {!o.cancelled && (
                  <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => cancel(o)}>ຍົກເລີກ</button>
                )}
              </div>
              {o.cancelled ? <div className="order-flag">ຍົກເລີກແລ້ວ</div> : null}
            </div>
          )
        })}
      </div>

      {detail && (
        <Modal title={`ບິນ ຄິວ ${String(detail.qnum).padStart(4, '0')}`} onClose={() => setDetail(null)}>
          <div className="detail">
            {(typeof detail.items === 'string' ? JSON.parse(detail.items) : detail.items).map((it, i) => (
              <div key={i} className="detail-row"><span>{it.name} ×{it.qty}</span><span>{money(it.sub)}</span></div>
            ))}
            <div className="detail-row detail-total"><span>ລວມ</span><span>{money(detail.total)} ກີບ</span></div>
            {detail.payment_method === 'cash' && detail.paid_amount != null && (
              <>
                <div className="detail-row"><span>ຮັບເງິນ</span><span>{money(detail.paid_amount)}</span></div>
                <div className="detail-row"><span>ເງິນທອນ</span><span>{money(detail.change_amount)}</span></div>
              </>
            )}
            {detail.bag_label && <div className="detail-bags">{detail.bag_label}</div>}
            <div className="detail-meta">
              {detail.created_at} · {detail.sold_by || 'ບໍ່ລະບຸ'}
              {detail.done_at ? ` · ເສັດ ${detail.done_at.slice(11, 16)}` : ''}
            </div>
            <button type="button" className="btn btn-outline" onClick={() => reprint(detail)}>🖨 ພິມຊ້ຳ</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Confirm message={confirm.message} confirmLabel="ຍົກເລີກບິນ" danger onConfirm={confirm.onOk} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
