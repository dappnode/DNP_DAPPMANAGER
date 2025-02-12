/* eslint-disable no-undef */

/* Handles caching and offline mode */
/* TODO add offline.html page */

// ✅ Service worker for caching (No Firebase logic here)
const CACHE_NAME = "pwa-cache-v1";
const urlsToCache = ["/", "/index.html", "/styles.css", "/app.js", "/offline.html"];

// Install event: Cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event: Serve cached assets (but don't cache API calls)
self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith("https://your-api.com")) {
    return; // Don't cache API requests
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Activate event: Cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
