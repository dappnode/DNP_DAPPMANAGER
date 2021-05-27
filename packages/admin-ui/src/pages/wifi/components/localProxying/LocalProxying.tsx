// React
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
// API
import { api, useApi } from "api";
import { ReqStatus } from "types";
// Own components
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Card from "components/Card";
import Switch from "components/Switch";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { adminUiLocalDomain, docsUrlLocalProxy } from "params";
import { StateBadge } from "pages/packages/components/StateBadge";
import { MdWifi } from "react-icons/md";
import { parseContainerState } from "pages/packages/components/StateBadge/utils";
import { AvahiPublishCmdStatusType, LocalProxyingStatus } from "common";

export function LocalProxying(): JSX.Element {
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const localProxyingStatus = useApi.localProxyingStatusGet();
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);

  useEffect(() => {
    const interval = setInterval(() => {
      localProxyingStatus.revalidate();
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [localProxyingStatus]);

  async function localProxyingEnableDisable(): Promise<void> {
    try {
      if (!localProxyingStatus.data) return;
      if (reqStatus.loading) return;

      const localProxyingEnabled = isLocalProxyEnabled(
        localProxyingStatus.data
      );
      if (localProxyingEnabled)
        await new Promise<void>(resolve => {
          confirm({
            title: `Stopping Local Network Proxy`,
            text: `Warning, if you are connected to your DAppNode through Local Network Proxy you may lose access to your DAppNode. Make sure to have an alternative way to connect to it, like WiFi or a VPN connection.`,
            label: "Pause",
            onClick: resolve
          });
        });

      setReqStatus({ loading: true });
      await withToast(
        () => api.localProxyingEnableDisable(!localProxyingEnabled),
        {
          message: localProxyingEnabled
            ? "Stopping Local Network Proxy..."
            : "Starting Local Network Proxy",
          onSuccess: localProxyingEnabled
            ? "Stopped Local Network Proxy..."
            : "Started Local Network Proxy"
        }
      );
      setReqStatus({ result: true });

      localProxyingStatus.revalidate();
    } catch (e) {
      setReqStatus({ error: e });
      console.error("Error on start/stop Local Network Proxy", e);
    }
  }

  return (
    <>
      {localProxyingStatus.data ? (
        <Card spacing>
          <p>
            If you are connected to the same router as your DAppNode you can use
            this page at{" "}
            <a href={adminUiLocalDomain}>http://my.dappnode.local</a>. Learn
            more about the Local Network Proxy at:{" "}
            <a href={docsUrlLocalProxy}>{docsUrlLocalProxy}</a>
          </p>
          {dappnodeIdentity.internalIp === dappnodeIdentity.ip && (
            <p>
              Local and public IPs are equal. This may be due to dappnode is
              running on a remote machine and does not require Local Network
              Proxy.
            </p>
          )}
          <hr />

          <div className="wifi-local-status-actions-row">
            <div className="wifi-local-status-container">
              <StateBadge
                {...parseAvahiPublishCmdState(
                  localProxyingStatus.data.avahiPublishCmdState
                )}
              />
              <MdWifi className="wifi-local-status-icon" />
              <span className="wifi-local-status-name">
                Local Network Proxy
              </span>
            </div>

            <div className="wifi-local-actions">
              <Switch
                checked={isLocalProxyEnabled(localProxyingStatus.data)}
                onToggle={localProxyingEnableDisable}
                disabled={reqStatus.loading}
                label={
                  isLocalProxyEnabled(localProxyingStatus.data) ? "On" : "Off"
                }
              ></Switch>
            </div>
          </div>
        </Card>
      ) : localProxyingStatus.isValidating ? (
        <Loading steps={["Loading Local Network Proxy..."]} />
      ) : localProxyingStatus.error ? (
        <ErrorView error={localProxyingStatus.error} />
      ) : null}
    </>
  );
}

/**
 * Helper to ensure all display logic shows the same "enabled" status.
 * Note that local proxying involves multiple components which can be on / off.
 */
function isLocalProxyEnabled(status: LocalProxyingStatus): boolean {
  return status.localProxyingEnabled;
}

export function parseAvahiPublishCmdState(
  state: LocalProxyingStatus["avahiPublishCmdState"]
): ReturnType<typeof parseContainerState> {
  switch (state.status) {
    case AvahiPublishCmdStatusType.started:
      return { variant: "success", state: "running", title: "Running" };
    case AvahiPublishCmdStatusType.stopped:
      return { variant: "secondary", state: "stopped", title: "Paused" };
    case AvahiPublishCmdStatusType.crashed:
      return {
        variant: "danger",
        state: "crashed",
        title: `Exited: ${state.error}`
      };
  }
}
