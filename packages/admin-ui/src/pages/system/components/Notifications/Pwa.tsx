import { api } from "api";
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { registerServiceWorker } from "registerServiceWorker.js";

async function subscribeForPush(): Promise<void> {
  try {
    const swRegistration = await registerServiceWorker();
    if (!swRegistration) {
      console.error("Service Worker registration failed.");
      return;
    }
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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function Pwa() {
  const [notificationsGranted, setNotificationsGranted] = useState<NotificationPermission>("denied");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Check if permissions are granted
  useEffect(() => {
    const checkNotificationsPermission = async () => {
      const permission = await Notification.requestPermission();
      setNotificationsGranted(permission);
    };

    checkNotificationsPermission();
  }, []);

  // Check if PWA is already installed
  useEffect(() => {
    const checkPwaInstalled = () => {
      setIsPwaInstalled(window.matchMedia("(display-mode: standalone)").matches);
    };

    checkPwaInstalled();
    window.addEventListener("appinstalled", checkPwaInstalled);

    return () => {
      window.removeEventListener("appinstalled", checkPwaInstalled);
    };
  }, []);

  useEffect(() => {
    const beforeInstallPromptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("User response to the install prompt:", outcome);
    setDeferredPrompt(null);
  };

  const handleGrantNotifications = async () => {
    try {
      const permissionResult = await Notification.requestPermission();
      if (permissionResult === "granted") {
        await subscribeForPush();
        await api.notificationsPostNewNotification({
          title: "Notifications enabled",
          body: "You will now receive notifications from dappnode."
        });
      }
      setNotificationsGranted(permissionResult);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await api.notificationsPostNewNotification({
        title: "Test notification",
        body: "This is a test notification."
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  };

  return (
    <>
      <Button type="button" onClick={handleInstall} disabled={isPwaInstalled && !deferredPrompt} variant="dappnode">
        Install PWA
      </Button>

      <Button
        type="button"
        onClick={handleGrantNotifications}
        disabled={notificationsGranted === "granted"}
        variant="dappnode"
      >
        Grant notifications
      </Button>
      <Button type="button" onClick={handleSendTestNotification} variant="dappnode">
        Send test notification
      </Button>
    </>
  );
}
