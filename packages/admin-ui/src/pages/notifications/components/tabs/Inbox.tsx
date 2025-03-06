import SubTitle from "components/SubTitle";
import React from "react";
import Card from "components/Card";

interface Notification {
  timestamp: string;
  title: string;
  dnp: string;
  body: string;
}

export default function Inbox() {
  const newNotifications: Notification[] = [
    {
      timestamp: "2021-06-01T12:00:00Z",
      title: "New Notification",
      dnp: "package-name.dnp.dappnode.eth",
      body: "This is a new notification"
    }
  ];
  const seenNotifications: Notification[] = [
    {
      timestamp: "2021-06-01T12:00:00Z",
      title: "Seen Notification",
      dnp: "package-name.dnp.dappnode.eth",
      body: "This is a seen notification"
    }
  ];
  return (
    <>
      {newNotifications.length > 0 && (
        <>
          <SubTitle>New Notifications</SubTitle>
          {newNotifications.map((notification) => (
            <Card key={notification.timestamp}>
              <div>{new Date(notification.timestamp).toLocaleString()}</div>
              <div>{notification.title}</div>
              <div>{notification.dnp}</div>
              <div>{notification.body}</div>
            </Card>
          ))}
        </>
      )}

      <SubTitle>History</SubTitle>
      {seenNotifications.length === 0 ? (
        <Card>No notifications</Card>
      ) : (
        seenNotifications.map((notification) => (
          <Card key={notification.timestamp}>
            <div>{new Date(notification.timestamp).toUTCString()}</div>
            <div>{notification.title}</div>
            <div>{notification.dnp}</div>
            <div>{notification.body}</div>
          </Card>
        ))
      )}
    </>
  );
}
