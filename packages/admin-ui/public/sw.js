/* public/sw.js */

// Push: display incoming push messages
self.addEventListener('push', event => {
    console.log('[SW] Push received');
    const data = event.data?.json() || {};
    console.log('[SW] Push data:', data);
  
    const title = data.title || 'New Notification';
    const options = {
      body: data.body || 'You have a new message.',
      icon: data.icon || '/favicon.svg', 
      badge: '/logo.svg',                // mobile notifiation topbar
      data: {
        url: data.callToAction?.url || '/', // To be used on click
        correlationId: data.correlationId,  
        category: data.category,
        priority: data.priority,
        timestamp: data.timestamp || Date.now() 
      },
      actions: data.callToAction ? [
        {
          action: 'open_url',
          title: data.callToAction.title || 'Open',
        }
      ] : [],
      tag: data.correlationId || undefined, // Prevents stacking same correlation-id notifications
      renotify: false,                      // Optional: avoid re-alerting user
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  // Notification-click: focus or open the app
  self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification click');
    event.notification.close();
  
    const targetUrl = event.notification.data?.url || '/';
  
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
    );
  });
  