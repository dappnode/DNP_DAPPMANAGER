// React
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
// API
import { api, useApi } from "api";
// Own components
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Card from "components/Card";
import Switch from "components/Switch";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { avahiFriendlyName, avahiLocalDomain } from "params";
import { StateBadgeAvahiDaemon } from "pages/packages/components/StateBadge/StateBadgeAvahiDaemon";
import { MdWifi } from "react-icons/md";

function AvahiInfo() {
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);
  return (
    <p>
      Use the Local Network Discovery service and connect to your DAppNode by
      connecting your device to the same router as your DAppNode. Go to{" "}
      <a href={avahiLocalDomain}>http://my.dappnode.local</a>
      {dappnodeIdentity.internalIp === dappnodeIdentity.ip &&
        "Local and public IPs are equal. This may be due to dappnode is running on a remote machine and does not require Local Network Discovery."}
    </p>
  );
}

export default function LocalNetworkStatus(): JSX.Element {
  const avahiStatus = useApi.avahiStatusGet();

  useEffect(() => {
    const interval = setInterval(() => {
      avahiStatus.revalidate();
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [avahiStatus]);

  async function enableDisableAvahi(): Promise<void> {
    try {
      if (avahiStatus.data) {
        const avahiRunning = avahiStatus.data.avahiStatus === "started";
        if (avahiRunning)
          await new Promise<void>(resolve => {
            confirm({
              title: `Pause Local Network Discovery service`,
              text: `Warning, if you are connected to your DAppNode through Local Network Discovery you may lose access to your DAppNode. Make sure to have an alternative way to connect to it, like a VPN connection.`,
              label: "Pause",
              onClick: resolve
            });
          });

        await withToast(
          () => api.avahiEnableDisable(!avahiRunning),

          {
            message: avahiRunning
              ? "Pausing Local Network Discovery service"
              : "Starting Local Network Discovery service",
            onSuccess: avahiRunning
              ? "Paused Local Network Discovery service"
              : "Started Local Network Discovery service"
          }
        );

        avahiStatus.revalidate();
      }
    } catch (e) {
      console.error("Error on start/stop Local Network Discovery service");
    }
  }

  return (
    <>
      {avahiStatus.data ? (
        <Card spacing>
          <AvahiInfo />
          <hr />
          <div className="wifi-avahi-status-actions-row">
            <div className="wifi-avahi-status-container">
              <StateBadgeAvahiDaemon
                avahiStatusType={avahiStatus.data.avahiStatus}
              />
              <MdWifi className="wifi-avahi-status-icon" />
              <span className="wifi-avahi-status-name">
                {avahiFriendlyName}
              </span>
            </div>
            <div className="wifi-avahi-actions">
              <Switch
                checked={avahiStatus.data.avahiStatus === "started"}
                onToggle={enableDisableAvahi}
                label={
                  avahiStatus.data.avahiStatus === "started" ? "On" : "Off"
                }
              ></Switch>
            </div>
          </div>
        </Card>
      ) : avahiStatus.isValidating ? (
        <Loading steps={["Loading Local Network Discovery..."]} />
      ) : avahiStatus.error ? (
        <ErrorView error={avahiStatus.error} />
      ) : null}
    </>
  );
}
