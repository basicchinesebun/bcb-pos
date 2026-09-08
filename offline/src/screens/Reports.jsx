import { useState, useEffect, useCallback } from 'react'
import { api, call, money, todayStr } from '../lib/api'

// Staff see the shop's takings for the range and their own line; profit and
// per-menu cost are the owner's business only (§6.3).
export default function Reports({ staff, toast }) {
  const [from, setFrom] = useState(todayStr())
  const [to, setTo] = useState(todayStr())
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const owner = !!staff.is_owner

  const load = useCallback(async () => {
    setBusy(true)
    try {
      setData(await call(api.orders.report, { from, to }))
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }, [from, to, toast])

  useEffect(() => { load() }, [load])

  const quick = days => {
    const d = new Date()
    const end = todayStr(d)
    d.setDate(d.getDate() - days)
    setFrom(todayStr(d))
    setTo(end)
  }

  // Excel on a Lao Windows install reads a plain UTF-8 file as Windows-1252
  // and turns every Lao character into rubbish. The BOM is added on the main
  // side, where the file is actually written.
  const exportCsv = async () => {
    if (!data) return
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['ລາຍງານ', `${from} ຫາ ${to}`],
      [],
      ['ຈຳນວນບິນ', data.bills],
      ['ຍອດຂາຍລວມ', data.total],
      ['ເງິນສົດ', data.cash],
      ['ເງິນໂອນ', data.transfer],
      ...(owner ? [['ຕົ້ນທຶນ', data.cost], ['ກຳໄລ', data.profit]] : []),
      ['ບິນທີ່ຍົກເລີກ', data.cancelled],
      [],
      ['ເມນູ', 'ຈຳນວນ', 'ຍອດຂາຍ', ...(owner ? ['ຕົ້ນທຶນ', 'ກຳໄລ'] : [])],
      ...data.byMenu.map(m => [m.name, m.qty, m.revenue, ...(owner ? [m.cost, m.revenue - m.cost] : [])]),
      [],
      ['ພະນັກງານ', 'ຈຳນວນບິນ', 'ຍອດຂາຍ'],
      ...data.byStaff.map(s => [s.name, s.bills, s.total]),
    ]
    const csv = rows.map(r => r.map(esc).join(',')).join('\r\n')
    try {
      const saved = await call(api.data.exportCsv, csv)
      toast(saved ? `ບັນທຶກແລ້ວ: ${saved}` : 'ຍົກເລີກ', saved ? 'ok' : 'warn')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="reports">
      <div className="orders-bar">
        <div className="row gap">
          <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="row gap">
          <button type="button" className="chip" onClick={() => { setFrom(todayStr()); setTo(todayStr()) }}>ມື້ນີ້</button>
          <button type="button" className="chip" onClick={() => quick(7)}>7 ມື້</button>
          <button type="button" className="chip" onClick={() => quick(30)}>30 ມື້</button>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!data}>Export CSV</button>
      </div>

      {busy && !data && <div className="empty">ກຳລັງໂຫຼດ…</div>}

      {data && (
        <>
          <div className="stat-row">
            <Stat label="ຍອດຂາຍ" value={`${money(data.total)} ກີບ`} big />
            <Stat label="ຈຳນວນບິນ" value={data.bills} />
            <Stat label="ເງິນສົດ" value={money(data.cash)} />
            <Stat label="ເງິນໂອນ" value={money(data.transfer)} />
            {owner && <Stat label="ຕົ້ນທຶນ" value={money(data.cost)} />}
            {owner && <Stat label="ກຳໄລ" value={`${money(data.profit)} ກີບ`} big accent />}
          </div>

          <div className="report-cols">
            <section className="card">
              <h3>ເມນູຂາຍດີ</h3>
              {data.byMenu.length === 0 && <div className="empty">ບໍ່ມີຂໍ້ມູນ</div>}
              <table className="table">
                <thead>
                  <tr><th>ເມນູ</th><th>ຈຳນວນ</th><th>ຍອດຂາຍ</th>{owner && <th>ກຳໄລ</th>}</tr>
                </thead>
                <tbody>
                  {data.byMenu.map(m => (
                    <tr key={m.name}>
                      <td>{m.name}</td>
                      <td className="num">{m.qty}</td>
                      <td className="num">{money(m.revenue)}</td>
                      {owner && <td className="num">{money(m.revenue - m.cost)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="card">
              <h3>ຍອດຂາຍຕາມພະນັກງານ</h3>
              <table className="table">
                <thead><tr><th>ພະນັກງານ</th><th>ບິນ</th><th>ຍອດຂາຍ</th></tr></thead>
                <tbody>
                  {data.byStaff
                    .filter(s => owner || s.name === staff.name)
                    .map(s => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td className="num">{s.bills}</td>
                        <td className="num">{money(s.total)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {data.cancelled > 0 && <div className="note">ບິນທີ່ຍົກເລີກ: {data.cancelled}</div>}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, big, accent }) {
  return (
    <div className={`stat ${big ? 'stat-big' : ''} ${accent ? 'stat-accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
