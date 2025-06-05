import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import RenderMarkdown from "components/RenderMarkdown";
import Button, { ButtonVariant } from "components/Button";
import { api, useApi } from "api";
import { Notification, Priority } from "@dappnode/types";
import "./notificationsMain.scss";
import { MdClose } from "react-icons/md";
import { Accordion } from "react-bootstrap";
import { dappmanagerAliases, externalUrlProps } from "params";

/**
 * Displays banner notifications among all tabs
 */
export default function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const numOfBannersShown = 3; // Number of banners that will be shown in the UI

  // gets the timestamp of one month ago in UNIX format
  const oneMonthAgoTimestamp = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return Math.floor(now.getTime() / 1000); // Convert to seconds
  }, []);

  const notificationsCall = useApi.notificationsGetBanner(oneMonthAgoTimestamp);

  useEffect(() => {
    if (notificationsCall.data) {
      setNotifications(filterNotifications(notificationsCall.data));
    }
  }, [notificationsCall.data]);

  /**
   * filters notifications:
   * 1. Filters out notifications that have errors
   * 2. Filters out duplicate notifications by correlationId, keeping the most recent one
   * 3. Filters out resolved notifications
   * 4. Filters out seen notifications
   * 5. Sorts notifications by priority
   */

  function filterNotifications(notifications: Notification[]): Notification[] {
    const priorityOrder = [Priority.critical, Priority.high, Priority.medium, Priority.low];

    const map = new Map<string, Notification>();

    notifications
      .filter((n) => !n.errors) // Filter out notifications with errors
      .forEach((notification) => {
        const existing = map.get(notification.correlationId);

        if (!existing || new Date(notification.timestamp) > new Date(existing.timestamp)) {
          map.set(notification.correlationId, notification);
        }
      });

    return Array.from(map.values())
      .filter((n) => n.status === "triggered") // Filter out resolved notifications
      .filter((n) => n.seen === false) // Filter out seen notifications
      .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));
  }

  return (
    notifications &&
    notifications.length > 0 && (
      <div className="banner-notifications-col">
        {notifications.slice(0, numOfBannersShown).map((notification) => (
          <CollapsableBannerNotification
            notification={notification}
            key={notification.id}
            onClose={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
          />
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

export function CollapsableBannerNotification({
  notification,
  onClose
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(notification.priority === Priority.critical);
  const [hasClosed, setHasClosed] = useState(false);

  const handleClose = () => {
    api.notificationSetSeenByCorrelationID(notification.correlationId);
    setHasClosed(true);
    onClose();
  };

  const isExternalUrl =
    notification.callToAction && !dappmanagerAliases.some((alias) => notification.callToAction!.url.includes(alias));

  return (
    !hasClosed && (
      <Accordion defaultActiveKey={isOpen ? "0" : "1"}>
        <Accordion.Toggle
          as={"div"}
          eventKey="0"
          onClick={() => setIsOpen(!isOpen)}
          className={`banner-card ${notification.priority}-priority`}
        >
          <div className="banner-header">
            <h5>{notification.title}</h5>
            <button className="close-btn" onClick={handleClose}>
              <MdClose />
            </button>
          </div>
          <Accordion.Collapse eventKey="0">
            <div className="banner-body">
              <RenderMarkdown source={notification.body} />
              {notification.callToAction && (
                <NavLink to={notification.callToAction.url} {...(isExternalUrl ? externalUrlProps : {})}>
                  <Button variant={priorityBtnVariants[notification.priority]}>
                    <div className="btn-text">{notification.callToAction.title}</div>
                  </Button>
                </NavLink>
              )}
            </div>
          </Accordion.Collapse>
        </Accordion.Toggle>
      </Accordion>
    )
  );
}
