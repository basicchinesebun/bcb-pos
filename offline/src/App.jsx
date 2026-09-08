import { useState, useEffect, useCallback } from 'react'
import { api, call, hasBridge } from './lib/api'
import { useToast } from './lib/ui'
import Login from './screens/Login'
import Sell from './screens/Sell'
import Orders from './screens/Orders'
import Reports from './screens/Reports'
import Settings from './screens/Settings'

export default function App() {
  const [staff, setStaff] = useState(null)
  const [tab, setTab] = useState('sell')
  const [menus, setMenus] = useState([])
  const [settings, setSettings] = useState({})
  const [openOrders, setOpenOrders] = useState([])
  const [booting, setBooting] = useState(true)
  const [bootError, setBootError] = useState('')
  const [notice, setNotice] = useState(null)
  const [showToast, toastNode] = useToast()

  const reloadMenus = useCallback(async () => {
    setMenus(await call(api.menus.list))
  }, [])

  const reloadSettings = useCallback(async () => {
    setSettings(await call(api.settings.get))
  }, [])

  const reloadOpen = useCallback(async () => {
    setOpenOrders(await call(api.orders.open))
  }, [])

  useEffect(() => {
    if (!hasBridge) { setBootError('ບໍ່ໄດ້ເປີດຜ່ານໂປຣແກຣມ BCB POS'); setBooting(false); return }
    ;(async () => {
      try {
        await Promise.all([reloadMenus(), reloadSettings(), reloadOpen()])
        const n = await call(api.data.notice)
        if (n) setNotice(n)
      } catch (err) {
        setBootError(err.message)
      } finally {
        setBooting(false)
      }
    })()
  }, [reloadMenus, reloadSettings, reloadOpen])

  // The kitchen screen marks things done over the network, so the till's own
  // list has to follow along without anyone refreshing it.
  useEffect(() => {
    if (!hasBridge) return
    return api.on('orders:changed', () => { reloadOpen().catch(() => {}) })
  }, [reloadOpen])

  if (booting) return <div className="boot">ກຳລັງເປີດ…</div>
  if (bootError) {
    return (
      <div className="boot boot-error">
        <div className="boot-title">ເປີດໂປຣແກຣມບໍ່ສຳເລັດ</div>
        <div className="boot-msg">{bootError}</div>
      </div>
    )
  }
  if (!staff) return <Login onLogin={setStaff} toast={showToast} notice={notice} onNoticeSeen={() => setNotice(null)} />

  const owner = !!staff.is_owner
  const tabs = [
    { id: 'sell', label: 'ຂາຍ', icon: '🧾' },
    { id: 'orders', label: 'ບິນ', icon: '📋' },
    { id: 'reports', label: 'ລາຍງານ', icon: '📊' },
    ...(owner ? [{ id: 'settings', label: 'ຕັ້ງຄ່າ', icon: '⚙️' }] : []),
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">{settings.shop_name || 'BCB POS'}</div>
        <nav className="tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'tab-on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tab-ico">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div className="who">
          <span className="who-name">{staff.is_owner ? '👑 ' : ''}{staff.name}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStaff(null); setTab('sell') }}>
            ອອກ · ປ່ຽນຄົນ
          </button>
        </div>
      </header>

      <main className="main">
        {tab === 'sell' && (
          <Sell
            staff={staff}
            menus={menus}
            settings={settings}
            openOrders={openOrders}
            toast={showToast}
            reloadMenus={reloadMenus}
            reloadOpen={reloadOpen}
          />
        )}
        {tab === 'orders' && (
          <Orders settings={settings} toast={showToast} reloadMenus={reloadMenus} reloadOpen={reloadOpen} />
        )}
        {tab === 'reports' && <Reports staff={staff} toast={showToast} />}
        {tab === 'settings' && owner && (
          <Settings
            settings={settings}
            menus={menus}
            toast={showToast}
            reloadMenus={reloadMenus}
            reloadSettings={reloadSettings}
          />
        )}
      </main>

      {toastNode}
    </div>
  )
}
