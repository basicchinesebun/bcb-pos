import { Readable } from 'node:stream';
import { streamFile } from '../lib/store.js';
import { checkPw, body, sleep } from '../lib/http.js';

// สลิป (ส่วนตัว) — ต้องมีรหัสแอดมิน
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  const d = await body(req);
  if (!checkPw(d.pw)) { await sleep(800); res.statusCode = 401; return res.end(); }
  const p = String(d.p || '');
  if (!/^slips\/[\w.\-]+$/.test(p)) { res.statusCode = 404; return res.end(); }
  const r = await streamFile(p);
  if (!r) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', r.blob.contentType || 'image/jpeg');
  res.setHeader('Cache-Control', 'private, no-store');
  Readable.fromWeb(r.stream).pipe(res);
}
