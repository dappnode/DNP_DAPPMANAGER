import React from "react";
import { NavLink } from "react-router-dom";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer/data";
import SubTitle from "components/SubTitle";
import Card from "components/Card";

import "./installNotifications.scss";

interface InstallNotificationsPkgProps {
  pkgName: string;
}

export const InstallNotificationsPkg: React.FC<InstallNotificationsPkgProps> = ({ pkgName }) => {
  const installerPath = getInstallerPath(pkgName);

  return (
    <Card className="install-notifications-card">
      <SubTitle>Install notifications package</SubTitle>
      <p>To receive notifications on your Dappnode, you must install the Notifications Dappnode Package.</p>
      <NavLink to={installerPath + "/" + pkgName}>
        <Button variant="dappnode">Install</Button>
      </NavLink>
    </Card>
  );
};
