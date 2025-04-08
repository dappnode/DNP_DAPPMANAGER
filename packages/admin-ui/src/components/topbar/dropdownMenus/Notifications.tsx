import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Icons
import { FaRegBell } from "react-icons/fa";

export default function Notifications() {
  const [newNotifications, setNewNotifications] = useState(false);

  const navigate = useNavigate();

  //TODO: Check notifier endpoint that returns if there are new notifications, and set newNotifications state
  useEffect(() => {
    console.log("Notifications check");
    setInterval(() => {
      console.log("Notifications check");
    }, 30000);
  }, []);

  return (
    <div onClick={() => navigate("/notifications/inbox")} className="tn-dropdown tn-dropdown-toggle">
      <FaRegBell size={"1.4em"} />
      {newNotifications && <div className={`icon-bubble success`} />}
    </div>
  );
}
