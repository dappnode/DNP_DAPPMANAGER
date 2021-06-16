import React from "react";

import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import Ok from "components/Ok";
import Card from "components/Card";
import { useApi } from "api";
import { PortsStatusTable } from "./PortsStatusTable";

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
  const systemInfo = useApi.systemInfoGet();

  return (
    <Card spacing>
      {systemInfo.data ? (
        <>
          {systemInfo.data.publicIp !== systemInfo.data.internalIp ? (
            <>
              <UpnpStatus
                isUpnpEnabled={systemInfo.data.upnpAvailable}
                localIp={systemInfo.data.internalIp}
              />
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
