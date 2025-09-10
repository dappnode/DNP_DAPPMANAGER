import React from "react";
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
import { Subscriptions } from "./tabs/Devices";
import { RouteType } from "types";
import { SectionNavigator } from "components/SectionNavigator";

export const NotificationsRoot: React.FC = () => {
  const notificationsPkgStatusRequest = useApi.notificationsPackageStatus();

  const InstallNotificationsPkg = () => (
    <NoDnpInstalled
      customCopy="To receive notifications on your Dappnode, you must install the Notifications Dappnode Package."
      id={notificationsDnpName}
    />
  );

  return renderResponse(notificationsPkgStatusRequest, ["Loading notifications"], (data) => {
    const availableRoutes: RouteType[] = [
      {
        name: "Inbox",
        subPath: subPaths.inbox,
        element: data.isInstalled ? <Inbox /> : <InstallNotificationsPkg />
      },
      {
        name: "Settings",
        subPath: subPaths.settings,
        element: data.isInstalled ? <NotificationsSettings /> : <InstallNotificationsPkg />
      },
      {
        name: "Devices",
        subPath: subPaths.devices,
        element: data.isInstalled ? <Subscriptions /> : <InstallNotificationsPkg />
      },
      {
        name: "Legacy",
        subPath: subPaths.legacy,
        element: <LegacyNotifications />
      }
    ];

    return (
      <>
        <Title title={title} />
        <SectionNavigator routes={availableRoutes} />
      </>
    );
  });
};
