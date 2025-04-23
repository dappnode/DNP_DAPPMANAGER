import React, { useState } from "react";
import { Accordion } from "react-bootstrap";
import { Notification } from "@dappnode/types";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { prettyDnpName } from "utils/format";
import defaultAvatar from "img/defaultAvatar.png";

interface NotificationCardProps {
  notification: Notification;
  openByDefault?: boolean;
}

export function NotificationCard({ notification, openByDefault = false }: NotificationCardProps) {
  const [isOpen, setIsOpen] = useState(openByDefault);

  const notificationAvatar = () => {
    if (notification.icon) return notification.icon;
    else return defaultAvatar;
  };

  return (
    <Accordion defaultActiveKey={isOpen ? "0" : "1"}>
      <Accordion.Toggle as={"div"} eventKey="0" onClick={() => setIsOpen(!isOpen)} className="notification-card">
        <div className="notification-header">
          <img className="avatar" src={notificationAvatar()} alt={notification.dnpName} />
          <div className="notification-header-data">
            <div className="notification-header-row secondary-text">
              <div className="notification-name-row">
                <div>{prettyDnpName(notification.dnpName)}</div>
                <div className={`${notification.priority}-label`}>{notification.priority}</div>
                {notification.body.includes("resolved: ") && <div className="sucess-label">Resolved</div>}
              </div>

              <i>{new Date(notification.timestamp).toLocaleString()}</i>
            </div>
            <div className="notification-header-row ">
              <div className="notification-title">{notification.title}</div>
              {isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </div>
          </div>
        </div>
        <Accordion.Collapse eventKey="0">
          <div className="notification-body">{notification.body}</div>
        </Accordion.Collapse>
      </Accordion.Toggle>
    </Accordion>
  );
}
