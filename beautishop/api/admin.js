import { getConfig, saveConfig, listOrders, getStatuses, updateStatuses, getStock, updateStock, findOrder, putFile, STATUSES } from '../lib/store.js';
import { send, body, checkPw, sleep } from '../lib/http.js';

class NeedsMenu extends Error {}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const d = await body(req);
  if (!checkPw(d.pw)) { await sleep(800); return send(res, 401, { error: 'รหัสผ่านไม่ถูก' }); }
  try {
    switch (d.action) {
      case 'data': {
        const [config, orders, statuses, stock] = await Promise.all([getConfig(), listOrders(), getStatuses(), getStock()]);
        return send(res, 200, { config, stock, statuses: STATUSES,
          orders: orders.filter(Boolean).map(o => ({ ...o, status: statuses[o.orderId] || 'new' })) });
      }
      case 'saveConfig': {
        const c = d.config || {};
        const s = c.settings || {};
        const keys = ['shopName', 'currency', 'bankName', 'bankAccount', 'accountName', 'qrImage', 'contact'];
        const settings = Object.fromEntries(keys.map(k => [k, String(s[k] || '').trim().slice(0, 300)]));
        const menu = (c.menu || []).filter(m => String(m.name || '').trim()).slice(0, 200).map((m, i) => ({
          id: String(m.id || ('m' + Date.now().toString(36) + i)),
          name: String(m.name).trim().slice(0, 200), desc: String(m.desc || '').trim().slice(0, 300),
          price: Math.max(0, Number(m.price) || 0), image: String(m.image || '').trim().slice(0, 500), active: !!m.active
        }));
        const branches = (c.branches || []).filter(b => String(b.name || '').trim()).slice(0, 50).map((b, i) => ({
          id: String(b.id || ('b' + Date.now().toString(36) + i)),
          name: String(b.name).trim().slice(0, 100), detail: String(b.detail || '').trim().slice(0, 300),
          map: /^https:\/\//.test(String(b.map || '').trim()) ? String(b.map).trim().slice(0, 500) : '', active: !!b.active
        }));
        const config = { settings, menu, branches };
        await saveConfig(config);
        return send(res, 200, { config });
      }
      case 'setStatus': {
        if (!STATUSES.includes(d.status)) return send(res, 400, { error: 'bad status' });
        const id = String(d.orderId);
        let prev = 'new';
        await updateStatuses(s => { prev = s[id] || 'new'; s[id] = d.status; return s; });
        // Cancelling puts the order's counted items back in stock; un-cancelling takes them out again.
        const sign = prev !== 'cancelled' && d.status === 'cancelled' ? 1
          : prev === 'cancelled' && d.status !== 'cancelled' ? -1 : 0;
        let stock, moved = 0;
        if (sign) {
          const o = await findOrder(id);
          const back = ((o && o.items) || []).filter(i => i.stocked && i.id);
          if (back.length) {
            stock = await updateStock(s => {
              for (const i of back) if (typeof s[i.id] === 'number') s[i.id] += sign * i.qty;
              return s;
            });
            moved = sign;
          }
        }
        return send(res, 200, { ok: true, stock, moved });
      }
      case 'stock': {
        const id = String(d.id || '').slice(0, 60);
        // Only an item that isn't counted yet needs the menu looked up (one less
        // storage read for the usual − / + on an item that already has a count).
        let known = false;
        for (;;) {
          try {
            const stock = await updateStock(s => {
              if (d.set === null || d.set === '') { if (!(id in s)) return undefined; delete s[id]; return s; }  // no limit
              if (typeof s[id] !== 'number' && !known) throw new NeedsMenu();
              if (d.set !== undefined) s[id] = Math.min(99999, Math.max(0, Math.floor(Number(d.set) || 0)));
              else {                                                        // − / + : never pushed below 0 by hand
                const cur = typeof s[id] === 'number' ? s[id] : 0, step = Math.trunc(Number(d.delta) || 0);
                s[id] = Math.min(99999, Math.max(Math.min(cur, 0), cur + step));
              }
              return s;
            });
            return send(res, 200, { stock });
          } catch (e) {
            if (!(e instanceof NeedsMenu) || known) throw e;
            const { menu } = await getConfig();
            if (!menu.some(m => m.id === id)) return send(res, 400, { error: 'ไม่พบเมนูนี้ กดบันทึกเมนูก่อน' });
            known = true;
          }
        }
      }
      case 'upload': {
        const buf = Buffer.from(String(d.data || ''), 'base64');
        if (buf.length < 100 || buf.length > 4_000_000) return send(res, 400, { error: 'ไฟล์ไม่ถูกต้อง' });
        const p = await putFile('images', buf, d.mime === 'image/png' ? 'image/png' : 'image/jpeg');
        return send(res, 200, { url: '/beautishop/api/img?p=' + encodeURIComponent(p) });
      }
      default: return send(res, 400, { error: 'unknown action' });
    }
  } catch (e) { console.error(e); send(res, 500, { error: 'เกิดข้อผิดพลาด ลองใหม่' }); }
}
