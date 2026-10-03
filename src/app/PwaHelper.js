'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const PWA_CONFIG = {
  '/order':    { manifest: '/manifest-order.json',    sw: '/sw-order.js',    icon: '/icon-order-192.png' },
  '/preorder': { manifest: '/manifest-preorder.json', sw: '/sw-preorder.js', icon: '/icon-preorder-192.png' },
  // sw-staff.js is NOT this worker. That one was a self-destruct: on activate
  // it cleared the caches, unregistered itself and navigated every open client
  // — a reload — while this helper re-registered it on every page load. It
  // installed, reloaded, installed again, and each reload cancelled the till's
  // shop_config request, so the screen reported a slow connection it never had.
  // The file at that name is now a no-op that only unregisters itself.
  //
  // sw-staff-offline.js is a new file under a new name, so a device carrying
  // the old one drops it and picks this up. It never navigates a client, and
  // it only ever caches this origin's own GET responses. Without a worker the
  // till cannot open at all once the line is down, which is the whole point.
  //
  // Its scope is '/' and not '/staff', because the page's own code lives at
  // /_next/static/ — outside /staff — and a worker cannot see a request outside
  // its scope. Scoped to /staff it would cache the shell and none of the
  // JavaScript that shell loads, which offline is the same as caching nothing.
  // The worker itself only answers navigations under /staff; the customer pages
  // keep their own workers (a narrower scope wins) or go straight to the
  // network as before.
  '/staff':    { manifest: '/manifest-staff.json',    sw: '/sw-shop-offline.js', scope: '/', icon: '/icon-staff-192.png' },
  // The same worker as /staff, at the same scope. sw-kitchen.js cached the
  // page's icon and nothing else, so with the line down the kitchen board
  // would not open — and a shop that can still take orders but cannot see
  // them in the kitchen has stopped just the same.
  '/kitchen':  { manifest: '/manifest-kitchen.json',  sw: '/sw-shop-offline.js', scope: '/', icon: '/icon-kitchen-192.png' },
  // The customer board is installed on the till's second screen and left
  // running all day, so it asks for fullscreen rather than standalone — there
  // is no address bar or tab strip for a stray touch to land on.
  '/display':  { manifest: '/manifest-display.json',  sw: '/sw-shop-offline.js', scope: '/', icon: '/icon-display-192.png' },
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

    // The practice shop installs to the same home screen as the real one, from
    // the same code, so without this they land as two identical icons with the
    // same name — and an installed app shows no address bar to tell them apart.
    // Someone takes a real order into the practice database, or practises on
    // the real one. The practice build gets its own name and an amber splash.
    const isPractice = window.location.hostname.startsWith('test.')
    const manifest = isPractice && base === '/staff' ? '/manifest-staff-test.json' : config.manifest
    setOrCreate('manifest', { href: manifest })
    setOrCreate('apple-touch-icon', { href: config.icon })

    let themeMeta = document.querySelector('meta[name="theme-color"]')
    if (!themeMeta) {
      themeMeta = document.createElement('meta')
      themeMeta.name = 'theme-color'
      document.head.appendChild(themeMeta)
    }
    themeMeta.content = isPractice ? '#b45309' : '#3E2723'

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (config.sw) {
      navigator.serviceWorker.register(config.sw, { scope: config.scope || base }).catch(() => { })
      return
    }
    // Clear out any worker a previous visit left registered for this page.
    navigator.serviceWorker.getRegistrations()
      .then(rs => rs.forEach(r => { if (r.scope.includes(base)) r.unregister() }))
      .catch(() => { })
  }, [pathname])

  return null
}
