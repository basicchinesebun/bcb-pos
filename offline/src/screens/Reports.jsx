import { useState, useEffect, useCallback } from 'react'
import { api, call, money, todayStr } from '../lib/api'

// Staff see the shop's takings for the range and their own line; profit and
// per-menu cost are the owner's business only (§6.3).

// Excel on a Lao Windows install reads a plain UTF-8 file as Windows-1252 and
// turns every Lao character into rubbish. The BOM is added on the main side,
// where the file is actually written.
const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
const toCsv = rows => rows.map(r => r.map(esc).join(',')).join('\r\n')

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
    d.setDate(d.getDate() - days + 1)
    setFrom(todayStr(d))
    setTo(end)
  }

  const save = async (csv, label) => {
    try {
      const saved = await call(api.data.exportCsv, csv)
      toast(saved ? `${label} ບັນທຶກແລ້ວ` : 'ຍົກເລີກ', saved ? 'ok' : 'warn')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const exportSummary = () => {
    if (!data) return
    save(toCsv([
      ['ລາຍງານສະຫຼຸບ', `${from} ຫາ ${to}`],
      [],
      ['ຈຳນວນມື້ທີ່ຂາຍ', data.tradingDays],
      ['ຈຳນວນບິນ', data.bills],
      ['ຍອດຂາຍລວມ', data.total],
      ['ເງິນສົດ', data.cash],
      ['ເງິນໂອນ', data.transfer],
      ...(owner ? [['ຕົ້ນທຶນ', data.cost], ['ກຳໄລ', data.profit]] : []),
      ['ບິນທີ່ຍົກເລີກ', data.cancelled],
      [],
      ['ວັນທີ', 'ບິນ', 'ຍອດຂາຍ', 'ເງິນສົດ', 'ເງິນໂອນ', 'ຈຳນວນກ້ອນ', ...(owner ? ['ຕົ້ນທຶນ', 'ກຳໄລ'] : [])],
      ...data.byDay.map(d => [d.date, d.bills, d.total, d.cash, d.transfer, d.pieces, ...(owner ? [d.cost, d.profit] : [])]),
      [],
      ['ເມນູ', 'ຈຳນວນ', 'ຍອດຂາຍ', ...(owner ? ['ຕົ້ນທຶນ', 'ກຳໄລ'] : []), 'ຢູ່ໃນເມນູ'],
      ...data.byMenu.map(m => [m.name, m.qty, m.revenue, ...(owner ? [m.cost, m.revenue - m.cost] : []), m.onMenu ? (m.active ? 'ເປີດຢູ່' : 'ປິດຢູ່') : 'ລຶບແລ້ວ']),
      [],
      ['ພະນັກງານ', 'ຈຳນວນບິນ', 'ຍອດຂາຍ'],
      ...data.byStaff.map(s => [s.name, s.bills, s.total]),
    ]), 'ສະຫຼຸບ')
  }

  // One row per day per menu, zeroes included. This is the shape to hand to a
  // spreadsheet or an AI: every row is one fact, so it can be pivoted, charted
  // or asked questions of without any reshaping first. A 0 means the menu was
  // on the board that day and nobody bought it — which is the interesting
  // number when 17 menus are carried and 7 or 8 actually sell.
  const exportDaily = () => {
    if (!data) return
    save(toCsv([
      ['date', 'menu', 'qty', 'revenue_lak', ...(owner ? ['cost_lak', 'profit_lak'] : []),
       'day_total_lak', 'day_bills', 'weekday'],
      ...data.daily.map(r => {
        const day = data.byDay.find(d => d.date === r.date)
        return [
          r.date, r.name, r.qty, r.revenue,
          ...(owner ? [r.cost, r.profit] : []),
          day ? day.total : 0,
          day ? day.bills : 0,
          new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
        ]
      }),
    ]), 'ລາຍວັນ × ລາຍເມນູ')
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
          <button type="button" className="chip" onClick={() => quick(90)}>90 ມື້</button>
        </div>
        <div className="row gap">
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportSummary} disabled={!data}>Export ສະຫຼຸບ</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={exportDaily} disabled={!data || !data.daily.length}>
            📊 Export ລາຍວັນ (ສຳລັບ AI)
          </button>
        </div>
      </div>

      {busy && !data && <div className="empty">ກຳລັງໂຫຼດ…</div>}

      {data && (
        <>
          <div className="stat-row">
            <Stat label="ຍອດຂາຍ" value={`${money(data.total)} ກີບ`} big />
            <Stat label="ຈຳນວນບິນ" value={data.bills} />
            <Stat label="ມື້ທີ່ຂາຍ" value={data.tradingDays} />
            <Stat label="ເງິນສົດ" value={money(data.cash)} />
            <Stat label="ເງິນໂອນ" value={money(data.transfer)} />
            {owner && <Stat label="ຕົ້ນທຶນ" value={money(data.cost)} />}
            {owner && <Stat label="ກຳໄລ" value={`${money(data.profit)} ກີບ`} big accent />}
          </div>

          {data.unsoldMenus.length > 0 && (
            <div className="card">
              <h3>ເມນູທີ່ບໍ່ໄດ້ຂາຍເລີຍໃນຊ່ວງນີ້ ({data.unsoldMenus.length} ຈາກ {data.byMenu.filter(m => m.onMenu).length})</h3>
              <div className="bag-remaining">
                {data.unsoldMenus.map(n => <span key={n} className="chip chip-todo">{n}</span>)}
              </div>
            </div>
          )}

          <div className="report-cols">
            <section className="card">
              <h3>ຍອດຂາຍລາຍວັນ</h3>
              {data.byDay.length === 0 && <div className="empty">ບໍ່ມີຂໍ້ມູນ</div>}
              {data.byDay.length > 0 && (
                <table className="table">
                  <thead>
                    <tr><th>ວັນທີ</th><th>ບິນ</th><th>ກ້ອນ</th><th>ຍອດຂາຍ</th>{owner && <th>ກຳໄລ</th>}</tr>
                  </thead>
                  <tbody>
                    {data.byDay.map(d => (
                      <tr key={d.date}>
                        <td>{d.date}</td>
                        <td className="num">{d.bills}</td>
                        <td className="num">{d.pieces}</td>
                        <td className="num">{money(d.total)}</td>
                        {owner && <td className="num">{money(d.profit)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card">
              <h3>ເມນູຂາຍດີ · ຂາຍບໍ່ດີ</h3>
              <table className="table">
                <thead>
                  <tr><th>ເມນູ</th><th>ຈຳນວນ</th><th>ຍອດຂາຍ</th>{owner && <th>ກຳໄລ</th>}</tr>
                </thead>
                <tbody>
                  {data.byMenu.map(m => (
                    <tr key={m.name} className={m.qty === 0 ? 'row-zero' : ''}>
                      <td>{m.name}{!m.onMenu ? ' (ລຶບແລ້ວ)' : m.active ? '' : ' (ປິດຢູ່)'}</td>
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
