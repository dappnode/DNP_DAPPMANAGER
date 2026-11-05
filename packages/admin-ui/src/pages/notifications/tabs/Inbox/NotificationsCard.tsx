import React, { useEffect, useState } from "react";
import { Accordion, useAccordionButton } from "react-bootstrap";
import { Notification } from "@dappnode/types";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { prettyDnpName } from "utils/format";
import dappnodeLogo from "img/dappnode-logo-only.png";
import { Priority } from "@dappnode/types";
import RenderMarkdown from "components/RenderMarkdown";
import Button from "components/Button";
import { NavLink } from "react-router-dom";
import { api } from "api";
import { dappmanagerAliases, externalUrlProps } from "params";
import { resolveDappnodeUrl } from "utils/resolveDappnodeUrl";

interface NotificationCardProps {
  notification: Notification;
  openByDefault?: boolean;
}

const priorityLabels: Record<Priority, string> = {
  [Priority.low]: "Informational",
  [Priority.medium]: "Relevant",
  [Priority.high]: "Important",
  [Priority.critical]: "Critical"
};

const prettifiedBody = (body: string) => {
  if (body.includes("resolved: ")) return body.replace("resolved:", "Resolved:");
  else if (body.includes("triggered: ")) return body.replace("triggered:", "Attention:");
  else return body;
};

export function NotificationCard({ notification, openByDefault = false }: NotificationCardProps) {
  const notificationAvatar = () => (notification.icon ? notification.icon : dappnodeLogo);
  const [isOpen, setIsOpen] = useState(openByDefault);

  useEffect(() => {
    if (!notification.seen && notification.isBanner && notification.status === "resolved") {
      api.notificationSetSeenByCorrelationID({ correlationId: notification.correlationId });
    }
  }, []);

  const isExternalUrl =
    notification.callToAction && !dappmanagerAliases.some((alias) => notification.callToAction!.url.includes(alias));

  const toggle = useAccordionButton("0", () => setIsOpen((v) => !v));

  return (
    <Accordion activeKey={isOpen ? "0" : undefined}>
      <Accordion.Item eventKey="0">
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle(e);
            }
          }}
          className="notification-card"
        >
          <div className="notification-header">
            <img className="avatar" src={notificationAvatar()} alt={notification.dnpName} />
            <div className="notification-header-data">
              <div className="notification-header-row secondary-text">
                <div className="notification-name-row">
                  <div>{prettyDnpName(notification.dnpName)}</div>
                  <div className="labels-wrapper">
                    <div className="category-label">
                      {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                    </div>
                    <div className={`${notification.priority}-label`}>{priorityLabels[notification.priority]}</div>
                    {notification.status === "resolved" && <div className="resolved-label">Resolved</div>}
                  </div>
                </div>

                <i>
                  {new Date(notification.timestamp * 1000).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </i>
              </div>
              <div className="notification-header-row ">
                <div className="notification-title">{notification.title}</div>
                {isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
              </div>
            </div>
          </div>

          <Accordion.Body>
            <div className="notification-body">
              <RenderMarkdown source={prettifiedBody(notification.body)} />
              {notification.callToAction && (
                <NavLink
                  to={resolveDappnodeUrl(notification.callToAction.url, window.location)}
                  {...(isExternalUrl ? externalUrlProps : {})}
                >
                  <Button variant="dappnode">
                    <div>{notification.callToAction.title}</div>
                  </Button>
                </NavLink>
              )}
            </div>
          </Accordion.Body>
        </div>
      </Accordion.Item>
    </Accordion>
  );
}
