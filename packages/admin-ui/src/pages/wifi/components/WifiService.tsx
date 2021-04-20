// React
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
// Own components
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Switch from "components/Switch";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
// External components
import Badge from "react-bootstrap/esm/Badge";
import Alert from "react-bootstrap/esm/Alert";
// API
import { api, useApi } from "api";
import { continueIfCalleDisconnected } from "api/utils";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
// Types
import { ContainerState, WifiReport } from "types";
// css
import "./wifi.scss";
import RenderMarkdown from "components/RenderMarkdown";

const wifiDnpName = "wifi.dnp.dappnode.eth";

function WifiInfo({ wifiStatus }: { wifiStatus: ContainerState }) {
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);
  return (
    <p>
      Connect to your dappnode through the wifi hostpot exposed by your
      dappnode.
      <ol>
        <li>Scan your local network</li>
        <li>Connect to the wifi hostpot using your credentials</li>
        <li>
          Go to: <a href="http://my.dappnode/#/">http://my.dappnode/#/</a>
        </li>
      </ol>
      {dappnodeIdentity.internalIp === dappnodeIdentity.ip &&
      wifiStatus !== "running"
        ? "Having the same ips may mean that your dappnode is on a remote machine and does not require the wifi service"
        : null}
    </p>
  );
}

function WifiAlert({ wifiReport }: { wifiReport: WifiReport }) {
  return (
    <Alert
      dismissible
      variant={wifiReport.containerState === "running" ? "success" : "warning"}
    >
      <Alert.Heading>Report:</Alert.Heading>
      <p>
        {wifiReport.info}.{" "}
        <RenderMarkdown
          source={`~~~js\n${wifiReport.report?.lastLog}\n~~~` || ""}
        />
      </p>
      <hr />
    </Alert>
  );
}

function WifiStatus({ wifiStatus }: { wifiStatus: ContainerState }) {
  return (
    <h4>
      Wifi status{" "}
      <Badge
        variant={
          wifiStatus === "running"
            ? "success"
            : wifiStatus === ("restarting" || "paused" || "created")
            ? "info"
            : "warning"
        }
      >
        {wifiStatus}
      </Badge>
    </h4>
  );
}

export default function WifiService(): JSX.Element {
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
        if (wifiReport.data?.containerState === "running")
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
              wifiReport.data.containerState === "running"
                ? "Pausing wifi"
                : "Starting wifi",
            onSuccess:
              wifiReport.data.containerState === "running"
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
          <WifiInfo wifiStatus={wifiReport.data.containerState} />
          <hr />
          <div className="wifi-status">
            <WifiStatus wifiStatus={wifiReport.data.containerState} />
            <div className="wifi-actions">
              <Switch
                highlightOnHover
                checked={wifiReport.data.containerState === "running"}
                onToggle={pauseWifi}
                label={
                  wifiReport.data.containerState === "running" ? "On" : "Off"
                }
              ></Switch>
            </div>
          </div>
          <hr />
          <WifiAlert wifiReport={wifiReport.data} />
        </Card>
      ) : wifiReport.error ? (
        <ErrorView error={wifiReport.error} />
      ) : wifiReport.isValidating ? (
        <Loading steps={["Loading wifi service"]} />
      ) : null}
    </>
  );
}
