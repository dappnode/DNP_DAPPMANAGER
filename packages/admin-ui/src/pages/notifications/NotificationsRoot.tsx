import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { useApi } from "api";
// Own module
import { title, subPaths } from "./data";
import { Inbox } from "./tabs/Inbox/Inbox";
import { NotificationsSettings } from "./tabs/Settings/Settings";
import { InstallNotificationsPkg } from "./tabs/InstallNotifications/InstallNotifications";
// Components
import Title from "components/Title";
import Loading from "components/Loading";

export const NotificationsRoot: React.FC = () => {
  const availableRoutes: {
    name: string;
    subPath: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: () => React.JSX.Element;
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
  const loading = dnpsRequest.isValidating;
  const installedDnps = dnpsRequest.data;

  const notificationsDnpName = "notifications.public.dappnode.eth";
  const isNotificationsPkgInstalled = installedDnps?.some((dnp) => dnp.dnpName === notificationsDnpName);

  return (
    <>
      <Title title={title} />
      {loading ? (
        <Loading steps={["Loading data"]} />
      ) : !isNotificationsPkgInstalled ? (
        <InstallNotificationsPkg pkgName={notificationsDnpName} />
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
};
