import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { useApi } from "api";
// Own module
import { subPaths, title } from "./data";
import { InstallNotificationsPkg } from "./tabs/InstallNotifications/InstallNotifications";
// Components
import Title from "components/Title";
import { renderResponse } from "components/SwrRender";
import { Inbox } from "./tabs/Inbox/Inbox";
import { NotificationsSettings } from "./tabs/Settings/Settings";
import { notificationsPkgName } from "params";

export const NotificationsRoot: React.FC = () => {
  const availableRoutes: {
    name: string;
    subPath: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType;
  }[] = [
    {
      name: "Inbox",
      subPath: subPaths.inbox,
      component: Inbox
    },
    {
      name: "Settings",
      subPath: subPaths.settings,
      component: NotificationsSettings
    }
  ];

  const dnpsRequest = useApi.packagesGet();

  return renderResponse(dnpsRequest, ["Loading notifications"], (dnps) => {
    const isNotificationsPkgInstalled = dnps?.some((dnp) => dnp.dnpName === notificationsPkgName);

    return (
      <>
        <Title title={title} />
        {!isNotificationsPkgInstalled ? (
          <InstallNotificationsPkg pkgName={notificationsPkgName} />
        ) : (
          <>
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
        )}
      </>
    );
  });
};
