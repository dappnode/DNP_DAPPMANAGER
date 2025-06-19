// src/hooks/usePushSubscription.ts
import { api, useApi } from "api";
import { UAParser } from "ua-parser-js";
import { useState, useEffect, useCallback } from "react";
import { Category, NotifierSubscription, Priority, Status } from "@dappnode/types";

interface UseHandleSubscriptionResult {
  subscription: PushSubscription | null;
  subscriptionsList: NotifierSubscription[] | null;
  isSubInNotifier: boolean;
  permission: NotificationPermission | null;
  requestPermission: () => void;
  subscribeBrowser: () => Promise<void>;
  deleteSubscription: (endpoint: string) => Promise<void>;
}

export function useHandleSubscription(): UseHandleSubscriptionResult {
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [subscriptionsList, setSubscriptionsList] = useState<NotifierSubscription[] | null>(null);

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
    if (permission === "granted" && vapidKey) {
      subscribeBrowser();
    } else if (permission === "denied") {
      console.error("Notification permission denied");
    }
  };

  const deleteSubscription = async (endpoint: string) => {
    console.log("Deleting subscription for endpoint:", endpoint);
    if (subscription?.endpoint === endpoint) {
      await subscription.unsubscribe(); // Unsubscribe from PushManager
      setSubscription(null); // Clear local subscription state
    }

    if (subscriptionsList?.find((sub) => sub.endpoint === endpoint)) {
      await api.notificationsDeleteSubscription(endpoint);
      console.log("Subscription deleted from notifier");
    }
    console.log("Subscription deletion process completed");
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
      setSubscription(newSub);
      console.log("New subscription:", newSub);

      // Build a human-readable alias from user agent
      const parser = new UAParser();
      const { device, browser, os } = parser.getResult();
      const vendorModel = device.vendor && device.model ? `${device.vendor} ${device.model}` : "";
      const typeLabel = device.type || "desktop";
      const rawLabel = vendorModel || typeLabel;
      const deviceLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
      const browserName = browser.name || "";
      const browserMajor = browser.version?.split(".")[0] || "";
      const osName = os.name || "";
      const osVersion = os.version || "";
      const alias = `${deviceLabel} - ${browserName} ${browserMajor} on ${osName} ${osVersion}`;

      // Attach alias and send the subscription object to notifier
      const newSubJson = newSub.toJSON();
      if (!newSubJson.endpoint || !newSubJson.keys) {
        throw new Error("Invalid subscription object");
      }
      const subscriptionWithAlias: NotifierSubscription = {
        ...newSubJson,
        alias
      };

      console.log("Subscription with alias:", subscriptionWithAlias);
      await api.notificationsPostSubscription(subscriptionWithAlias);
      subscriptionsReq.revalidate();

      await api.notificationsSendCustom({
        title: `New device subscribed!`,
        dnpName:'dappmanager.dnp.dappnode.eth',
        body: `New device subscribed to push notifications system: ${alias}`,
        category: Category.system,
        priority: Priority.low,
        status: Status.triggered,
        isBanner: false,
        isRemote: false,
        correlationId: "dappmanager-push-subcription"
      })
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
    subscriptionsList,
    subscribeBrowser
  };
}
