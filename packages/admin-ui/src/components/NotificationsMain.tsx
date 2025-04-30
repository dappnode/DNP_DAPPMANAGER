import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import RenderMarkdown from "components/RenderMarkdown";
import Button, { ButtonVariant } from "components/Button";
import { useApi } from "api";
import { Notification, Priority, Status } from "@dappnode/types";
import "./notificationsMain.scss";
import { MdClose } from "react-icons/md";

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
   * 1. Filters out notifications that are not triggered or have errors
   * 2. Filters out duplicate notifications by title, keeping the most recent one
   * 3. Sorts notifications by priority
   */

  function filterNotifications(notifications: Notification[]): Notification[] {
    const priorityOrder = [Priority.critical, Priority.high, Priority.medium, Priority.low];

    const map = new Map<string, Notification>();

    notifications
      .filter((n) => n.status === Status.triggered && !n.errors)
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

const priorityBtnVariants: Record<Priority, ButtonVariant> = {
  [Priority.low]: "dappnode",
  [Priority.medium]: "dappnode",
  [Priority.high]: "warning",
  [Priority.critical]: "danger"
};

function BannerNotification({ notification }: { notification: Notification }) {
  return (
    <div className={`banner-card ${notification.priority}-priority`}>
      <div className="banner-header">
        <h5>{notification.title}</h5>
        <button className="close-btn">
          <MdClose />
        </button>
      </div>
      <div className="banner-body">
        <RenderMarkdown source={notification.body} />
        {notification.callToAction && (
          <NavLink to={notification.callToAction.url}>
            <Button variant={priorityBtnVariants[notification.priority]}>{notification.callToAction.title}</Button>
          </NavLink>
        )}
      </div>
    </div>
  );
}
