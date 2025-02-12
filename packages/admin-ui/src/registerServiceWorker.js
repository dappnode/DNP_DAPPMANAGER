/* eslint-disable no-undef */
import firebase from "firebase/compat/app"; // ✅ Use full compat mode
import "firebase/compat/messaging"; // ✅ Import messaging compat mode
import { getMessaging, getToken } from "firebase/messaging"; // ✅ Import messaging methods

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
        // ✅ Register the caching service worker
        await navigator.serviceWorker.register("/service-worker.js");
        console.log("✅ Service Worker (Caching) Registered.");

        // ✅ Register the Firebase Messaging Service Worker
        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("✅ Service Worker (Firebase) Registered.");

        // ✅ Request notification permission
        await requestNotificationPermission();
      } catch (error) {
        console.error("❌ Error registering service workers:", error);
      }
    });
  }
}

// ✅ Request permission and get FCM token
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

// ✅ Retrieve FCM Token without VAPID Key (for mobile PWAs)
async function getFCMToken() {
  try {
    const token = await getToken(messaging); // ✅ Use messaging instance

    if (token) {
      console.log("✅ FCM Token:", token);
      await sendTokenToBackend(token);
    } else {
      console.warn("🚫 No FCM token available. Request permission.");
    }
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
  }
}

// ✅ Send FCM token to backend
async function sendTokenToBackend(token) {
  try {
    const response = await fetch("https://your-backend.com/register-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    if (response.ok) {
      console.log("✅ FCM Token successfully sent to backend.");
    } else {
      console.error("❌ Failed to send FCM token to backend.");
    }
  } catch (error) {
    console.error("❌ Error sending FCM token:", error);
  }
}
