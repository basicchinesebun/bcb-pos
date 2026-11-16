import { Readable } from 'node:stream';
import { streamFile } from '../lib/store.js';

// รูปเมนู/QR (สาธารณะ) — เฉพาะโฟลเดอร์ images/
export default async function handler(req, res) {
  const p = String(new URL(req.url, 'http://x').searchParams.get('p') || '');
  if (!/^images\/[\w.\-]+$/.test(p)) { res.statusCode = 404; return res.end(); }
  const r = await streamFile(p);
  if (!r) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', r.blob.contentType || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  Readable.fromWeb(r.stream).pipe(res);
}
