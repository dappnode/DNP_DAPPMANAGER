/* eslint-disable no-undef */
import { api } from "api";

export async function initializePushNotifications() {
  try {
    const swRegistration = await registerServiceWorker();
    if (!swRegistration) return;

    const pushManager = swRegistration.pushManager;
    const permissionState = await pushManager.permissionState({ userVisibleOnly: true });

    if (permissionState === "granted") {
      console.log("Push permission granted.");
      await subscribeForPush(pushManager, swRegistration);
    } else if (permissionState === "prompt") {
      console.log("Push permission is not granted yet. Requesting permission...");
      const permissionResult = await Notification.requestPermission();
      if (permissionResult === "granted") {
        console.log("Permission granted after prompt.");
        await subscribeForPush(pushManager, swRegistration);
      } else {
        console.warn("Push permission request denied by user.");
      }
    } else if (permissionState === "denied") {
      console.warn("Push permission is denied.");
    } else {
      console.error("Unknown push permission state:", permissionState);
    }
  } catch (error) {
    console.error("Error initializing push notifications:", error);
  }
}

async function subscribeForPush(pushManager, swRegistration) {
  await pushManager.getSubscription().then(async (subscription) => {
    if (subscription) {
      console.log("Existing subscription found:", subscription);
      await api.notificationsPostSubscription({ subscription });
    } else {
      console.log("No existing subscription. Requesting a new one...");
      const newSubscription = await subscribeToPush(swRegistration);
      if (newSubscription) {
        await api.notificationsPostSubscription({ subscription: newSubscription });
      }
    }
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker is not supported in this browser.");
    return null;
  }

  try {
    let swRegistration = await navigator.serviceWorker.getRegistration();

    // If no registration exists, register a new one
    if (!swRegistration) {
      console.log("Registering Service Worker...");
      swRegistration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered:", swRegistration);
    }

    return swRegistration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

async function subscribeToPush(swRegistration) {
  try {
    const VAPID_PUBLIC_KEY = (await api.notificationsGetVapidPublicKey()).publicKey;
    if (!VAPID_PUBLIC_KEY) {
      console.error("Failed to retrieve VAPID public key.");
      return;
    }

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log("New Subscription:", subscription);
    return subscription;
  } catch (error) {
    console.error("Push subscription failed:", error);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}
