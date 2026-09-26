// Deliberately does nothing.
//
// This used to be a self-destruct worker: it cleared every cache, unregistered
// itself, and then navigated all open clients so they would reload on fresh
// files. PwaHelper re-registered it on every page load, so it installed,
// activated, reloaded the page, and installed again — and the till's config
// request was cancelled by each reload before it could finish. /staff no longer
// registers any worker, but a device that already has this one keeps it until
// it next checks for an update, so make that update harmless.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.registration.unregister());
});
