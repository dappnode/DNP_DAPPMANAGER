import SubTitle from "components/SubTitle";
import React, { useState } from "react";
import Switch from "components/Switch";
import { ManagePackageNotifications } from "./ManagePackageNotifications.js";
import { useApi } from "api";
import "./settings.scss";

export function NotificationsSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const endpointsCall = useApi.notificationsGetEndpoints();

  return (
    <div className="notifications-settings">
      <div>
        <div className="title-switch-row">
          <SubTitle className="notifications-section-title">Enable notifications</SubTitle>
          <Switch
            checked={notificationsEnabled}
            onToggle={() => {
              setNotificationsEnabled(!notificationsEnabled);
            }}
          />
        </div>
        <div>Enable notifications to retrieve a registry of notifications on your Dappnode.</div>
      </div>
      <br />
      {notificationsEnabled && (
        <div>
          <SubTitle className="notifications-section-title">Manage notifications</SubTitle>
          <div>Enable, disable and customize notifications individually.</div>
          <br />
          <div className="manage-notifications-wrapper">
            {endpointsCall.data &&
              Object.entries(endpointsCall.data).map(([dnpName, endpoints]) => (
                <ManagePackageNotifications
                  key={dnpName}
                  dnpName={dnpName}
                  gatusEndpoints={endpoints.endpoints}
                  customEndpoints={endpoints.customEndpoints}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
