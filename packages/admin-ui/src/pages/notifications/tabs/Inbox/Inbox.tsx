import SubTitle from "components/SubTitle";
import React from "react";
import Card from "components/Card";

import "./inbox.scss";
import { NotificationCard } from "./components/NotificationsCard";
import { useApi } from "api";
import Loading from "components/Loading";
import defaultAvatar from "img/defaultAvatar.png";
import dappnodeIcon from "img/dappnode-logo-only.png";

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
      dnp: "dappmanager.dnp.dappnode.eth",
      body: "This is a new notification"
    },
    {
      timestamp: "2025-06-06T13:00:00Z",
      title: "Validator exited sucesfully",
      dnp: "holesky-reth.dnp.dappnode.eth",
      body: "Execution client synced"
    }
  ];
  const seenNotifications: Notification[] = [
    {
      timestamp: "2021-06-01T12:00:00Z",
      title: "Execution client synced",
      dnp: "besu.public.dappnode.eth",
      body: "This is a seen notification"
    },
    {
      timestamp: "2021-06-01T12:00:00Z",
      title: "Execution client synced",
      dnp: "ipfs.dnp.dappnode.eth",
      body: "This is a seen notification"
    },
    {
      timestamp: "2021-06-01T12:00:00Z",
      title: "Seen Notification",
      dnp: "lighthouse-holesky.dnp.dappnode.eth",
      body: "This is a seen notification"
    },
    {
      timestamp: "2025-06-04T12:00:00Z",
      title: "Updated Telegram configuration",
      dnp: "lido-csm-holesky.dnp.dappnode.eth",
      body: "Your telegram configuration has been updated successfully"
    },
    {
      timestamp: "2025-06-04T12:00:00Z",
      title: "Relays configuration updated",
      dnp: "mev-boost.dnp.dappnode.eth",
      body: "Your relays configuration in mainnet has been updated successfully"
    },
    {
      timestamp: "2025-06-06T12:00:00Z",
      title: "Validator exit request",
      dnp: "lido-csm-holesky.dnp.dappnode.eth",
      body: "Your validator 10802082 has requested to exit the network. Executing automatic exit"
    }
  ];

  const dnpsRequest = useApi.packagesGet();
  const loading = dnpsRequest.isValidating;
  const installedDnps = dnpsRequest.data;
  const findPkgAvatar = (dnpName: string) => {
    const dnp = installedDnps?.find((dnp) => dnp.dnpName === dnpName);
    
    if (!dnp) {
      return defaultAvatar;
    } else if (dnp.isCore) {
      return dappnodeIcon;
    }
    return dnp.avatarUrl;
  };

  return loading ? (
    <Loading steps={["Loading data"]} />
  ) : (
    <>
      {newNotifications.length > 0 && (
        <>
          <SubTitle>New Notifications</SubTitle>
          {newNotifications.map((notification) => (
            <NotificationCard key={notification.timestamp} notification={notification} avatarUrl={findPkgAvatar(notification.dnp)} />
          ))}
        </>
      )}

      <SubTitle>History</SubTitle>
      {seenNotifications.length === 0 ? (
        <Card>No notifications</Card>
      ) : (
        seenNotifications.map((notification) => (
          <NotificationCard key={notification.timestamp} notification={notification} avatarUrl={findPkgAvatar(notification.dnp)} />
        ))
      )}
    </>
  );
}
