import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { initializePushNotifications } from "registerServiceWorker.js";

export default function Pwa() {
  // Disable the button if permission is already granted
  const [notificationsGranted, setNotificationsGranted] = useState(Notification.permission === "granted");

  console.log("notificationsGranted", notificationsGranted);

  const handleGrantNotifications = async () => {
    try {
      // Directly request permission from the user on click
      const permissionResult = await Notification.requestPermission();
      if (permissionResult === "granted") {
        await initializePushNotifications();
        setNotificationsGranted(true);
      } else {
        console.warn("Notification permission was denied.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  return (
    <Button type="button" onClick={handleGrantNotifications} variant="dappnode">
      Grant notifications
    </Button>
  );
}
