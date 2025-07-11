// src/hooks/usePushSubscription.ts
import { api, useApi } from "api";
import { useState, useEffect, useCallback } from "react";
import { Category, NotifierSubscription, Priority, Status } from "@dappnode/types";
import useDeviceInfo from "./useDeviceInfo";

interface UseHandleSubscriptionResult {
  subscription: PushSubscription | null;
  subscriptionsList: NotifierSubscription[] | null;
  isSubscribing: boolean;
  isSubInNotifier: boolean;
  permission: NotificationPermission | null;
  permissionLoading: boolean;
  requestPermission: () => void;
  subscribeBrowser: () => Promise<void>;
  deleteSubscription: (endpoint: string) => Promise<void>;
  revalidateSubs: () => Promise<boolean>;
}

export function useHandleSubscription(): UseHandleSubscriptionResult {
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [subscriptionsList, setSubscriptionsList] = useState<NotifierSubscription[] | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [isSubInNotifier, setIsSubInNotifier] = useState<boolean>(false);
  const [permissionLoading, setPermissionLoading] = useState<boolean>(false);

  const [permission, setPermission] = useState<NotificationPermission | null>(Notification.permission);

  const vapidKeyReq = useApi.notificationsGetVapidKey();
  const subscriptionsReq = useApi.notificationsGetSubscriptions();
  const revalidateSubs = () => subscriptionsReq.revalidate();

  const { device, browser, os } = useDeviceInfo();

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
    if (subscriptionsReq.data !== undefined) {
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
    setPermissionLoading(true);
    Notification.requestPermission().then((permission) => {
      setPermission(permission);
      if (permission === "granted" && vapidKey) {
        subscribeBrowser();
      } else if (permission === "denied") {
        console.error("Notification permission denied");
      }
      setPermissionLoading(false);
    });
  };

  const deleteSubscription = async (endpoint: string) => {
    console.log("Deleting subscription for endpoint:", endpoint);
    if (subscription?.endpoint === endpoint) {
      await subscription.unsubscribe(); // Unsubscribe from PushManager
      setSubscription(null); // Clear local subscription state
    }

    if (subscriptionsList?.find((sub) => sub.endpoint === endpoint)) {
      await api.notificationsDeleteSubscription({ endpoint });
      subscriptionsReq.revalidate();
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
      setIsSubscribing(true);

      // Wait for SW to be active
      const registration = await navigator.serviceWorker.ready;

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

      const alias = `${device} - ${browser} ${browser === "Unknown" ? "Browser" : ""}on ${os} ${
        os === "Unknown" ? "OS" : ""
      }`;
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
      await api.notificationsPostSubscription({ subscription: subscriptionWithAlias });
      subscriptionsReq.revalidate();

      await api.notificationsSendCustom({
        notificationPayload: {
          title: `New device subscribed!`,
          dnpName: "dappmanager.dnp.dappnode.eth",
          body: `New device subscribed to push notifications system: ${alias}`,
          category: Category.system,
          priority: Priority.low,
          status: Status.triggered,
          isBanner: false,
          isRemote: false,
          correlationId: "dappmanager-push-subcription"
        }
      });
    } catch (err) {
      console.error("Subscribe error:", err);
    } finally {
      setIsSubscribing(false);
    }
  }, [vapidKey, device, browser, os]);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const raw = window.atob(base64);
    return new Uint8Array(Array.from(raw, (c) => c.charCodeAt(0)));
  }

  return {
    permission,
    permissionLoading,
    subscription,
    isSubscribing,
    isSubInNotifier,
    deleteSubscription,
    requestPermission,
    subscriptionsList,
    subscribeBrowser,
    revalidateSubs
  };
}
