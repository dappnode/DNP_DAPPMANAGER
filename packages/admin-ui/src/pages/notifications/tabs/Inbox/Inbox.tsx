import SubTitle from "components/SubTitle";
import React, { useMemo, useState } from "react";
import Card from "components/Card";
import "./inbox.scss";
import { NotificationCard } from "./NotificationsCard";
import { useApi } from "api";
import { Searchbar } from "components/Searchbar";
import Loading from "components/Loading";
import defaultAvatar from "img/defaultAvatar.png";
import dappnodeIcon from "img/dappnode-logo-only.png";

export function Inbox() {
  const dnpsRequest = useApi.packagesGet();
  const notifications = useApi.notificationsGetAll();
  
  const [search, setSearch] = useState("");
  const filteredNotifications = useMemo(() => {
    if (!notifications.data) return [];

    return notifications.data.filter(
      (notification) =>
        notification.title.toLowerCase().includes(search.toLowerCase()) ||
        notification.dnpName.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, notifications.data]);

  const newNotifications = filteredNotifications
    ?.filter((notification) => !notification.seen)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const seenNotifications = filteredNotifications
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

  console.log("filtered notis", filteredNotifications);

  return loading ? (
    <Loading steps={["Loading data"]} />
  ) : (
    <>
      <Searchbar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by package name or notification title..." />

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
