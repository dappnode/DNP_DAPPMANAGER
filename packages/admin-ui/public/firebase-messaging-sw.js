/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/11.3.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.3.1/firebase-messaging-compat.js");

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD11_NOeLR9Cj06FEYuKX31CK5vtTNx4RY",
  authDomain: "dappnode-pwa.firebaseapp.com",
  projectId: "dappnode-pwa",
  storageBucket: "dappnode-pwa.appspot.com",
  messagingSenderId: "423547961365",
  appId: "1:423547961365:web:60ef721b095d4726bc0e1c",
  measurementId: "G-0HRH74BDST"
};

// ✅ Initialize Firebase inside the service worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ✅ Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background push notification:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new message",
    icon: "/icons/pwa-icon.png",
    data: { url: payload.notification?.click_action || "/" } // ✅ Ensure it opens the app
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Handle notification click to open the app
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event.notification);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow(event.notification.data.url);
      }
    })
  );
});
