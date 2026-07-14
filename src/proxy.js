import { NextResponse } from 'next/server'

export function proxy(request) {
  const response = NextResponse.next()
  response.headers.set('Netlify-CDN-Cache-Control', 'no-store')
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const config = {
  matcher: ['/staff2', '/staffv2']
}
