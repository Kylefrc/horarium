/* Horarium service worker — offline + installable + push-ready.
   Bump VERSION whenever core assets change so clients pick up the update. */
const VERSION = 'horarium-v2';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Cache each asset individually so one missing file can't abort the whole install.
    await Promise.all(CORE.map((url) => cache.add(url).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // App document / navigations: network-first so fresh edits always win, cache fallback offline.
  if (req.mode === 'navigate' || (url.origin === location.origin && req.destination === 'document')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        const cached = await caches.match(req, { ignoreSearch: true });
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  // Google Fonts (cross-origin): cache-first runtime cache so the app keeps its type offline.
  if (url.host.indexOf('fonts.googleapis.com') !== -1 || url.host.indexOf('fonts.gstatic.com') !== -1) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Other same-origin assets (icons, schedule.json, etc.): cache-first, network fallback.
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        return Response.error();
      }
    })());
  }
});

// Let the page promote a waiting worker immediately.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ---- Push-ready (used only if the Web Push reminder path is enabled) ---- */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Horarium';
  const options = {
    body: data.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: data.tag || 'horarium',
    renotify: false,
    data: { url: data.url || './index.html?source=push' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { try { c.navigate(target); } catch (e) {} return c.focus(); }
    }
    if (clients.openWindow) return clients.openWindow(target);
  })());
});
