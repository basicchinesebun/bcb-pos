'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const PWA_CONFIG = {
  '/order':    { manifest: '/manifest-order.json',    sw: '/sw-order.js',    icon: '/icon-order-192.png' },
  '/preorder': { manifest: '/manifest-preorder.json', sw: '/sw-preorder.js', icon: '/icon-preorder-192.png' },
  '/staff':    { manifest: '/manifest-staff.json',    sw: '/sw-staff.js',    icon: '/icon-staff-192.png' },
}

function setOrCreate(rel, attrs) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  Object.assign(el, attrs)
}

export default function PwaHelper() {
  const pathname = usePathname()

  useEffect(() => {
    const base = '/' + (pathname.split('/')[1] || '')
    const config = PWA_CONFIG[base]
    if (!config) return

    setOrCreate('manifest', { href: config.manifest })
    setOrCreate('apple-touch-icon', { href: config.icon })

    let themeMeta = document.querySelector('meta[name="theme-color"]')
    if (!themeMeta) {
      themeMeta = document.createElement('meta')
      themeMeta.name = 'theme-color'
      document.head.appendChild(themeMeta)
    }
    themeMeta.content = '#3E2723'

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register(config.sw, { scope: base + '/' }).catch(() => {})
    }
  }, [pathname])

  return null
}
