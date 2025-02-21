/* eslint-disable no-undef */
const CACHE_NAME = "pwa-cache-v1";
const urlsToCache = ["/", "/index.html", "/styles.css", "/app.js", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", (event) => {
  // Skip caching API requests
  if (event.request.url.startsWith("https://your-api.com")) {
    return;
  }
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

self.addEventListener("push", (event) => {
  let pushData;
  try {
    pushData = event.data.json();
  } catch (error) {
    console.error("Push event has no JSON data", error);
    return;
  }
  if (!pushData || !pushData.title) {
    console.error("Received WebPush with an empty title. Received body:", pushData);
    return;
  }
  event.waitUntil(self.registration.showNotification(pushData.title, pushData));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (!event.notification.data || !event.notification.data.url) {
    console.error("Notification click event missing data or URL", event.notification);
    return;
  }
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
