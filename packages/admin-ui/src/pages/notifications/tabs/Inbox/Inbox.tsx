import SubTitle from "components/SubTitle";
import React from "react";
import Card from "components/Card";

import "./inbox.scss";
import { NotificationCard } from "./components/NotificationsCard";

export interface Notification {
  timestamp: string;
  title: string;
  dnp: string;
  body: string;
}

export function Inbox() {
  const newNotifications: Notification[] = [
    {
      timestamp: "2021-06-01T12:00:00Z",
      title: "New Notification",
      dnp: "package-name.dnp.dappnode.eth",
      body: "This is a new notification"
    },
    {
      timestamp: "2025-06-06T13:00:00Z",
      title: "Validator exited sucesfully",
      dnp: "lido-csm-mainnet.dnp.dappnode.eth",
      body: "Your validator 10802082 has entered the exit queue automatically. No manual action required"
    }
  ];
  const seenNotifications: Notification[] = [
    {
      timestamp: "2021-06-01T12:00:00Z",
      title: "Seen Notification",
      dnp: "package-name.dnp.dappnode.eth",
      body: "This is a seen notification"
    },
    {
      timestamp: "2025-06-04T12:00:00Z",
      title: "Updated Telegram configuration",
      dnp: "lido-csm-mainnet.dnp.dappnode.eth",
      body: "Your telegram configuration has been updated successfully"
    },
    {
      timestamp: "2025-06-06T12:00:00Z",
      title: "Validator exit request",
      dnp: "lido-csm-mainnet.dnp.dappnode.eth",
      body: "Your validator 10802082 has requested to exit the network. Executing automatic exit"
    }
  ];

  return (
    <>
      {newNotifications.length > 0 && (
        <>
          <SubTitle>New Notifications</SubTitle>
          {newNotifications.map((notification) => (
            <NotificationCard key={notification.timestamp} notification={notification} />
          ))}
        </>
      )}

      <SubTitle>History</SubTitle>
      {seenNotifications.length === 0 ? (
        <Card>No notifications</Card>
      ) : (
        seenNotifications.map((notification) => (
          <NotificationCard key={notification.timestamp} notification={notification} />
        ))
      )}
    </>
  );
}


