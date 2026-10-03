// Lets the shop's own screens open with no internet at all.
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

const CACHE = 'bcb-shop-v4';
// Without a trailing slash: '/staff/' 308-redirects to '/staff', and a
// redirected response cannot be cached — which is why the first attempt
// cached nothing at all.
//
// All four screens, not just the till. The kitchen board cached its icon and
// nothing else, so during an outage it would not open — and a shop that can
// take orders but cannot see them in the kitchen is still a shop that has
// stopped.
const SHELLS = ['/staff', '/kitchen', '/display', '/queue'];
const SHELL = SHELLS[0];

// Caching the shell alone was not enough: the page is useless without the
// JavaScript it loads, and those files were only cached once they had been
// fetched through this worker — which does not happen until the *second*
// online visit. Turn the wifi off after the first one and the browser showed
// its no-connection page. Read the shell at install time and pull in every
// /_next file it references, so one online visit is all it takes.
async function precacheShell(cache) {
  const urls = new Set();
  for (const shell of SHELLS) {
    try {
      const res = await fetch(shell, { credentials: 'same-origin' });
      if (!res || !res.ok || res.redirected) continue;
      const html = await res.clone().text();
      await cache.put(shell, res);
      const re = /(?:src|href)="(\/_next\/[^"]+)"/g;
      let m;
      while ((m = re.exec(html)) !== null) urls.add(m[1]);
    } catch (_) { /* one screen failing must not cost the others theirs */ }
  }
  await Promise.all([...urls].map(u => cache.add(u).catch(() => { })));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => precacheShell(c).catch(() => { }))
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
  // Only the shop's own screens. This worker is registered at scope '/' so it
  // can see /_next/static, which puts the customer-facing order pages in its
  // reach too — those are left exactly as they were, going to the network.
  const forUs = SHELLS.some(s => url.pathname === s || url.pathname.startsWith(s + '/'));
  if (req.mode === 'navigate' && forUs) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => { });
          }
          return res;
        })
        // /staff and /staff/ are the same page to a person and two different
        // keys to the cache, so try the request itself, then the shell.
        .catch(() => caches.match(req, { ignoreSearch: true })
          // Fall back to this screen's own shell before anything else: the
          // kitchen must not be handed the till.
          .then(hit => hit || caches.match(SHELLS.find(s => url.pathname.startsWith(s)) || SHELL))
          .then(hit => hit || caches.match(SHELL))
          .then(hit => hit || new Response(
            '<meta charset=utf-8><body style="font-family:sans-serif;padding:2rem;text-align:center">'
            + '<h2>ຍັງບໍ່ທັນເກັບໜ້ານີ້ໄວ້</h2><p>ເປີດຄັ້ງໜຶ່ງຕອນມີອິນເຕີເນັດກ່ອນ</p>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    );
  }
});
