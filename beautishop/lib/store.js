import { put, get, list } from '@vercel/blob';

const A = { access: 'private' };
export const STATUSES = ['new', 'confirmed', 'shipped', 'cancelled'];

export const DEFAULT_CONFIG = {
  settings: { shopName: '玉灵膏 ຢູ້ຫຼິງເກົາ', currency: '₭', bankName: 'BCEL One', bankAccount: '', accountName: '', qrImage: '', contact: '' },
  menu: [
    { id: 'm1', name: '玉灵膏 ຢູ້ຫຼິງເກົາ 220g × 1 ກະປ໋ອງ', desc: '+ ບ່ວງ', price: 0, image: '', active: true },
    { id: 'm2', name: 'ໂປຣ ຊື້ 4 ແຖມ 2: 玉灵膏 220g × 4', desc: '+ 怀姜枣膏 × 1 + ບ່ວງ', price: 0, image: '', active: true }
  ],
  branches: []
};

async function readJson(path, fallback) {
  const r = await get(path, { ...A, useCache: false });
  if (!r || r.statusCode !== 200) return fallback;
  return JSON.parse(await new Response(r.stream).text());
}
async function writeJson(path, obj) {
  await put(path, JSON.stringify(obj), { ...A, contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });
}

export const getConfig = () => readJson('config.json', DEFAULT_CONFIG);
export const saveConfig = c => writeJson('config.json', c);
export const getStatuses = () => readJson('statuses.json', {});
export const saveStatuses = s => writeJson('statuses.json', s);

export async function saveOrder(order) {
  await put(`orders/${order.ts}_${order.orderId}.json`, JSON.stringify(order), { ...A, contentType: 'application/json', addRandomSuffix: false });
}

export async function listOrders(max = 150) {
  let blobs = [], cursor;
  do {
    const r = await list({ prefix: 'orders/', limit: 1000, cursor });
    blobs.push(...r.blobs); cursor = r.hasMore ? r.cursor : null;
  } while (cursor);
  blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
  blobs = blobs.slice(0, max);
  return Promise.all(blobs.map(b => readJson(b.pathname, null)));
}

export async function putFile(prefix, buf, mime) {
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const r = await put(`${prefix}/${Date.now()}.${ext}`, buf, { ...A, contentType: mime, addRandomSuffix: true });
  return r.pathname;
}

export async function streamFile(path) {
  const r = await get(path, A);
  return r && r.statusCode === 200 ? r : null;
}
