import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import RenderMarkdown from "components/RenderMarkdown";
import Button from "components/Button";
import { useApi } from "api";
import { Notification, Priority, Status } from "@dappnode/types";
import "./notificationsMain.scss";

/**
 * Displays banner notifications among all tabs
 */
export default function NotificationsView() {

  // gets the timestamp of one month ago in ISO format
  const oneMonthAgoTimestamp = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return now.toISOString().split(".")[0] + "Z";
  }, []);

  const notifications = useApi.notificationsGetBanner(oneMonthAgoTimestamp);

  /**
   *filters notifications:
   * 1. Filters out notifications that are not triggered
   * 2. Filters out duplicate notifications by title, keeping the most recent one
   * 3. Sorts notifications by priority
   */

  function filterNotifications(notifications: Notification[]): Notification[] {
    const priorityOrder = [Priority.critical, Priority.high, Priority.medium, Priority.low];

    const map = new Map<string, Notification>();

    notifications
      .filter((n) => n.status === Status.triggered)
      .forEach((notification) => {
        const existing = map.get(notification.title);

        if (!existing || new Date(notification.timestamp) > new Date(existing.timestamp)) {
          map.set(notification.title, notification);
        }
      });

    return Array.from(map.values()).sort(
      (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    );
  }

  return (
    notifications.data &&
    notifications.data.length > 0 && (
      <div className="banner-notifications-col">
        {filterNotifications(notifications.data).map((notification) => (
          <BannerNotification notification={notification} key={notification.title} />
        ))}
      </div>
    )
  );
}

function BannerNotification({ notification }: { notification: Notification }) {
  return (
    <div className={`banner-card ${notification.priority}-priority`}>
      <h5>{notification.title}</h5>
      <div className="notification-body">
        <RenderMarkdown source={notification.body} />
        {notification.callToAction && (
          <NavLink to={notification.callToAction.url}>
            <Button variant="dappnode">{notification.callToAction.title}</Button>
          </NavLink>
        )}
      </div>
    </div>
  );
}
