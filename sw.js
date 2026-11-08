const CACHE_NAME = 'nx-emulator-shell-v4';
const base = self.registration.scope;
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'].map((p) => new URL(p, base).toString());

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(APP_SHELL.map((u) => cache.add(new Request(u, { cache: 'reload' }))));
    results.forEach((r, i) => { if (r.status === 'rejected') console.error('[SW] failed to cache', APP_SHELL[i], r.reason); });
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isPage = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  event.respondWith((async () => {
    if (isPage) {
      try {
        const res = await fetch(event.request, { cache: 'no-store' });
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)); }
        return res;
      } catch (e) {
        return (await caches.match(event.request, { ignoreSearch: true })) || (await caches.match(new URL('./index.html', base).toString())) || Response.error();
      }
    }
    const cached = await caches.match(event.request, { ignoreSearch: true });
    const net = fetch(event.request).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)); }
      return res;
    }).catch(() => null);
    if (cached) { event.waitUntil(net); return cached; }
    return (await net) || Response.error();
  })());
});
