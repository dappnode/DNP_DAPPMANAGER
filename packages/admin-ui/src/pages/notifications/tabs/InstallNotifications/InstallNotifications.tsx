import React from "react";
import { NavLink } from "react-router-dom";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer/data";
import SubTitle from "components/SubTitle";
import Card from "components/Card";

import "./installNotifications.scss";
import { notificationsDnpName } from "params";


export const InstallNotificationsPkg: React.FC = () => {
  const installerPath = getInstallerPath(notificationsDnpName);

  return (
    <Card className="install-notifications-card">
      <SubTitle>Install notifications package</SubTitle>
      <p>To receive notifications on your Dappnode, you must install the Notifications Dappnode Package.</p>
      <NavLink to={installerPath + "/" + notificationsDnpName}>
        <Button variant="dappnode">Install</Button>
      </NavLink>
    </Card>
  );
};
