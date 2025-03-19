import SubTitle from "components/SubTitle";
import React from "react";
import Card from "components/Card";
import "./inbox.scss";
import { NotificationCard } from "./NotificationsCard";
import { useApi } from "api";
import Loading from "components/Loading";
import defaultAvatar from "img/defaultAvatar.png";
import dappnodeIcon from "img/dappnode-logo-only.png";

export function Inbox() {
  const dnpsRequest = useApi.packagesGet();
  const notifications = useApi.notificationsGetAll();
  const newNotifications = notifications.data
    ?.filter((notification) => !notification.seen)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const seenNotifications = notifications.data
    ?.filter((notification) => notification.seen)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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


  console.log('notis', notifications.data);
  
  return loading ? (
    <Loading steps={["Loading data"]} />
  ) : (
    <>
      {newNotifications && newNotifications.length > 0 && (
        <>
          <SubTitle>New Notifications</SubTitle>
          {newNotifications.map((notification) => (
            <NotificationCard
              key={notification.timestamp}
              notification={notification}
              avatarUrl={findPkgAvatar(notification.dnpName)}
            />
          ))}
        </>
      )}

      <SubTitle>History</SubTitle>
      {!seenNotifications || seenNotifications.length === 0 ? (
        <Card>No notifications</Card>
      ) : (
        seenNotifications.map((notification) => (
          <NotificationCard
            key={notification.timestamp}
            notification={notification}
            avatarUrl={findPkgAvatar(notification.dnpName)}
          />
        ))
      )}
    </>
  );
}
