import { api } from "api";

export async function initializePushNotifications(): Promise<void> {
  try {
    const swRegistration = await registerServiceWorker();
    if (!swRegistration) return;
    await subscribeForPush(swRegistration);
  } catch (error) {
    console.error("Error initializing push notifications:", error);
  }
}

async function subscribeForPush(swRegistration: ServiceWorkerRegistration): Promise<void> {
  try {
    const pushManager = swRegistration.pushManager;
    const existingSubscription = await pushManager.getSubscription();

    if (existingSubscription) {
      console.log("Existing subscription found:", existingSubscription);

      // Ask backend if the subscription is still valid
      const backendSubscription = await api.notificationsGetSubscription({ subscription: existingSubscription });

      if (backendSubscription) {
        console.log("Subscription is still valid. No need to resubscribe.");
        return;
      }

      console.log("Subscription not found in the server. Unsubscribing...");
      await existingSubscription.unsubscribe();
    }

    console.log("Requesting a new subscription...");
    const newSubscription = await subscribeToPush(swRegistration);

    if (newSubscription) {
      console.log("New subscription obtained:", newSubscription);
      await api.notificationsPostSubscription({ subscription: newSubscription });
    }
  } catch (error) {
    console.error("Error subscribing for push notifications:", error);
  }
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker is not supported in this browser.");
    return null;
  }

  try {
    let swRegistration = await navigator.serviceWorker.getRegistration();
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

async function subscribeToPush(swRegistration: ServiceWorkerRegistration): Promise<PushSubscription | undefined> {
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
    return subscription;
  } catch (error) {
    console.error("Push subscription failed:", error);
    return undefined;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}
