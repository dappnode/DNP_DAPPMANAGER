import React from "react";
import WifiCredentials from "./WifiCredentials";
import WifiStatus from "./WifiStatus";
import { useApi } from "api";
import { wifiDnpName } from "params";
import { prettyDnpName } from "utils/format";
import Loading from "components/Loading";
import { NoDnpInstalled } from "pages/packages/components/NoDnpInstalled";
import ErrorView from "components/ErrorView";

export default function WifiHome() {
  const dnpRequest = useApi.packageGet({ dnpName: wifiDnpName });
  const dnp = dnpRequest.data;

  if (!dnp) {
    return (
      <>
        {dnpRequest.isValidating ? (
          <Loading steps={[`Loading ${prettyDnpName(wifiDnpName)}`]} />
        ) : dnpRequest.error ? (
          dnpRequest.error.message.includes("No DNP was found") ? (
            <NoDnpInstalled id={wifiDnpName} />
          ) : (
            <ErrorView error={dnpRequest.error} />
          )
        ) : null}
      </>
    );
  }

  return (
    <div className="section-spacing">
      <WifiStatus />
      <WifiCredentials />
    </div>
  );
}
