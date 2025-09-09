import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Icons
import { FaRegBell } from "react-icons/fa";
import { useApi } from "api";

export default function Notifications() {
  const unseenNotificationsReq = useApi.notificationsGetUnseenCount();
  const [newNotifications, setNewNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      unseenNotificationsReq.revalidate();
    }, 60 * 1000); // Updates the new notifications "blue dot" every minute

    return () => {
      clearInterval(interval);
    };
  }, [unseenNotificationsReq]);

  useEffect(() => {
    if (unseenNotificationsReq.data !== undefined) {
      setNewNotifications(unseenNotificationsReq.data > 0);
    }
  }, [unseenNotificationsReq.data]);

  return (
    <div onClick={() => navigate("/notifications/inbox")} className="tn-dropdown tn-dropdown-toggle">
      <FaRegBell size={"1.4em"} />
      {newNotifications && <div className={`icon-bubble success`} />}
    </div>
  );
}
