const CACHE_NAME = 'nx-emulator-shell-v1-1';
const base = self.registration.scope;
const APP_SHELL = [
  base,
  new URL('./index.html', base).toString(),
  new URL('./manifest.webmanifest', base).toString(),
  new URL('./icon.svg', base).toString(),
  new URL('./icon-192.png', base).toString(),
  new URL('./icon-512.png', base).toString(),
  new URL('./manus-routes.json', base).toString(),
  new URL('./assets/index-CuOEx-5t.js', base).toString(),
  new URL('./assets/index-BaVbrRIZ.css', base).toString()
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => event.request.destination === 'document'
      ? caches.match(new URL('./index.html', self.registration.scope).toString())
      : Promise.reject(new Error('Offline asset is not cached'))))
  );
});
