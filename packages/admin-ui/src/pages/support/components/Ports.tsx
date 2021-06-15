import React, { useState } from "react";

import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import Ok from "components/Ok";
import Card from "components/Card";
import Button from "components/Button";
import { withToast } from "components/toast/Toast";

import { useApi, api } from "api";
import { PortsStatusTable } from "./PortsStatusTable";
import { ReqStatus } from "types";

function UpnpStatus({
  isUpnpEnabled,
  localIp
}: {
  isUpnpEnabled: boolean;
  localIp: string;
}) {
  return (
    <>
      {isUpnpEnabled ? (
        <Ok ok={true} msg={"DAppNode has detected UPnP as enabled"} />
      ) : (
        <>
          <Ok ok={false} msg={"DAppNode has detected UPnP as disabled"} />
          <p>
            Enable UPnP or manually open and associate the necessary ports in
            the router to the DAppNode local Ip:
            <strong>{localIp}</strong>
          </p>
          <br />
          <strong>UDP ports must be manually checked in the router</strong>
        </>
      )}
    </>
  );
}

export default function Ports() {
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const systemInfo = useApi.systemInfoGet();

  async function openPorts() {
    try {
      setReqStatus({ loading: true });
      await withToast(() => api.upnpPortsOpen(), {
        message: "Attemping to open ports with UPnP..",
        onSuccess: "Successfully opened ports"
      });
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e });
      console.error("Error on upnpPortsOpen", e);
    }
  }

  return (
    <Card>
      {systemInfo.data ? (
        <>
          {systemInfo.data.publicIp !== systemInfo.data.internalIp ? (
            <>
              <UpnpStatus
                isUpnpEnabled={systemInfo.data.upnpAvailable}
                localIp={systemInfo.data.internalIp}
              />
              <br />
              <Button disabled={reqStatus.loading} onClick={openPorts}>
                Refresh UPnP
              </Button>
            </>
          ) : (
            <Ok
              ok={true}
              msg={
                "Public and local IPs are the same. Your DAppNode is directly exposed to the internet and does not require UPnP"
              }
            />
          )}
          <hr />
          <PortsStatusTable isUpnpEnabled={systemInfo.data.upnpAvailable} />
        </>
      ) : systemInfo.error ? (
        <ErrorView error={systemInfo.error} />
      ) : (
        <Loading steps={["Loading system info"]} />
      )}
    </Card>
  );
}
