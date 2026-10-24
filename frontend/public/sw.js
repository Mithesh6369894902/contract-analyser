const CACHE_NAME = 'contract-ai-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index-BpoXnp19.css',
  '/assets/index-CO89g7jB.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
