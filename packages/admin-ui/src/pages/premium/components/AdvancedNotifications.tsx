import React from "react";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";
import { pathName as notisPathName, subPaths as notisSubpaths } from "pages/notifications";
import "./advancedNotifications.scss";
import { Card } from "react-bootstrap";

export function AdvancedNotifications() {
  const settingsTabUrl = `/${notisPathName}/${notisSubpaths.settings}`;
  const devicesTabUrl = `/${notisPathName}/${notisSubpaths.devices}`;

  const navigate = useNavigate();

  return (
    <div>
      <Card>
        <div className="premium-notifications-cont">
          <p>
            Only Premium users receive push notifications about your hardware and validator performance in the
            subscribed devices (mobile and computer). <br /> Set up your preferred notifications and manage your
            devices.{" "}
          </p>

          <div className="premium-notifications-actions">
            <Button variant="dappnode" onClick={() => navigate(settingsTabUrl)}>
              Set up notifications
            </Button>
            <Button variant="dappnode" onClick={() => navigate(devicesTabUrl)}>
              Manage Devices
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
