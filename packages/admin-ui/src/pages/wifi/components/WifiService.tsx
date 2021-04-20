import { api, useApi } from "api";

import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import React from "react";
import Button from "components/Button";
import Alert from "react-bootstrap/esm/Alert";
import { WifiReport } from "types";
import { withToastNoThrow } from "components/toast/Toast";
import { continueIfCalleDisconnected } from "api/utils";
import Badge from "react-bootstrap/esm/Badge";

const wifiDnpName = "wifi.dnp.dappnode.eth";

function RenderWifiStatus({ wifiReport }: { wifiReport: WifiReport }) {
  return (
    <>
      <div className="display inline-block">
        <h4>
          Wifi status{" "}
          <Badge
            variant={
              wifiReport.containerState === "running" ? "success" : "warning"
            }
          >
            {wifiReport.containerState}
          </Badge>
        </h4>

        <RestartWifi />
      </div>

      <hr />

      <Alert
        dismissible={true}
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

function RestartWifi() {
  async function restartWifi() {
    withToastNoThrow(
      continueIfCalleDisconnected(
        () => api.packageRestart({ dnpName: wifiDnpName }),
        wifiDnpName
      )
    );
  }
  return (
    <Button
      variant="dappnode"
      onClick={() => restartWifi().catch(console.error)}
    >
      Restart wifi
    </Button>
  );
}

export default function WifiService() {
  const wifiReport = useApi.wifiReportGet();

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
            </p>
            <hr />
            <RenderWifiStatus wifiReport={wifiReport.data} />
          </Card>
        </>
      ) : null}
    </>
  );
}
