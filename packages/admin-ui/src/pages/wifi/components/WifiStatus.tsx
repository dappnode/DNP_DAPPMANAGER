// React
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
// Own components
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Switch from "components/Switch";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
// API
import { api, useApi } from "api";
import { continueIfCalleDisconnected } from "api/utils";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
// Types
import { ContainerState, WifiReport } from "types";
// css
import "./wifi.scss";
import { StateBadgeContainer } from "pages/packages/components/StateBadge";
import { MdWifi } from "react-icons/md";
// Utils
import { prettyDnpName } from "utils/format";

const wifiDnpName = "wifi.dnp.dappnode.eth";

function WifiInfo({ wifiStatus }: { wifiStatus: ContainerState }) {
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);
  return (
    <p>
      Connect to the Wi-Fi hostpot exposed by your DAppNode using your{" "}
      <a href="http://my.dappnode/#/wifi/credentials">credentials</a>. More
      information available at:{" "}
      <a href="https://docs.dappnode.io/connect/#via-wifi">
        https://docs.dappnode.io/connect/#via-wifi
      </a>
      {dappnodeIdentity.internalIp === dappnodeIdentity.ip &&
      wifiStatus !== "running"
        ? "Local an public IPs are equal. This may be due to dappnode is running on a remote machine and does not require Wi-Fi."
        : null}
    </p>
  );
}

function WifiLog({ wifiReport }: { wifiReport: WifiReport }) {
  return (
    <>
      <hr />
      <p>{wifiReport.info}</p>

      {wifiReport.report ? (
        <div className="error-stack">
          {`${wifiReport.report.lastLog}. Exit code: ${wifiReport.report.exitCode}`}
        </div>
      ) : null}
    </>
  );
}

export default function WifiStatus(): JSX.Element {
  const wifiReport = useApi.wifiReportGet();

  useEffect(() => {
    const interval = setInterval(() => {
      wifiReport.revalidate();
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [wifiReport]);

  async function pauseWifi(): Promise<void> {
    try {
      if (wifiReport.data) {
        if (wifiReport.data.wifiContainer.state === "running")
          await new Promise<void>(resolve => {
            confirm({
              title: `Pause wifi service`,
              text: `Warning, if you are connected to your DAppNode's WIFI you may lose access to your DAppNode. Make sure to have an alternative way to connect to it, like a VPN connection.`,
              label: "Pause",
              onClick: resolve
            });
          });

        await withToast(
          continueIfCalleDisconnected(
            () => api.packageStartStop({ dnpName: wifiDnpName }),
            wifiDnpName
          ),
          {
            message:
              wifiReport.data.wifiContainer.state === "running"
                ? "Pausing wifi"
                : "Starting wifi",
            onSuccess:
              wifiReport.data.wifiContainer.state === "running"
                ? "Paused wifi"
                : "Started wifi"
          }
        );

        wifiReport.revalidate();
      }
    } catch (e) {
      console.error("Error on start/stop wifi package");
    }
  }

  return (
    <>
      {wifiReport.data ? (
        <Card spacing>
          <WifiInfo wifiStatus={wifiReport.data.wifiContainer.state} />
          <hr />
          <div className="wifi">
            <div className="wifi-status">
              <StateBadgeContainer container={wifiReport.data.wifiContainer} />
              <MdWifi className="wifi-status-icon" />
              <NavLink
                className="wifi-status-name"
                to="http://my.dappnode/#/packages/wifi.dnp.dappnode.eth"
              >
                {prettyDnpName(wifiReport.data.wifiContainer.dnpName)}
              </NavLink>
            </div>
            <div className="wifi-actions">
              <Switch
                checked={wifiReport.data.wifiContainer.state === "running"}
                onToggle={pauseWifi}
                label={
                  wifiReport.data.wifiContainer.state === "running"
                    ? "On"
                    : "Off"
                }
              ></Switch>
            </div>
          </div>

          {wifiReport.data.wifiContainer.state !== "running" ? (
            <WifiLog wifiReport={wifiReport.data} />
          ) : null}
        </Card>
      ) : wifiReport.error ? (
        <ErrorView error={wifiReport.error} />
      ) : wifiReport.isValidating ? (
        <Loading steps={["Loading wifi service"]} />
      ) : null}
    </>
  );
}
