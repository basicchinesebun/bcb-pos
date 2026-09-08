import { useState, useEffect, useCallback } from 'react'
import { api, call, imageUrl, money } from '../lib/api'
import { Modal, Confirm } from '../lib/ui'

const SECTIONS = [
  { id: 'menus', label: 'ເມນູ & ສະຕັອກ' },
  { id: 'staff', label: 'ພະນັກງານ' },
  { id: 'shop', label: 'ຮ້ານ & ໃບບິນ' },
  { id: 'hardware', label: 'ເຄື່ອງພິມ & ຈໍ' },
  { id: 'data', label: 'ຂໍ້ມູນ & ສຳຮອງ' },
]

export default function Settings({ settings, menus, toast, reloadMenus, reloadSettings }) {
  const [section, setSection] = useState('menus')
  return (
    <div className="settings">
      <nav className="side">
        {SECTIONS.map(s => (
          <button key={s.id} type="button" className={`side-btn ${section === s.id ? 'side-on' : ''}`} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>
      <div className="side-body">
        {section === 'menus' && <MenusPanel menus={menus} toast={toast} reloadMenus={reloadMenus} />}
        {section === 'staff' && <StaffPanel toast={toast} />}
        {section === 'shop' && <ShopPanel settings={settings} toast={toast} reloadSettings={reloadSettings} />}
        {section === 'hardware' && <HardwarePanel settings={settings} toast={toast} reloadSettings={reloadSettings} />}
        {section === 'data' && <DataPanel toast={toast} reloadMenus={reloadMenus} reloadSettings={reloadSettings} />}
      </div>
    </div>
  )
}

// ─── menus & stock ───
function MenusPanel({ menus, toast, reloadMenus }) {
  const [edit, setEdit] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [resetTo, setResetTo] = useState('')

  const save = async m => {
    try {
      await call(api.menus.save, m)
      await reloadMenus()
      setEdit(null)
      toast('ບັນທຶກແລ້ວ', 'ok')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const setStock = async (m, value) => {
    try {
      await call(api.menus.setStock, m.id, value)
      await reloadMenus()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <div className="panel-head">
        <h2>ເມນູ & ສະຕັອກ</h2>
        <div className="row gap">
          <input
            className="input input-sm"
            placeholder="ຈຳນວນ"
            inputMode="numeric"
            value={resetTo}
            onChange={e => setResetTo(e.target.value.replace(/\D/g, ''))}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setConfirm({
              message: `ຕັ້ງສະຕັອກທຸກເມນູທີ່ເປີດຢູ່ເປັນ ${resetTo || 0}?`,
              onOk: async () => {
                setConfirm(null)
                try { await call(api.menus.resetStock, resetTo || 0); await reloadMenus(); toast('ຕັ້ງສະຕັອກແລ້ວ', 'ok') }
                catch (err) { toast(err.message, 'error') }
              },
            })}
          >ຕັ້ງສະຕັອກທັງໝົດ</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setEdit({ name: '', price: '', cost: '', stock: '', active: 1 })}>
            + ເພີ່ມເມນູ
          </button>
        </div>
      </div>

      <div className="menu-rows">
        {menus.length === 0 && <div className="empty">ຍັງບໍ່ມີເມນູ</div>}
        {menus.map(m => (
          <div key={m.id} className={`menu-row ${m.active ? '' : 'menu-row-off'}`}>
            <div className="menu-row-img">
              {imageUrl(m.image_path) ? <img src={imageUrl(m.image_path)} alt="" /> : <span>🥟</span>}
            </div>
            <div className="menu-row-main">
              <div className="menu-row-name">{m.name}</div>
              <div className="menu-row-sub">
                {money(m.price)} ກີບ{m.cost ? ` · ຕົ້ນທຶນ ${money(m.cost)}` : ''}
              </div>
            </div>
            <div className="stock-ctrl">
              <button type="button" className="qty-btn" onClick={() => setStock(m, m.stock - 1)}>−</button>
              <input
                className="stock-input"
                inputMode="numeric"
                value={m.stock}
                onChange={e => setStock(m, e.target.value.replace(/\D/g, '') || 0)}
              />
              <button type="button" className="qty-btn" onClick={() => setStock(m, m.stock + 1)}>+</button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => save({ ...m, active: m.active ? 0 : 1 })}>
              {m.active ? 'ເປີດຢູ່' : 'ປິດຢູ່'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(m)}>ແກ້ໄຂ</button>
            <button
              type="button"
              className="btn btn-ghost btn-sm danger-text"
              onClick={() => setConfirm({
                message: `ລຶບເມນູ "${m.name}"? ບິນເກົ່າຍັງເກັບຊື່ໄວ້ຢູ່`,
                onOk: async () => {
                  setConfirm(null)
                  try { await call(api.menus.remove, m.id); await reloadMenus(); toast('ລຶບແລ້ວ', 'ok') }
                  catch (err) { toast(err.message, 'error') }
                },
              })}
            >ລຶບ</button>
          </div>
        ))}
      </div>

      {edit && <MenuEditor menu={edit} onSave={save} onClose={() => setEdit(null)} toast={toast} />}
      {confirm && <Confirm message={confirm.message} danger onConfirm={confirm.onOk} onCancel={() => setConfirm(null)} />}
    </>
  )
}

function MenuEditor({ menu, onSave, onClose, toast }) {
  const [form, setForm] = useState({ ...menu })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // The picked file is copied into the program's own folder, so the menu photo
  // keeps working after the original is moved, renamed or deleted — and with
  // no network involved.
  const pickImage = async () => {
    try {
      const name = await call(api.images.pick)
      if (name) set('image_path', name)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <Modal title={menu.id ? 'ແກ້ໄຂເມນູ' : 'ເພີ່ມເມນູ'} onClose={onClose}>
      <label className="field"><span>ຊື່ເມນູ</span>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
      </label>
      <div className="row gap">
        <label className="field flex1"><span>ລາຄາ (ກີບ)</span>
          <input className="input" inputMode="numeric" value={form.price} onChange={e => set('price', e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="field flex1"><span>ຕົ້ນທຶນ (ກີບ)</span>
          <input className="input" inputMode="numeric" value={form.cost} onChange={e => set('cost', e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="field flex1"><span>ສະຕັອກ</span>
          <input className="input" inputMode="numeric" value={form.stock} onChange={e => set('stock', e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      <div className="field">
        <span>ຮູບພາບ</span>
        <div className="row gap">
          <div className="img-preview">
            {imageUrl(form.image_path) ? <img src={imageUrl(form.image_path)} alt="" /> : <span>🥟</span>}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={pickImage}>ເລືອກຮູບ</button>
          {form.image_path && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('image_path', null)}>ເອົາອອກ</button>}
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-big" onClick={() => onSave(form)}>ບັນທຶກ</button>
    </Modal>
  )
}

// ─── staff ───
function StaffPanel({ toast }) {
  const [list, setList] = useState([])
  const [edit, setEdit] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    try { setList(await call(api.staff.list, true)) } catch (err) { toast(err.message, 'error') }
  }, [toast])
  useEffect(() => { load() }, [load])

  const save = async s => {
    try {
      await call(api.staff.save, s)
      await load()
      setEdit(null)
      toast('ບັນທຶກແລ້ວ', 'ok')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <div className="panel-head">
        <h2>ພະນັກງານ</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setEdit({ name: '', pin: '', is_owner: 0, active: 1 })}>
          + ເພີ່ມພະນັກງານ
        </button>
      </div>
      <div className="note">
        ແຕ່ລະຄົນມີລະຫັດຂອງຕົນເອງ — ທຸກບິນຈະບັນທຶກອັດຕະໂນມັດວ່າໃຜເປັນຄົນຂາຍ.
        ເຈົ້າຂອງຮ້ານເທົ່ານັ້ນທີ່ເຂົ້າໜ້າຕັ້ງຄ່າ ແລະ ເບິ່ງກຳໄລໄດ້.
      </div>

      <div className="menu-rows">
        {list.map(s => (
          <div key={s.id} className={`menu-row ${s.active ? '' : 'menu-row-off'}`}>
            <div className="menu-row-main">
              <div className="menu-row-name">{s.is_owner ? '👑 ' : ''}{s.name}</div>
              <div className="menu-row-sub">ລະຫັດ {s.pin}</div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => save({ ...s, active: s.active ? 0 : 1 })}>
              {s.active ? 'ໃຊ້ງານຢູ່' : 'ປິດຢູ່'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(s)}>ແກ້ໄຂ</button>
            <button
              type="button"
              className="btn btn-ghost btn-sm danger-text"
              onClick={() => setConfirm({
                message: `ລຶບ "${s.name}"?`,
                onOk: async () => {
                  setConfirm(null)
                  try { await call(api.staff.remove, s.id); await load(); toast('ລຶບແລ້ວ', 'ok') }
                  catch (err) { toast(err.message, 'error') }
                },
              })}
            >ລຶບ</button>
          </div>
        ))}
      </div>

      {edit && (
        <Modal title={edit.id ? 'ແກ້ໄຂພະນັກງານ' : 'ເພີ່ມພະນັກງານ'} onClose={() => setEdit(null)}>
          <label className="field"><span>ຊື່</span>
            <input className="input" value={edit.name} onChange={e => setEdit(s => ({ ...s, name: e.target.value }))} autoFocus />
          </label>
          <label className="field"><span>ລະຫັດ (ຕົວເລກ 4-8 ຫຼັກ)</span>
            <input className="input" inputMode="numeric" value={edit.pin} onChange={e => setEdit(s => ({ ...s, pin: e.target.value.replace(/\D/g, '').slice(0, 8) }))} />
          </label>
          <label className="check">
            <input type="checkbox" checked={!!edit.is_owner} onChange={e => setEdit(s => ({ ...s, is_owner: e.target.checked ? 1 : 0 }))} />
            <span>ເປັນເຈົ້າຂອງຮ້ານ (ເຂົ້າຕັ້ງຄ່າ ແລະ ເບິ່ງກຳໄລໄດ້)</span>
          </label>
          <button type="button" className="btn btn-primary btn-big" onClick={() => save(edit)}>ບັນທຶກ</button>
        </Modal>
      )}
      {confirm && <Confirm message={confirm.message} danger onConfirm={confirm.onOk} onCancel={() => setConfirm(null)} />}
    </>
  )
}

// ─── shop & receipt ───
function ShopPanel({ settings, toast, reloadSettings }) {
  const [form, setForm] = useState(settings)
  useEffect(() => { setForm(settings) }, [settings])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    try {
      await call(api.settings.set, {
        shop_name: form.shop_name || '',
        shop_address: form.shop_address || '',
        shop_phone: form.shop_phone || '',
        receipt_footer: form.receipt_footer || '',
        next_queue: form.next_queue || '0',
        voice_enabled: form.voice_enabled === '0' ? '0' : '1',
      })
      await reloadSettings()
      toast('ບັນທຶກແລ້ວ', 'ok')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const pick = async key => {
    try {
      const name = await call(api.images.pick)
      if (!name) return
      await call(api.settings.set, { [key]: name })
      await reloadSettings()
      toast('ບັນທຶກແລ້ວ', 'ok')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <div className="panel-head"><h2>ຮ້ານ & ໃບບິນ</h2></div>
      <label className="field"><span>ຊື່ຮ້ານ</span>
        <input className="input" value={form.shop_name || ''} onChange={e => set('shop_name', e.target.value)} />
      </label>
      <div className="row gap">
        <label className="field flex1"><span>ທີ່ຢູ່</span>
          <input className="input" value={form.shop_address || ''} onChange={e => set('shop_address', e.target.value)} />
        </label>
        <label className="field flex1"><span>ໂທລະສັບ</span>
          <input className="input" value={form.shop_phone || ''} onChange={e => set('shop_phone', e.target.value)} />
        </label>
      </div>
      <label className="field"><span>ຂໍ້ຄວາມທ້າຍໃບບິນ</span>
        <input className="input" value={form.receipt_footer || ''} onChange={e => set('receipt_footer', e.target.value)} />
      </label>
      <label className="field"><span>ເລກຄິວປັດຈຸບັນ (ບິນຕໍ່ໄປຈະເປັນເລກນີ້ + 1)</span>
        <input className="input" inputMode="numeric" value={form.next_queue || '0'} onChange={e => set('next_queue', e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="check">
        <input type="checkbox" checked={form.voice_enabled !== '0'} onChange={e => set('voice_enabled', e.target.checked ? '1' : '0')} />
        <span>ເອີ້ນຄິວດ້ວຍສຽງ</span>
      </label>

      <div className="row gap">
        <div className="field flex1">
          <span>ໂລໂກ້ (ພິມເທິງໃບບິນ)</span>
          <div className="row gap">
            <div className="img-preview">{imageUrl(form.logo_path) ? <img src={imageUrl(form.logo_path)} alt="" /> : <span>—</span>}</div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => pick('logo_path')}>ເລືອກຮູບ</button>
          </div>
        </div>
        <div className="field flex1">
          <span>QR ໂອນເງິນ (ຂຶ້ນຈໍລູກຄ້າ)</span>
          <div className="row gap">
            <div className="img-preview">{imageUrl(form.qr_image_path) ? <img src={imageUrl(form.qr_image_path)} alt="" /> : <span>—</span>}</div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => pick('qr_image_path')}>ເລືອກຮູບ</button>
          </div>
        </div>
      </div>

      <button type="button" className="btn btn-primary btn-big" onClick={save}>ບັນທຶກ</button>
    </>
  )
}

// ─── printer, drawer, screens, kitchen ───
function HardwarePanel({ settings, toast, reloadSettings }) {
  const [printer, setPrinter] = useState(null)
  const [kitchen, setKitchen] = useState(null)
  const [display, setDisplay] = useState(null)
  const [port, setPort] = useState(settings.kitchen_port || '8080')

  const refresh = useCallback(async () => {
    try {
      const [p, k, d] = await Promise.all([
        call(api.printer.status),
        call(api.kitchen.status),
        call(api.display.status),
      ])
      setPrinter(p); setKitchen(k); setDisplay(d)
    } catch (err) {
      toast(err.message, 'error')
    }
  }, [toast])

  useEffect(() => {
    refresh()
    // Printers get unplugged and routers get restarted mid-shift; the panel
    // should reflect that without anyone reopening it.
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [refresh])

  const setSetting = async (k, v) => {
    try { await call(api.settings.set, { [k]: v }); await reloadSettings(); await refresh() }
    catch (err) { toast(err.message, 'error') }
  }

  return (
    <>
      <div className="panel-head"><h2>ເຄື່ອງພິມ & ຈໍ</h2></div>

      <section className="card">
        <h3>ເຄື່ອງພິມໃບບິນ</h3>
        {!printer ? <div className="empty">ກຳລັງກວດ…</div> : (
          <>
            <div className={`status ${printer.connected ? 'status-ok' : 'status-off'}`}>
              {printer.connected ? `ພົບແລ້ວ: ${printer.selected.label}` : 'ບໍ່ພົບເຄື່ອງພິມ — ຂາຍ ແລະ ບັນທຶກໄດ້ຕາມປົກກະຕິ'}
            </div>
            {printer.printers.length > 1 && (
              <label className="field"><span>ເລືອກເຄື່ອງພິມ</span>
                <select className="input" value={settings.printer_device || ''} onChange={e => setSetting('printer_device', e.target.value)}>
                  <option value="">ອັດຕະໂນມັດ (ເຄື່ອງທຳອິດ)</option>
                  {printer.printers.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </label>
            )}
            <label className="field"><span>ຄວາມກວ້າງເຈ້ຍ</span>
              <select className="input" value={settings.printer_width || '80'} onChange={e => setSetting('printer_width', e.target.value)}>
                <option value="80">80mm</option>
                <option value="58">58mm</option>
              </select>
            </label>
            <button
              type="button"
              className="btn btn-outline"
              onClick={async () => {
                try { await call(api.printer.drawer); toast('ສົ່ງຄຳສັ່ງເປີດລິ້ນຊັກແລ້ວ', 'ok') }
                catch (err) { toast(err.message, 'error') }
              }}
            >🔓 ທົດສອບເປີດລິ້ນຊັກ</button>
            <div className="note">ລິ້ນຊັກຕໍ່ຢູ່ຫຼັງເຄື່ອງພິມ (ຊ່ອງ DK/RJ11) ບໍ່ໄດ້ຕໍ່ກັບຄອມ — ຖ້າບໍ່ມີເຄື່ອງພິມ ລິ້ນຊັກຈະເປີດບໍ່ໄດ້</div>
          </>
        )}
      </section>

      <section className="card">
        <h3>ຈໍລູກຄ້າ</h3>
        <div className="status">{display ? `ພົບຈໍທັງໝົດ ${display.screens} ຈໍ · ຈໍລູກຄ້າ${display.open ? 'ເປີດຢູ່' : 'ປິດຢູ່'}` : '…'}</div>
        <div className="row gap">
          <button type="button" className="btn btn-outline flex1" onClick={async () => { await call(api.display.open); refresh() }}>ເປີດຈໍລູກຄ້າ</button>
          <button type="button" className="btn btn-ghost flex1" onClick={async () => { await call(api.display.close); refresh() }}>ປິດຈໍລູກຄ້າ</button>
        </div>
        <div className="note">ຖ້າມີ 2 ຈໍ ໂປຣແກຣມຈະເປີດຈໍລູກຄ້າເຕັມຈໍໃຫ້ເອງຕອນເປີດ</div>
      </section>

      <section className="card">
        <h3>ຈໍຄົວ</h3>
        {kitchen && (
          <>
            <div className={`status ${kitchen.running ? 'status-ok' : 'status-off'}`}>
              {kitchen.running
                ? `ເປີດຢູ່ · ເຊື່ອມຕໍ່ ${kitchen.clients} ເຄື່ອງ`
                : `ບໍ່ໄດ້ເປີດ${kitchen.error ? ` — ${kitchen.error}` : ''}`}
            </div>
            {kitchen.running && (
              <div className="kitchen-urls">
                ເປີດຢູ່ຈໍຄົວ:
                {kitchen.ips.length === 0 && <div className="note">ບໍ່ພົບ Wi-Fi — ສ່ວນອື່ນຂອງໂປຣແກຣມຍັງໃຊ້ໄດ້ປົກກະຕິ</div>}
                {kitchen.ips.map(ip => <code key={ip}>http://{ip}:{kitchen.port}/kitchen</code>)}
              </div>
            )}
            <div className="row gap">
              <input className="input input-sm" inputMode="numeric" value={port} onChange={e => setPort(e.target.value.replace(/\D/g, ''))} />
              <button
                type="button"
                className="btn btn-outline"
                onClick={async () => {
                  try { setKitchen(await call(api.kitchen.restart, port)); toast('ເລີ່ມໃໝ່ແລ້ວ', 'ok') }
                  catch (err) { toast(err.message, 'error') }
                }}
              >ເລີ່ມເຊີບເວີໃໝ່</button>
            </div>
            <div className="note">ຕັ້ງ IP ຄົງທີ່ (static IP) ໃຫ້ເຄື່ອງ POS ຈະດີກວ່າ — ບໍ່ຢ່າງນັ້ນ IP ຈະປ່ຽນທຸກຄັ້ງທີ່ເປີດເລົາເຕີໃໝ່</div>
          </>
        )}
      </section>
    </>
  )
}

// ─── data & backup ───
function DataPanel({ toast, reloadMenus, reloadSettings }) {
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try { setInfo(await call(api.data.backupInfo)) } catch (err) { toast(err.message, 'error') }
  }, [toast])
  useEffect(() => { refresh() }, [refresh])

  return (
    <>
      <div className="panel-head"><h2>ຂໍ້ມູນ & ສຳຮອງ</h2></div>

      <section className="card">
        <h3>ນຳເຂົ້າເມນູຈາກເວັບ</h3>
        <div className="note">ໃຊ້ໄຟລ໌ຈາກປຸ່ມ “Export JSON” ໃນລະບົບເວັບ — ຈະຕັ້ງເມນູ, ລາຄາ, ຕົ້ນທຶນ ແລະ ຮູບໃຫ້ຄືກັນ (ບໍ່ແຕະສະຕັອກໃນເຄື່ອງນີ້)</div>
        <button
          type="button"
          className="btn btn-outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              const res = await call(api.data.importJson)
              if (res) {
                await reloadMenus(); await reloadSettings()
                toast(`ນຳເຂົ້າ ${res.imported} ເມນູ · ຮູບ ${res.imagesSaved} ຮູບ`, 'ok')
              }
            } catch (err) {
              toast(err.message, 'error')
            } finally { setBusy(false) }
          }}
        >📥 ເລືອກໄຟລ໌ JSON</button>
      </section>

      <section className="card">
        <h3>ສຳຮອງຂໍ້ມູນ</h3>
        {info && (
          <>
            <div className={`status ${info.last ? 'status-ok' : 'status-off'}`}>
              ສຳຮອງລ້າສຸດ: {info.last ? new Date(info.last).toLocaleString() : 'ຍັງບໍ່ເຄີຍ'}
              {info.error ? ` — ${info.error}` : ''}
            </div>
            <div className="note">ໂຟນເດີສຳຮອງ: <code>{info.dir}</code></div>
            <div className="note">ໄຟລ໌ຖານຂໍ້ມູນ: <code>{info.dbFile}</code></div>
            <div className="note">
              ສຳຮອງອັດຕະໂນມັດທຸກຄັ້ງທີ່ປິດໂປຣແກຣມ ເກັບ 30 ໄຟລ໌ລ້າສຸດ ແລະ ກັອບລົງ USB ໃຫ້ນຳຖ້າສຽບຢູ່.
              <strong> ກ່ອນເອົາເຄື່ອງໄປໃຫ້ຊ່າງ ໃຫ້ກັອບໂຟນເດີສຳຮອງອອກມາເກັບໄວ້ກ່ອນທຸກຄັ້ງ.</strong>
            </div>
            <div className="row gap">
              <button
                type="button"
                className="btn btn-outline flex1"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const res = await call(api.data.backupNow)
                    toast(res.ok ? `ສຳຮອງແລ້ວ${res.usb.length ? ` (+USB ${res.usb.length})` : ''}` : `ບໍ່ສຳເລັດ: ${res.error}`, res.ok ? 'ok' : 'error')
                    refresh()
                  } catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
                }}
              >ສຳຮອງດຽວນີ້</button>
              <button
                type="button"
                className="btn btn-ghost flex1"
                onClick={async () => {
                  try { const dir = await call(api.data.pickBackupDir); if (dir) { refresh(); toast('ປ່ຽນໂຟນເດີແລ້ວ', 'ok') } }
                  catch (err) { toast(err.message, 'error') }
                }}
              >ປ່ຽນໂຟນເດີ</button>
            </div>
          </>
        )}
      </section>
    </>
  )
}
