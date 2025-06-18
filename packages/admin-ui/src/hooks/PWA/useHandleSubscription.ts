// src/hooks/usePushSubscription.ts
import { api, useApi } from "api";
import { useState, useEffect, useCallback } from "react";

interface UseHandleSubscriptionResult {
  subscription: PushSubscription | null;
  subscriptionsList: PushSubscription[] | null;
  isSubInNotifier: boolean;
  permission: NotificationPermission | null;
  requestPermission: () => void;
  deleteSubscription: (endpoint: string) => Promise<void>;
}

export function useHandleSubscription(): UseHandleSubscriptionResult {
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [subscriptionsList, setSubscriptionsList] = useState<PushSubscription[] | null>(null);

  const [isSubInNotifier, setIsSubInNotifier] = useState<boolean>(false);

  const [permission, setPermission] = useState<NotificationPermission | null>(Notification.permission);

  const vapidKeyReq = useApi.notificationsGetVapidKey();
  const subscriptionsReq = useApi.notificationsGetSubscriptions();

  useEffect(() => {
    const getSub = async () => {
      const registartion = await navigator.serviceWorker.ready;
      const sub = await registartion.pushManager.getSubscription();
      setSubscription(sub);
    };

    getSub();
  }, []);

  useEffect(() => {
    if (vapidKeyReq.data) {
      setVapidKey(vapidKeyReq.data);
    }
  }, [vapidKeyReq.data]);

  useEffect(() => {
    if (subscriptionsReq.data) {
      setSubscriptionsList(subscriptionsReq.data);
    }
  }, [subscription, subscriptionsReq.data]);

  useEffect(() => {
    // Check if the subscription exists in notifier
    if (subscription) {
      setIsSubInNotifier(subscriptionsList?.find((sub) => sub.endpoint === subscription.endpoint) ? true : false);
    } else {
      setIsSubInNotifier(false);
    }
  }, [subscription, subscriptionsList]);

  const requestPermission = () => {
    Notification.requestPermission().then((permission) => {
      setPermission(permission);
    });
  };

  useEffect(() => {
    console.log("Notification permission changed:", permission);

    if (permission === "granted" && vapidKey) {
      subscribeBrowser();
    } else if (permission === "denied") {
      console.error("Notification permission denied");
    }
  }, [vapidKey, permission, setIsSubInNotifier]);

  const deleteSubscription = async (endpoint: string) => {
    console.log("0");

    console.log("1");

    console.log(subscription?.endpoint);
    console.log(endpoint);
    console.log(subscription?.endpoint === endpoint);

    if (subscription?.endpoint === endpoint) {
      console.log("2");
      await subscription.unsubscribe(); // Unsubscribe from PushManager
      console.log("3");
      setSubscription(null); // Clear local subscription state
    }

    if (subscriptionsList?.find((sub) => sub.endpoint === endpoint)) {
      console.log("4");
      await api.notificationsDeleteSubscription(endpoint);
      console.log("5");
    }
    console.log("6");
  };

  const subscribeBrowser = useCallback(async () => {
    if (!vapidKey) {
      console.error("No VAPID key yet");
      return;
    }
    if (Notification.permission !== "granted") {
      console.error("Permission not granted");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.error("SW or Push not supported");
      return;
    }

    try {
      // Wait for SW to be active
      const registration = await navigator.serviceWorker.ready;
      console.log("SW ready:", registration);

      console.log("Current subscription:", subscription);
      console.log("Is subscription in notifier:", isSubInNotifier);

      // Clean up any old subscription
      if (subscription && !isSubInNotifier) {
        console.log("Deleting old subscription");
        deleteSubscription(subscription.endpoint);
      }

      // Convert + validate VAPID key
      const applicationServerKey = urlBase64ToUint8Array(vapidKey.trim());
      if (applicationServerKey.byteLength !== 65) {
        throw new Error("Invalid VAPID key length");
      }

      // Subscribe
      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      console.log("New subscription:", newSub);

      // const res = await fetch("http://notifier.notifications.dappnode:8081/api/v1/subscriptions", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(newSub)
      // });
      // console.log("Subscription response:", res);

      // Posting new sub to notifier
      await api.notificationsPostSubscription(newSub);

      setSubscription(newSub);
    } catch (err) {
      console.error("Subscribe error:", err);
    }
  }, [vapidKey]);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const raw = window.atob(base64);
    return new Uint8Array(Array.from(raw, (c) => c.charCodeAt(0)));
  }

  return {
    permission,
    subscription,
    isSubInNotifier,
    deleteSubscription,
    requestPermission,
    subscriptionsList
  };
}
