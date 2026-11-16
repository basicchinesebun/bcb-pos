import crypto from 'node:crypto';

export function send(res, code, obj, headers = {}) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(obj));
}
export async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = []; for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { return {}; }
}
export function checkPw(pw) {
  const real = process.env.ADMIN_PASSWORD || '';
  const a = Buffer.from(String(pw || '')), b = Buffer.from(real);
  return real.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
