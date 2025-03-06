import React, { useState } from "react";
import { Accordion } from "react-bootstrap";
import { Notification } from "../Inbox";

export function NotificationCard({ notification }: { notification: Notification }) {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <Accordion defaultActiveKey={isOpen ? "0" : "1"} >
        <Accordion.Toggle as={"div"} eventKey="0" onClick={() => setIsOpen(!isOpen)} className="notification-card">
          <div className="notification-header">
            <div className="notification-img"> IMG </div>
            <div className="notification-header-data">
              <div className="notification-header-details">
                <div>{notification.dnp}</div>
                <div>{new Date(notification.timestamp).toLocaleString()}</div>
              </div>
              <div className="notification-title">{notification.title}</div>
            </div>
          </div>
          <Accordion.Collapse eventKey="0">
            <div className="notification-body">{notification.body}</div>
          </Accordion.Collapse>
        </Accordion.Toggle>{" "}
      </Accordion>
    );
  }