import React from "react";
import Button from "components/Button";
import { useNavigate } from "react-router-dom";
import { pathName as notisPathName, subPaths as notisSubpaths } from "pages/notifications";
import "./advancedNotifications.scss";
import { Card } from "react-bootstrap";
import { relativePath } from "../data";

export function AdvancedNotifications({ isActivated }: { isActivated: boolean }) {
  const settingsTabUrl = `/${notisPathName}/${notisSubpaths.settings}`;
  const devicesTabUrl = `/${notisPathName}/${notisSubpaths.devices}`;

  const navigate = useNavigate();

  return (
    <div>
      <Card>
        <div className="premium-notifications-cont">
          <div>
            <p>
              Only Premium users receive <b>push notifications</b> about your hardware and validator performance in the
              subscribed devices (mobile and computer).
            </p>

            {isActivated ? (
              <div>Set up your preferred notifications and manage your devices.</div>
            ) : (
              <div>Activate Premium to receive push notifications.</div>
            )}
          </div>

          <div className="premium-notifications-actions">
            {isActivated ? (
              <>
                {" "}
                <Button variant="dappnode" onClick={() => navigate(settingsTabUrl)}>
                  Set up notifications
                </Button>
                <Button variant="dappnode" onClick={() => navigate(devicesTabUrl)}>
                  Manage Devices
                </Button>
              </>
            ) : (
              <>
                <Button variant="dappnode" onClick={() => navigate("/" + relativePath)}>
                  Activate Premium
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
