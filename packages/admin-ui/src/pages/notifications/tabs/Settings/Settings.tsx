import SubTitle from "components/SubTitle";
import React, { useEffect, useState } from "react";
import Switch from "components/Switch";
import { ManagePackageNotifications } from "./ManagePackageNotifications.js";
import { api, useApi } from "api";
import { CustomEndpoint, GatusEndpoint } from "@dappnode/types";
import "./settings.scss";
import { notificationsDnpName } from "params.js";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import { continueIfCalleDisconnected } from "api/utils";

interface EndpointsData {
  [dnpName: string]: {
    endpoints: GatusEndpoint[];
    customEndpoints: CustomEndpoint[];
    isCore: boolean;
  };
}

export function NotificationsSettings() {
  const [notificationsDisabled, setNotificationsDisabled] = useState<boolean>(false);
  const [endpointsData, setEndpointsData] = useState<EndpointsData | undefined>();
  const endpointsCall = useApi.notificationsGetAllEndpoints();
  const notificationsDnp = useApi.packageGet({ dnpName: notificationsDnpName });

  useEffect(() => {
    // Fetch the latest endpoints data when the component is mounted
    if (endpointsCall.data) {
      setEndpointsData(endpointsCall.data as EndpointsData);
    }
  }, [endpointsCall.data]);

  useEffect(() => {
    if (notificationsDnp.data) {
      console.log("notificationsDnp.data", notificationsDnp.data);

      const isStopped = notificationsDnp.data.containers.some((c) => c.state !== "running");
      console.log("isStopped", isStopped);

      setNotificationsDisabled(isStopped);
    }
  }, [notificationsDnp.data]);

  async function startStopNotifications(): Promise<void> {
    try {
      if (notificationsDnp.data) {
        if (!notificationsDisabled)
          await new Promise<void>((resolve) => {
            confirm({
              title: `Pause notifications package`,
              text: `Attention, the notifications package may alert you to critical issues if they arise. Pausing this package could result in missing important notifications.`,
              label: "Pause",
              onClick: resolve
            });
          });

        await withToast(
          continueIfCalleDisconnected(
            () => api.packageStartStop({ dnpName: notificationsDnpName }),
            notificationsDnpName
          ),
          {
            message: notificationsDisabled ? "Enabling notifications" : "Disabling notifications",
            onSuccess: notificationsDisabled ? "Notifications Enabled" : "Notifications disabled"
          }
        );

        notificationsDnp.revalidate();
      }
    } catch (e) {
      console.error(`Error on start/stop notifications package: ${e}`);
    }
  }

  return (
    <div className="notifications-settings">
      <div>
        <div className="title-switch-row">
          <SubTitle className="notifications-section-title">Enable notifications</SubTitle>
          <Switch
            checked={!notificationsDisabled}
            disabled={notificationsDnp.isValidating}
            onToggle={() => {
              startStopNotifications();
            }}
          />
        </div>
        <div>Enable notifications to retrieve a registry of notifications on your Dappnode.</div>
      </div>
      <br />
      {!notificationsDisabled && !notificationsDnp.isValidating && (
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
