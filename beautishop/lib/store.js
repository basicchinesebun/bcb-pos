import { put, get, list, BlobPreconditionFailedError } from '@vercel/blob';

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

// Read, change, write — without losing a change another request made in
// between: the write only lands if the file is still the version we read
// (ETag), otherwise read it again and redo fn. fn gets a fresh copy each try,
// may throw to stop, and returns undefined to leave the file as it is.
async function updateJson(path, fallback, fn) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = await get(path, { ...A, useCache: false });
    const found = !!r && r.statusCode === 200;
    const cur = found ? JSON.parse(await new Response(r.stream).text()) : structuredClone(fallback);
    const next = fn(cur);
    if (next === undefined) return cur;
    try {
      await put(path, JSON.stringify(next), { ...A, contentType: 'application/json', addRandomSuffix: false,
        ...(found ? { allowOverwrite: true, ifMatch: r.blob.etag } : { allowOverwrite: false }) });
      return next;
    } catch (e) {
      // Lost the race: someone wrote first (or created the file first).
      const raced = e instanceof BlobPreconditionFailedError ||
        (!found && await get(path, { ...A, useCache: false }).then(x => !!x && x.statusCode === 200, () => false));
      if (!raced) throw e;
      await new Promise(ok => setTimeout(ok, 30 + Math.random() * 100 * (attempt + 1)));
    }
  }
  throw new Error(`${path} is busy`);
}

export const getConfig = () => readJson('config.json', DEFAULT_CONFIG);
export const saveConfig = c => writeJson('config.json', c);
export const getStatuses = () => readJson('statuses.json', {});
export const updateStatuses = fn => updateJson('statuses.json', {}, fn);

// Stock per menu id. A number means the item is counted; no entry means no limit.
export const getStock = () => readJson('stock.json', {});
export const updateStock = fn => updateJson('stock.json', {}, fn);

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

export async function findOrder(orderId) {
  let cursor;
  do {
    const r = await list({ prefix: 'orders/', limit: 1000, cursor });
    const b = r.blobs.find(x => x.pathname.endsWith(`_${orderId}.json`));
    if (b) return readJson(b.pathname, null);
    cursor = r.hasMore ? r.cursor : null;
  } while (cursor);
  return null;
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
