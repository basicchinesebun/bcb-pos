import { NextResponse } from 'next/server'

export function proxy(request) {
  const country = request.headers.get('x-vercel-ip-country') || ''
  if (country === 'QA') {
    return new NextResponse(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 Not Found</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif"><div style="text-align:center;padding:24px"><div style="font-size:6rem;font-weight:900;color:#d1d5db;line-height:1">404</div><div style="font-size:1.1rem;font-weight:700;color:#6b7280;margin-top:8px">Page Not Found</div><div style="font-size:.85rem;color:#9ca3af;margin-top:6px">The page you are looking for does not exist.</div></div></body></html>`,
      { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  }
  const response = NextResponse.next()
  response.headers.set('Netlify-CDN-Cache-Control', 'no-store')
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const config = {
  matcher: ['/staff2', '/staffv2', '/preorder', '/preorder/:path*'],
}
