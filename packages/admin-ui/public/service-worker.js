/* eslint-disable no-undef */

/* Handles caching and offline mode */
/* TODO add offline.html page */

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

/** webpush-ios-example */

self.addEventListener("push", (event) => {
  let pushData = event.data.json();
  if (!pushData || !pushData.title) {
    console.error("Received WebPush with an empty title. Received body:", pushData);
    return;
  }
  event.waitUntil(self.registration.showNotification(pushData.title, pushData));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (!event.notification.data) {
    console.error("Click on WebPush with empty data, where url should be. Notification: ", event.notification);
    return;
  }
  if (!event.notification.data.url) {
    console.error("Click on WebPush without url. Notification: ", event.notification);
    return;
  }

  clients.openWindow(event.notification.data.url).then(() => {
    // You can send fetch request to your analytics API fact that push was clicked
    // fetch('https://your_backend_server.com/track_click?message_id=' + pushData.data.message_id);
  });
});
