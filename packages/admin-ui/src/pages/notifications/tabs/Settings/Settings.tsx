import SubTitle from "components/SubTitle";
import React, { useEffect, useState } from "react";
import Switch from "components/Switch";
import { ManagePackageNotifications } from "./ManagePackageNotifications.js";
import { useApi } from "api";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import "./settings.scss";

interface EndpointsData {
  [dnpName: string]: {
    endpoints: GatusEndpoint[];
    customEndpoints: CustomEndpoint[];
    isCore: boolean;
  };
}

export function NotificationsSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [endpointsData, setEndpointsData] = useState<EndpointsData | undefined>();
  const endpointsCall = useApi.notificationsGetEndpoints();

  useEffect(() => {
    // Fetch the latest endpoints data when the component is mounted
    if (endpointsCall.data) {
      setEndpointsData(endpointsCall.data as EndpointsData);
    }
  }, [endpointsCall.data]);

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
            {endpointsData &&
              Object.entries(endpointsData).map(([dnpName, endpoints]) => (
                <ManagePackageNotifications
                  key={dnpName}
                  dnpName={dnpName}
                  gatusEndpoints={endpoints.endpoints}
                  customEndpoints={endpoints.customEndpoints}
                  isCore={endpoints.isCore}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
