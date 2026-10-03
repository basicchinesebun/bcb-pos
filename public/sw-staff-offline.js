// Lets the till open with no internet at all.
//
// A storm here takes the line out for the rest of the day. The till can go on
// selling from its leased queue numbers and stock, but only if the page will
// open — and a web app with no worker will not open at all once the connection
// is gone. This worker keeps a copy of the shell so it will.
//
// It is deliberately boring, because the worker that used to live at
// sw-staff.js was not. That one cleared the caches, unregistered itself, and
// then called clients.navigate() to reload every open page — while PwaHelper
// re-registered it on each load. It installed, reloaded, and installed again,
// cancelling the till's config request every time, and the screen reported a
// slow connection it never had. The till was unusable for hours.
//
// So, the rules here:
//   1. never call clients.navigate(), and never reload a page
//   2. never cache anything but this origin's own GET responses
//   3. network first for pages, so a deploy is picked up the moment there is
//      a line, and the cache is only ever a fallback
//
// The filename is new on purpose: a device still carrying the old sw-staff.js
// unregisters it (that file is now a no-op) and picks this one up instead.

const CACHE = 'bcb-staff-v1';
const SHELL = '/staff';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([SHELL]).catch(() => { }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/')
    || url.pathname.startsWith('/voice/')
    || /\.(?:css|js|woff2?|png|jpg|jpeg|svg|ico|webp)$/.test(url.pathname);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Supabase, uploads, anything not ours: straight to the network. A stale
  // order list is worse than no order list, and a cached auth response is a
  // genuine hazard.
  if (url.origin !== self.location.origin) return;

  // Hashed filenames never change contents, so the cache can answer first and
  // the page starts instantly — this is also what makes it openable offline.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => { });
        }
        return res;
      }))
    );
    return;
  }

  // Pages: always try the line first, so a new deploy lands as soon as there is
  // one. The cache is the fallback, never the source of truth.
  //
  // Only the till's own pages. This worker is registered at scope '/' so it can
  // see /_next/static, which puts every customer page in its reach too — those
  // are left exactly as they were, going straight to the network.
  if (req.mode === 'navigate' && url.pathname.startsWith('/staff')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => { });
          }
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match(SHELL)))
    );
  }
});
