/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'product-catalog-v1';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/', // Root HTML
  '/offline.html', // Offline fallback page
  '/icons/*', // Local icons
  '/src/assets/*', // Local assets
  '/src/components/*', // React components
  '/src/lib/*', // Supabase and DB utilities
];

// Install event: Cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS_TO_CACHE);
      console.log('Service Worker: Caching essential assets');
    })()
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches and enable navigation preload
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if supported
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      // Clean up old caches
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache', key);
            return caches.delete(key);
          }
        })
      );

      console.log('Service Worker: Activated');
      self.clients.claim();
    })()
  );
});

// Fetch event: Serve cached assets or fetch from network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Check if the request is for a Supabase image
  const isSupabaseImage = request.url.includes('supabase.co/storage/v1/object/public');

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Try to serve from cache first for Supabase images
      if (isSupabaseImage) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      try {
        // Try to fetch from the network
        const networkResponse = await fetch(request);

        // Cache the response for future use
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        // If the network fails, serve from the cache
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // If no cached response, serve the offline page for navigation requests
        if (request.mode === 'navigate') {
          const offlineResponse = await cache.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }
        }

        // Return a generic error response for other requests
        return new Response('Network error', { status: 408 });
      }
    })()
  );
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
    })
  );
});

// Handle notification clicks (optional)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/') // Open the app homepage
  );
});