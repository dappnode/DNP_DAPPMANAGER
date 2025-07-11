/* eslint-disable no-undef */
/* public/sw.js */

// Push: display incoming push messages
self.addEventListener("push", (event) => {
  console.log("[SW] Push received");
  const data = event.data?.json() || {};
  console.log("[SW] Push data:", data);

  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new message.",
    icon: data.icon || "/favicon.ico",
    badge: "/dn-badge.svg", // mobile notifiation topbar
    data: {
      url: data.callToAction?.url || "/", // To be used on click
      correlationId: data.correlationId,
      category: data.category,
      priority: data.priority,
      timestamp: data.timestamp || Date.now()
    },
    actions: data.callToAction
      ? [
          {
            action: "open_url",
            title: data.callToAction.title || "Open"
          }
        ]
      : [],
    tag: data.correlationId || undefined, // Prevents stacking same correlation-id notifications
    renotify: false // Optional: avoid re-alerting user
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification-click: focus or open the app
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click");
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

const CACHE_NAME = "dappmanager-pwa-v0";
const OFFLINE_URLS = [
  // Review the list of URLs to cache
  "/index.html",
  "/favicon.ico",
  "/dn-badge.svg",
  "/icon-192x192.png",
  "/icon-256x256.png",
  "/icon-384x384.png",
  "/icon-512x512.png",
  "/vpnoff.png",

  "/offline.html",
  "/vpnoff.html"
];

// Install: cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        OFFLINE_URLS.map(async (url) => {
          const response = await fetch(url, { cache: "reload" });
          await cache.put(url, response);
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);

        // If PWA domain returns 403, return VPN offline page
        if (networkResponse.status === 403) {
          return caches.match("/vpnoff.html");
        }

        // If we get any !ok serve the offline => maybe add a cache html for 403 (VPN)
        if (!networkResponse.ok) {
          return caches.match("/offline.html");
        }

        return networkResponse;
      } catch (err) {
        return caches.match("/offline.html");
      }
    })()
  );
});
