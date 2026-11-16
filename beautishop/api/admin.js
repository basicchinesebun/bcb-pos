import { getConfig, saveConfig, listOrders, getStatuses, saveStatuses, putFile, STATUSES } from '../lib/store.js';
import { send, body, checkPw, sleep } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const d = await body(req);
  if (!checkPw(d.pw)) { await sleep(800); return send(res, 401, { error: 'รหัสผ่านไม่ถูก' }); }
  try {
    switch (d.action) {
      case 'data': {
        const [config, orders, statuses] = await Promise.all([getConfig(), listOrders(), getStatuses()]);
        return send(res, 200, { config, statuses: STATUSES,
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
        const s = await getStatuses(); s[String(d.orderId)] = d.status; await saveStatuses(s);
        return send(res, 200, { ok: true });
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
