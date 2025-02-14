/* eslint-disable no-undef */
import firebase from "firebase/compat/app"; // ✅ Use full compat mode
import "firebase/compat/messaging"; // ✅ Import messaging compat mode
import { getMessaging, getToken, onMessage } from "firebase/messaging"; // ✅ Import messaging methods

const firebaseConfig = {
  apiKey: "AIzaSyD11_NOeLR9Cj06FEYuKX31CK5vtTNx4RY",
  authDomain: "dappnode-pwa.firebaseapp.com",
  projectId: "dappnode-pwa",
  storageBucket: "dappnode-pwa.appspot.com",
  messagingSenderId: "423547961365",
  appId: "1:423547961365:web:60ef721b095d4726bc0e1c",
  measurementId: "G-0HRH74BDST"
};

// ✅ Initialize Firebase using compat mode
firebase.initializeApp(firebaseConfig);
const messaging = getMessaging(); // ✅ Initialize Messaging

export default function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        if (isMobilePWA()) {
          console.log("📱 Running as Mobile PWA. Registering service workers...");

          // ✅ Register caching service worker
          await navigator.serviceWorker.register("/service-worker.js");
          console.log("✅ Service Worker (Caching) Registered.");

          // ✅ Register Firebase Messaging Service Worker
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("✅ Service Worker (Firebase) Registered.");

          // ✅ Request notification permission & send FCM token to backend
          await requestNotificationPermission();
        } else {
          console.log("💻 Running on desktop or browser. Skipping FCM registration.");
        }
      } catch (error) {
        console.error("❌ Error registering service workers:", error);
      }
    });
  }
}

// ✅ Function to check if running as a Mobile PWA
function isMobilePWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches || // ✅ Installed PWA (Chrome, Safari)
    navigator.standalone === true || // ✅ Installed PWA (iOS Safari)
    (/android|iphone|ipad|ipod/i.test(navigator.userAgent) && "Notification" in window) // ✅ Mobile device with Notification API
  );
}

// ✅ Request permission and get FCM token (Only on Mobile PWA)
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("✅ Notification permission granted.");
      await getFCMToken();
    } else {
      console.warn("🚫 Notification permission denied.");
    }
  } catch (error) {
    console.error("❌ Error requesting notification permission:", error);
  }
}

// ✅ Retrieve FCM Token and Send to Personal Server
async function getFCMToken() {
  try {
    const token = await getToken(messaging);
    if (token) {
      console.log("✅ FCM Token:", token);
      await sendTokenToPersonalServer(token);
    } else {
      console.warn("🚫 No FCM token available. Request permission.");
    }
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
  }
}

// ✅ Send FCM Token to Personal Server
async function sendTokenToPersonalServer(token) {
  try {
    const response = await fetch("/api/register-fcm-token", {
      // ✅ Calls personal server
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fcmToken: token })
    });

    if (response.ok) {
      console.log("✅ FCM Token successfully sent to personal server.");
    } else {
      console.error("❌ Failed to send FCM token to personal server.");
    }
  } catch (error) {
    console.error("❌ Error sending FCM token:", error);
  }
}

// ✅ Listen for foreground push notifications
onMessage(messaging, (payload) => {
  console.log("📩 Foreground notification received:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new message",
    icon: "/icons/pwa-icon.png"
  };

  // ✅ Show system notification
  if (Notification.permission === "granted") {
    new Notification(notificationTitle, notificationOptions);
  } else {
    console.warn("🚫 Notifications blocked. Request permission in browser settings.");
  }
});
