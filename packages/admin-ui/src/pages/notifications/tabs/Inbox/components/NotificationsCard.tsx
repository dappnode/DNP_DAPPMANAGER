import React, { useState } from "react";
import { Accordion } from "react-bootstrap";
import { Notification } from "../Inbox";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

interface NotificationCardProps {
  notification: Notification;
  avatarUrl: string;
}

export function NotificationCard({ notification, avatarUrl }: NotificationCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Accordion defaultActiveKey={isOpen ? "0" : "1"}>
      <Accordion.Toggle as={"div"} eventKey="0" onClick={() => setIsOpen(!isOpen)} className="notification-card">
        <div className="notification-header">
          <img className="avatar" src={avatarUrl} alt={notification.dnp} />
          <div className="notification-header-data">
            <div className="notification-header-row secondary-text">
              <div>{notification.dnp}</div>
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
