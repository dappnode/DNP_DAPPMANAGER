// React
import React, { useEffect } from "react";
// Own components
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
// External components
import Badge from "react-bootstrap/esm/Badge";
import Alert from "react-bootstrap/esm/Alert";
// API
import { api, useApi } from "api";
import { continueIfCalleDisconnected } from "api/utils";
// Types
import { WifiReport } from "types";
// css
import "./wifi.scss";
import { ContainerState } from "common";

const wifiDnpName = "wifi.dnp.dappnode.eth";

function RenderWifiStatus({ wifiReport }: { wifiReport: WifiReport }) {
  return (
    <>
      <div className="wifi-status">
        <h4>
          Wifi status{" "}
          <Badge
            variant={
              wifiReport.containerState === "running"
                ? "success"
                : wifiReport.containerState ===
                  ("restarting" || "paused" || "created")
                ? "info"
                : "warning"
            }
          >
            {wifiReport.containerState}
          </Badge>
        </h4>

        <ActionsWifi wifiStatus={wifiReport.containerState} />
      </div>

      <hr />

      <Alert
        dismissible
        variant={
          wifiReport.containerState === "running" ? "success" : "warning"
        }
      >
        <Alert.Heading>Report:</Alert.Heading>
        <p>{`${wifiReport.info}. ${wifiReport.report?.lastLog}`}</p>
        <hr />
      </Alert>
    </>
  );
}

function ActionsWifi({ wifiStatus }: { wifiStatus: ContainerState }) {
  async function restartWifi() {
    await new Promise<void>(resolve => {
      confirm({
        title: `Restart wifi service`,
        text: `Warming, you may loose connection to your dappnode during wifi restart`,
        label: "Restart",
        onClick: resolve
      });
    });

    withToast(
      continueIfCalleDisconnected(
        () => api.packageRestart({ dnpName: wifiDnpName }),
        wifiDnpName
      )
    );
  }

  async function pauseWifi() {
    if (wifiStatus === "running")
      await new Promise<void>(resolve => {
        confirm({
          title: `Pause wifi service`,
          text: `Warming, you may loose connection to your dappnode if stopping this service`,
          label: "Pause",
          onClick: resolve
        });
      });

    withToast(
      continueIfCalleDisconnected(
        () => api.packageStartStop({ dnpName: wifiDnpName }),
        wifiDnpName
      )
    );
  }

  return (
    <div className="wifi-actions">
      <Button
        variant="warning"
        onClick={() => restartWifi().catch(console.error)}
      >
        Restart wifi
      </Button>
      <Button
        variant="warning"
        onClick={() => pauseWifi().catch(console.error)}
      >
        {wifiStatus === "running" ? "Pause" : "Start"}
      </Button>
    </div>
  );
}

export default function WifiService() {
  const wifiReport = useApi.wifiReportGet();

  useEffect(() => {
    const interval = setInterval(() => {
      wifiReport.revalidate();
    }, 20 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [wifiReport]);

  return (
    <>
      {wifiReport.error ? (
        <ErrorView error={wifiReport.error} />
      ) : wifiReport.isValidating ? (
        <Loading steps={["Loading wifi service"]} />
      ) : wifiReport.data ? (
        <>
          <Card spacing>
            <p>
              Connect to your dappnode through the wifi hostpot exposed by your
              dappnode.
              <ol>
                <li>Scan your local network</li>
                <li>Connect to the wifi hostpot using your credentials</li>
                <li>
                  Go to:{" "}
                  <a href="http://my.dappnode/#/">http://my.dappnode/#/</a>
                </li>
              </ol>
            </p>
            <hr />
            <RenderWifiStatus wifiReport={wifiReport.data} />
          </Card>
        </>
      ) : null}
    </>
  );
}
