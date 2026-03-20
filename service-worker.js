const CACHE_NAME = 'didas-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/loadingscreen.html',
  '/homepage.html',
  '/students.html',
  '/dashboard.html',
  '/new-login.html',
  '/new-register.html',
  '/type.css',
  '/auth.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// INSTALL: Cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => console.error('Cache failed during install', err))
  );
  self.skipWaiting();
});

// ACTIVATE: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH: Serve cached content first, then fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then(networkResponse => {
          // Optional: cache new requests dynamically
          if (networkResponse && networkResponse.ok) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Optional: fallback page if offline and request fails
          if (event.request.mode === 'navigate') {
            return caches.match('/loadingscreen.html');
          }
        });
    })
  );
});