import React from "react";
import SubTitle from "components/SubTitle";
import Button from "components/Button";
import Card from "components/Card";
import { useNavigate } from "react-router-dom";
import { pathName as notisPathName, subPaths as notisSubpaths } from "pages/notifications";

export function AdvancedNotifications() {
  const settingsTabUrl = `/${notisPathName}/${notisSubpaths.settings}`;
  const devicesTabUrl = `/${notisPathName}/${notisSubpaths.devices}`;

  const navigate = useNavigate();

  return (
    <div>
      <Card>
        <SubTitle>Advanced Notifications</SubTitle>
        <p>
          Only Premium users receive push notifications about your hardware and validator performance in the subscribed
          devices (mobile and computer). Set up your preferred notifications and manage your devices.{" "}
        </p>

        <div>
          <Button variant="dappnode" onClick={() => navigate(settingsTabUrl)}>
            Set up notifications
          </Button>
          <Button variant="dappnode" onClick={() => navigate(devicesTabUrl)}>
            Manage Devices
          </Button>
        </div>
      </Card>
    </div>
  );
}
