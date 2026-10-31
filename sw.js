// sw.js — offline shell for the portal. Scope is this folder only (registered with scope './'), so it never touches
// the other tools that live on the same domain. The shell is served from the cache of this version; version.json is
// always read from the network so a new release is noticed.
const VERSION = '8.44';   // stamped by scripts/bump.mjs — never edit by hand
const CACHE = 'afaqy-portal-' + VERSION;
const SHELL = [
  './', './index.html', './app.js', './core.js', './i18n/ar.js', './i18n/en.js', './i18n/ur.js', './tour-demo.js', './config.js', './manifest.webmanifest',
  './team.json', './weights.json', './systems.json', './systems-core.js', './manage-systems.html', './manage-systems.js',
  './assets/afaqy-logo.png', './assets/afaqy-logo-reverse.png', './assets/favicon.png', './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png',
  './assets/fonts/NotoSansArabic-Regular.ttf', './assets/fonts/NotoSansArabic-Bold.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('afaqy-portal-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  if (!url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;
  if (url.pathname.endsWith('/version.json')) return;   // always from the network
  // A GitHub-approved weights.json or team.json change must reach everyone without an application release.
  // Try the official file first, update the offline cache, and only use the cache if offline.
  if (url.pathname.endsWith('/weights.json') || url.pathname.endsWith('/team.json') || url.pathname.endsWith('/systems.json')) {
    event.respondWith(fetch(event.request).then(async (response) => {
      if (response.ok) {
        try { const cache = await caches.open(CACHE); await cache.put(event.request, response.clone()); }
        catch { /* online result still works if the offline cache cannot be written */ }
      }
      return response;
    }).catch(() => caches.match(event.request, { ignoreSearch: true })));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request)));
});
