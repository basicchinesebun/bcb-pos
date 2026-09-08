// Single door to the main process. Every call comes back as { ok, data } or
// { ok:false, error }; `call` throws on failure so callers can only get a
// value by succeeding. The old system's habit of ignoring a rejected write —
// and quietly not deducting stock for weeks — is impossible through here.

const bcb = typeof window !== 'undefined' ? window.bcb : null

export const hasBridge = !!bcb

export async function call(fn, ...args) {
  if (!bcb) throw new Error('ບໍ່ໄດ້ເປີດຜ່ານໂປຣແກຣມ BCB POS')
  const res = await fn(...args)
  if (!res || res.ok !== true) throw new Error(res?.error || 'ບໍ່ສຳເລັດ')
  return res.data
}

export const api = bcb
export const imageUrl = name => (bcb && name ? bcb.images.url(name) : null)

export function money(n) {
  return (Math.round(n) || 0).toLocaleString('en-US')
}

export function todayStr(d = new Date()) {
  const p = x => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
