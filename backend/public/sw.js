// ShopBill Progressive Web App Service Worker (v1.0.0)
const CACHE_NAME = 'shopbill-offline-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Install: Cache critical app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching assets notice:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first with Cache-fallback for HTML/assets, graceful offline for APIs
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST, PUT, DELETE) - let app handle them
  if (request.method !== 'GET') {
    return;
  }

  // Let the app and OfflineContext handle all /api/ requests with Axios fallback
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle App Navigation (HTML pages): Network-first, fallback to /index.html in cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          return new Response('ShopBill Offline - Please reconnect to load fresh session', {
            headers: { 'Content-Type': 'text/html' },
          });
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, images, fonts): Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      });
    })
  );
});
