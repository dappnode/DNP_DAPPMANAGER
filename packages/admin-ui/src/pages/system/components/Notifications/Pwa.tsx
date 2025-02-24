import { api } from "api";
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { initializePushNotifications } from "registerServiceWorker.js";

// Optionally, if using TypeScript, you can define the BeforeInstallPromptEvent interface:
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function Pwa() {
  // State for notification permission
  const [notificationsGranted, setNotificationsGranted] = useState<NotificationPermission>("denied");
  // State to hold the deferred install prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Listen for the beforeinstallprompt event to capture the install prompt
  useEffect(() => {
    const beforeInstallPromptHandler = (e: Event) => {
      e.preventDefault();
      console.log("beforeinstallprompt fired", e);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    };
  }, []);

  // Handler for the Install PWA button
  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.warn("Install prompt is not available.");
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log("User response to the install prompt:", outcome);
    // Clear the prompt so it can only be used once
    setDeferredPrompt(null);
  };

  const handleGrantNotifications = async () => {
    try {
      // Request notification permission from the user
      const permissionResult = await Notification.requestPermission();
      if (permissionResult === "granted") {
        await initializePushNotifications();

        // Inform the user that notifications are now enabled
        await api.notificationsPostNewNotification({
          title: "Notifications enabled",
          body: "You will now receive notifications from dappnode."
        });
      } else {
        console.warn("Notification permission was denied.");
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
      <Button type="button" onClick={handleInstall} variant="dappnode">
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
