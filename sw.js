// sw.js — offline shell for the portal. Scope is this folder only (registered with scope './'), so it never touches
// the other tools that live on the same domain. The shell is served from the cache of this version; version.json is
// always read from the network so a new release is noticed.
const VERSION = '6.9';   // stamped by scripts/bump.mjs — never edit by hand
const CACHE = 'afaqy-portal-' + VERSION;
const SHELL = [
  './', './index.html', './app.js', './core.js', './config.js', './manifest.webmanifest',
  './assets/afaqy-logo-reverse.png', './assets/favicon.png', './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png',
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
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request)));
});
