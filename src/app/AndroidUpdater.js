'use client'

import { useEffect } from 'react'

// Updating the tablet without reinstalling it.
//
// The Windows build fetches a few megabytes of the shop's own code and takes it
// up at the next launch. The Android app shipped its code inside the apk, so
// every change meant carrying a new apk to the tablet and installing it by
// hand — which is what the owner got tired of.
//
// Same shape as the Windows updater, and the same rule: a new copy is
// downloaded quietly and only swapped in when the app next starts. Nothing is
// ever replaced under a screen that is in the middle of taking an order.
//
// Does nothing in a browser or in the Windows build.

const MANIFEST = 'desktop/manifest.json'
const BUNDLE = 'desktop/site.zip'
const BASE = process.env.NEXT_PUBLIC_UPDATE_URL || 'https://test.basicchinesebun.com/'

export default function AndroidUpdater() {
  useEffect(() => {
    let cancelled = false

    async function run() {
      if (typeof window === 'undefined') return
      if (!window.Capacitor?.isNativePlatform?.()) return

      let Updater
      try {
        ({ CapacitorUpdater: Updater } = await import('@capgo/capacitor-updater'))
      } catch (_) { return }

      // Without this the plugin assumes the new copy broke the app and rolls
      // back to the previous one on the next start. It is the safety net that
      // makes updating a tablet in a shop reasonable at all, so it is the
      // first thing that happens.
      try { await Updater.notifyAppReady() } catch (_) { }

      // Anything downloaded on an earlier run is taken up now, while the app is
      // starting and a reload costs nothing.
      try {
        const next = JSON.parse(localStorage.getItem('bcb_pending_bundle') || 'null')
        if (next?.id) {
          localStorage.removeItem('bcb_pending_bundle')
          await Updater.set({ id: next.id })
          return                                   // the webview reloads here
        }
      } catch (_) { localStorage.removeItem('bcb_pending_bundle') }

      // Then look for a newer one, quietly, for next time.
      try {
        const res = await fetch(new URL(MANIFEST, BASE).href, { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const manifest = await res.json()
        if (!manifest.build) return

        const current = await Updater.current().catch(() => null)
        const have = current?.bundle?.version || null
        if (have === manifest.build) return

        const bundle = await Updater.download({
          url: new URL(BUNDLE, BASE).href,
          version: manifest.build,
        })
        if (cancelled || !bundle?.id) return
        localStorage.setItem('bcb_pending_bundle', JSON.stringify({ id: bundle.id, build: manifest.build }))
        // Deliberately not applied here. Mid-service is the wrong moment to
        // reload the till, and the shop closes every day anyway.
        console.log('updater: build', manifest.build, 'ready for the next launch')
      } catch (e) {
        // No line, or nothing published yet. The app carries on as it is.
        console.log('updater: no update —', e?.message)
      }
    }

    run()
    return () => { cancelled = true }
  }, [])

  return null
}
