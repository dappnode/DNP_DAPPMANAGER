import { api } from "api";
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { initializePushNotifications } from "registerServiceWorker.js";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function Pwa() {
  const [notificationsGranted, setNotificationsGranted] = useState<NotificationPermission>("denied");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    // Check if PWA is already installed
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
        await initializePushNotifications();
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
      {!isPwaInstalled && deferredPrompt && (
        <Button type="button" onClick={handleInstall} variant="dappnode">
          Install PWA
        </Button>
      )}
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
