'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const PWA_CONFIG = {
  '/order':    { manifest: '/manifest-order.json',    sw: '/sw-order.js',    icon: '/icon-order-192.png' },
  '/preorder': { manifest: '/manifest-preorder.json', sw: '/sw-preorder.js', icon: '/icon-preorder-192.png' },
  // No service worker here on purpose. sw-staff.js is a self-destruct: on
  // activate it clears the caches, unregisters itself and then navigates every
  // open client — a reload. But this helper re-registers it on every page load,
  // so it installed, activated, reloaded the page, and installed again. The
  // till never got far enough to finish fetching shop_config, which is why it
  // sat on "connection slow" with no error to show: the request was cancelled
  // by the next reload rather than failing. Keep the manifest so the page still
  // installs to the home screen, and drop the worker.
  '/staff':    { manifest: '/manifest-staff.json',    sw: null,              icon: '/icon-staff-192.png' },
  '/kitchen':  { manifest: '/manifest-kitchen.json',  sw: '/sw-kitchen.js',  icon: '/icon-kitchen-192.png' },
  // The customer board is installed on the till's second screen and left
  // running all day, so it asks for fullscreen rather than standalone — there
  // is no address bar or tab strip for a stray touch to land on.
  '/display':  { manifest: '/manifest-display.json',  sw: '/sw-display.js',  icon: '/icon-display-192.png' },
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

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (config.sw) {
      navigator.serviceWorker.register(config.sw, { scope: base }).catch(() => { })
      return
    }
    // Clear out any worker a previous visit left registered for this page.
    navigator.serviceWorker.getRegistrations()
      .then(rs => rs.forEach(r => { if (r.scope.includes(base)) r.unregister() }))
      .catch(() => { })
  }, [pathname])

  return null
}
