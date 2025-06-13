import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { useApi } from "api";
// Own module
import { subPaths, title } from "./data";
// Components
import Title from "components/Title";
import { renderResponse } from "components/SwrRender";
import { Inbox } from "./tabs/Inbox/Inbox";
import { NotificationsSettings } from "./tabs/Settings/Settings";
import { LegacyNotifications } from "./tabs/Legacy";
import { NoDnpInstalled } from "pages/packages/components/NoDnpInstalled";
import { notificationsDnpName } from "params";

export const NotificationsRoot: React.FC = () => {
  const notificationsPkgStatusRequest = useApi.notificationsPackageStatus();

  const InstallNotificationsPkg = () => (
    <NoDnpInstalled
      customCopy="To receive notifications on your Dappnode, you must install the Notifications Dappnode Package."
      id={notificationsDnpName}
    />
  );

  return renderResponse(notificationsPkgStatusRequest, ["Loading notifications"], (data) => {
    const availableRoutes: {
      name: string;
      subPath: string;
      component: React.ComponentType;
    }[] = [
      {
        name: "Inbox",
        subPath: subPaths.inbox,
        component: data.isInstalled ? Inbox : () => <InstallNotificationsPkg />
      },
      {
        name: "Settings",
        subPath: subPaths.settings,
        component: data.isInstalled ? NotificationsSettings : () => <InstallNotificationsPkg />
      },
      {
        name: "Legacy",
        subPath: subPaths.legacy,
        component: LegacyNotifications
      }
    ];

    return (
      <>
        <Title title={title} />

        <div className="horizontal-navbar">
          {availableRoutes.map((route) => (
            <button key={route.subPath} className="item-container">
              <NavLink to={route.subPath} className="item no-a-style" style={{ whiteSpace: "nowrap" }}>
                {route.name}
              </NavLink>
            </button>
          ))}
        </div>

        <div className="section-spacing">
          <Routes>
            {availableRoutes.map((route) => (
              <Route key={route.subPath} path={route.subPath} element={<route.component />} />
            ))}
          </Routes>
        </div>
      </>
    );
  });
};
