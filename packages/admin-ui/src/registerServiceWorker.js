/* eslint-disable no-undef */
import { api } from "api";

export async function initializePushNotifications() {
  try {
    const swRegistration = await registerServiceWorker();
    if (!swRegistration) return;

    const pushManager = swRegistration.pushManager;
    const permissionState = await pushManager.permissionState({ userVisibleOnly: true });

    switch (permissionState) {
      case "granted":
        console.log("Push permission granted.");
        await pushManager.getSubscription().then(async (subscription) => {
          if (subscription) {
            console.log("Existing subscription found:", subscription);
            await api.notificationsPostSubscription({ subscription });
          } else {
            console.log("No existing subscription. Requesting a new one...");
            const newSubscription = await subscribeToPush(swRegistration);
            await api.notificationsPostSubscription({ subscription: newSubscription });
          }
        });
        break;
      case "prompt":
        console.log("Push permission is not granted yet.");
        break;
      case "denied":
        console.warn("Push permission is denied.");
        break;
      default:
        console.error("Unknown push permission state:", permissionState);
    }
  } catch (error) {
    console.error("Error initializing push notifications:", error);
  }
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
    const VAPID_PUBLIC_KEY = await api.notificationsGetVapidPublicKey();
    if (!VAPID_PUBLIC_KEY) {
      console.error("Failed to retrieve VAPID public key.");
      return;
    }

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log("New Subscription:", subscription);
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
