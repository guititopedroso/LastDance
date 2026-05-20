const CACHE_NAME = 'lastdance-memories-v1';
const ASSETS_CACHE_NAME = 'lastdance-static-assets-v1';
const IMAGES_CACHE_NAME = 'lastdance-memories-images-v1';

const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo_transparent.webp',
  '/favicon.ico'
];

// Limit cache size to hold only the most recent photos
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const toDelete = keys.slice(0, keys.length - maxItems);
    for (const request of toDelete) {
      await cache.delete(request);
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_RESOURCES);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, ASSETS_CACHE_NAME, IMAGES_CACHE_NAME].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Firebase Storage Images (Stale-While-Revalidate with a limit of 50 photos)
  if (requestUrl.host === 'firebasestorage.googleapis.com') {
    event.respondWith(
      caches.open(IMAGES_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
              // Clean up if we exceed 50 images
              limitCacheSize(IMAGES_CACHE_NAME, 50);
            }
            return networkResponse;
          }).catch(() => {
            // Offline fallback or ignore
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. Vite Static Assets (e.g. files under /assets/)
  if (requestUrl.pathname.includes('/assets/')) {
    event.respondWith(
      caches.open(ASSETS_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve static assets from cache first, but fetch to keep it warm in background
            fetch(event.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }

          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 3. HTML and other static assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return offline fallback if we are navigating to a page and offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
