const CACHE_NAME = 'dreamqueen-v1';

const PRECACHE_URLS = [
  '/',
  '/dreamqueen/',
  'index.html',
  'style.css',
  'src/main.js',
  'src/state.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for Firebase / external requests
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for same-origin
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
