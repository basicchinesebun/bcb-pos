import crypto from 'node:crypto';
import { getConfig, saveOrder, putFile } from '../lib/store.js';
import { send, body } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  try {
    const d = await body(req);
    const name = String(d.name || '').trim().slice(0, 100);
    const phone = String(d.phone || '').replace(/[^\d+ -]/g, '').trim().slice(0, 30);
    const note = String(d.note || '').trim().slice(0, 500);
    if (!name) return send(res, 400, { error: 'ກະລຸນາໃສ່ຊື່' });
    if (phone.replace(/\D/g, '').length < 8) return send(res, 400, { error: 'ເບີໂທບໍ່ຖືກຕ້ອງ' });
    if (!d.slip || !d.slip.data) return send(res, 400, { error: 'ກະລຸນາແນບສະລິບ' });

    const { menu, branches = [] } = await getConfig();
    const openBr = branches.filter(b => b.active);
    let branch = '';
    if (openBr.length) {
      const b = openBr.find(x => x.id === d.branchId);
      if (!b) return send(res, 400, { error: 'ກະລຸນາເລືອກສາຂາຮັບສິນຄ້າ' });
      branch = b.name;
    }
    const byId = Object.fromEntries(menu.filter(m => m.active && m.price > 0).map(m => [m.id, m]));
    const items = []; let total = 0;
    for (const it of d.items || []) {
      const m = byId[it.id]; const q = Math.floor(Number(it.qty));
      if (m && q > 0 && q <= 99) { items.push({ name: m.name, qty: q, price: m.price }); total += m.price * q; }
    }
    if (!items.length) return send(res, 400, { error: 'ກະລຸນາເລືອກສິນຄ້າ' });

    const buf = Buffer.from(String(d.slip.data), 'base64');
    if (buf.length < 1000 || buf.length > 4_000_000) return send(res, 400, { error: 'ຮູບສະລິບບໍ່ຖືກຕ້ອງ' });
    const mime = d.slip.mime === 'image/png' ? 'image/png' : 'image/jpeg';

    const now = new Date();
    const lao = new Date(now.getTime() + 7 * 3600e3).toISOString();
    const orderId = 'YL' + lao.slice(2, 10).replace(/-/g, '') + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
    const slip = await putFile('slips', buf, mime);
    await saveOrder({ orderId, ts: now.getTime(), time: now.toISOString(), name, phone, note, branch, items, total, slip });
    send(res, 200, { orderId, total });
  } catch (e) {
    console.error(e); send(res, 500, { error: 'ສົ່ງບໍ່ສຳເລັດ' });
  }
}
