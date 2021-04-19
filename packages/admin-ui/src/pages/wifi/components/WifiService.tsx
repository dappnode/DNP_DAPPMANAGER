import { api, useApi } from "api";

import SubTitle from "components/SubTitle";
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import React from "react";
import Button from "components/Button";
import Ok from "components/Ok";
import { WifiReport } from "types";
import { withToastNoThrow } from "components/toast/Toast";
import { continueIfCalleDisconnected } from "api/utils";

const wifiDnpName = "wifi.dnp.dappnode.eth";

function RenderWifiStatus({ wifiReport }: { wifiReport: WifiReport }) {
  return (
    <>
      Wifi status:
      {wifiReport.containerState === "running" ? (
        <Ok
          msg={`${wifiReport.containerState}. ${wifiReport.info}`}
          ok={true}
        />
      ) : wifiReport.containerState === "restarting" ? (
        <Ok
          msg={`${wifiReport.containerState}. ${wifiReport.info}`}
          loading={true}
        />
      ) : wifiReport.containerState === "dead" ? (
        <Ok
          msg={`${wifiReport.containerState}. ${wifiReport.info}: ${wifiReport.report?.lastLog} (Exit code: ${wifiReport.report?.exitCode})`}
          warning={true}
        />
      ) : wifiReport.containerState === "exited" ? (
        <Ok
          msg={`${wifiReport.containerState}. ${wifiReport.info}: ${wifiReport.report?.lastLog} (Exit code: ${wifiReport.report?.exitCode})`}
          warning={true}
        />
      ) : wifiReport.containerState === "paused" ? (
        <Ok
          msg={`${wifiReport.containerState}. ${wifiReport.info}: ${wifiReport.report?.lastLog} (Exit code: ${wifiReport.report?.exitCode})`}
          warning={true}
        />
      ) : wifiReport.containerState === "created" ? (
        <Ok
          msg={`${wifiReport.containerState}. ${wifiReport.info}`}
          warning={true}
        />
      ) : null}
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
      variant="warning"
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
          <SubTitle>Wifi service</SubTitle>
          <Card spacing>
            <RenderWifiStatus wifiReport={wifiReport.data} />
            <hr />
            <RestartWifi />
          </Card>
        </>
      ) : null}
    </>
  );
}
