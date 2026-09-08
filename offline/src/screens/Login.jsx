import { useState, useEffect } from 'react'
import { api, call } from '../lib/api'
import { Numpad } from '../lib/ui'

// The first thing anyone sees, in a shop where the internet just died and
// there is a queue. No settings, no setup, no choosing a name from a list:
// type your own code and start selling. Codes live in the staff table and are
// editable in Settings — nothing here is compiled in.
export default function Login({ onLogin, toast, notice, onNoticeSeen }) {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (value = pin) => {
    if (busy || !value) return
    setBusy(true)
    setError('')
    try {
      const staff = await call(api.staff.login, value)
      onLogin(staff)
    } catch (err) {
      setError(err.message)
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  // A physical keyboard is quicker for whoever has one; the on-screen pad is
  // there because the till's own is a touchscreen.
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Enter') submit()
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1))
      else if (/^\d$/.test(e.key)) setPin(p => (p.length < 8 ? p + e.key : p))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-title">BCB POS</div>
        <div className="login-sub">ໃສ່ລະຫັດຂອງທ່ານ</div>
        <div className={`pin-dots ${error ? 'pin-bad' : ''}`}>
          {pin.length === 0 ? <span className="pin-empty">••••</span> : '●'.repeat(pin.length)}
        </div>
        {error && <div className="login-err">{error}</div>}
        <Numpad value={pin} onChange={setPin} onSubmit={() => submit()} />
      </div>

      {notice && notice.type === 'backup' && (
        <div className="login-notice">
          <div className="notice-title">⚠️ ຍັງບໍ່ໄດ້ສຳຮອງຂໍ້ມູນ</div>
          <div className="notice-body">
            {notice.days == null
              ? 'ຍັງບໍ່ເຄີຍສຳຮອງຂໍ້ມູນເລີຍ'
              : `ສຳຮອງຄັ້ງລ້າສຸດ ${notice.days} ມື້ຜ່ານມາ`}
            {notice.error ? ` — ${notice.error}` : ''}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onNoticeSeen}>ຮັບຮູ້ແລ້ວ</button>
        </div>
      )}
    </div>
  )
}
