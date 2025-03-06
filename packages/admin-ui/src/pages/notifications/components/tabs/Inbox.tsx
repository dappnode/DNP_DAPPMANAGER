import SubTitle from "components/SubTitle";
import React, { useState } from "react";
import Card from "components/Card";
import { Accordion } from "react-bootstrap";

import "../notifications.scss";

interface Notification {
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
      dnp: "package-name.dnp.dappnode.eth",
      body: "This is a new notification"
    },
    {
      timestamp: "2025-06-06T13:00:00Z",
      title: "Validator exited sucesfully",
      dnp: "lido-csm-mainnet.dnp.dappnode.eth",
      body: "Your validator 10802082 has entered the exit queue automatically. No manual action required"
    }
  ];
  const seenNotifications: Notification[] = [
    {
      timestamp: "2021-06-01T12:00:00Z",
      title: "Seen Notification",
      dnp: "package-name.dnp.dappnode.eth",
      body: "This is a seen notification"
    },
    {
      timestamp: "2025-06-04T12:00:00Z",
      title: "Updated Telegram configuration",
      dnp: "lido-csm-mainnet.dnp.dappnode.eth",
      body: "Your telegram configuration has been updated successfully"
    },
    {
      timestamp: "2025-06-06T12:00:00Z",
      title: "Validator exit request",
      dnp: "lido-csm-mainnet.dnp.dappnode.eth",
      body: "Your validator 10802082 has requested to exit the network. Executing automatic exit"
    }
  ];

  return (
    <>
      {newNotifications.length > 0 && (
        <>
          <SubTitle>New Notifications</SubTitle>
          {newNotifications.map((notification) => (
            <NotificationCard key={notification.timestamp} notification={notification} />
          ))}
        </>
      )}

      <SubTitle>History</SubTitle>
      {seenNotifications.length === 0 ? (
        <Card>No notifications</Card>
      ) : (
        seenNotifications.map((notification) => (
          <NotificationCard key={notification.timestamp} notification={notification} />
        ))
      )}
    </>
  );
}

function NotificationCard({ notification }: { notification: Notification }) {
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
