import { useState, useEffect, useCallback, useRef } from 'react'

// ─── toasts ───
// Errors stay up long enough to be read across a counter; confirmations do not
// need to.
export function useToast() {
  const [toasts, setToasts] = useState([])
  const show = useCallback((msg, kind = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), kind === 'error' ? 6000 : 2600)
  }, [])
  const node = (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.kind}`}>{t.msg}</div>
      ))}
    </div>
  )
  return [show, node]
}

// ─── in-app numeric keypad ───
// Windows' own on-screen keyboard takes over the whole 1366x768 panel and
// buries the till, so every number in this program is typed here instead.
export function Numpad({ value, onChange, onSubmit, thousands = false }) {
  const press = key => {
    if (key === 'del') return onChange(String(value).slice(0, -1))
    if (key === 'clr') return onChange('')
    if (String(value).length >= 9) return
    onChange((String(value) === '0' ? '' : String(value)) + key)
  }
  return (
    <div className="numpad">
      {['1','2','3','4','5','6','7','8','9'].map(k => (
        <button key={k} type="button" className="np-key" onClick={() => press(k)}>{k}</button>
      ))}
      <button type="button" className="np-key np-fn" onClick={() => press('clr')}>C</button>
      <button type="button" className="np-key" onClick={() => press('0')}>0</button>
      <button type="button" className="np-key np-fn" onClick={() => press('del')}>⌫</button>
      {onSubmit && (
        <button type="button" className="np-key np-ok" onClick={onSubmit}>ຕົກລົງ</button>
      )}
      {thousands && (
        <div className="np-hint">ພິມເປັນຫຼັກພັນ · 61 = 61,000</div>
      )}
    </div>
  )
}

// ─── modal ───
export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const esc = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div className="modal-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`}>
        <div className="modal-head">
          <span>{title}</span>
          <button type="button" className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Confirm({ message, confirmLabel = 'ຢືນຢັນ', onConfirm, onCancel, danger = false }) {
  return (
    <div className="modal-back" onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal modal-narrow">
        <div className="modal-body">
          <div className="confirm-msg">{message}</div>
          <div className="row gap">
            <button type="button" className="btn btn-ghost flex1" onClick={onCancel}>ຍົກເລີກ</button>
            <button type="button" className={`btn flex1 ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── press-and-hold ───
// A customer ordering 80 buns cannot be served by 80 taps, so holding a menu
// card opens the keypad instead. Touch and mouse both, since the shop's panel
// is a touchscreen but a spare laptop is not.
export function useLongPress(onLongPress, onClick, ms = 450) {
  const timer = useRef(null)
  const fired = useRef(false)

  const start = () => {
    fired.current = false
    timer.current = setTimeout(() => { fired.current = true; onLongPress() }, ms)
  }
  const cancel = () => { clearTimeout(timer.current) }
  const end = () => {
    clearTimeout(timer.current)
    if (!fired.current && onClick) onClick()
  }

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: e => { e.preventDefault(); end() },
    onTouchCancel: cancel,
    onContextMenu: e => e.preventDefault(),
  }
}
