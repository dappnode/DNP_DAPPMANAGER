import React from "react";
import { useApi } from "api";
import Loading from "components/Loading";
import { tailscaleDnpName } from "params";
import { prettyDnpName } from "utils/format";
import { NoDnpInstalled } from "pages/packages/components/NoDnpInstalled";
import ErrorView from "components/ErrorView";
import { Config } from "pages/packages/components/Config";
import { VpnDocsGuide } from "./VpnDocsGuide";

export function TailscaleVpn() {
  const dnpRequest = useApi.packageGet({ dnpName: tailscaleDnpName });
  const dnp = dnpRequest.data;

  if (!dnp) {
    return (
      <>
        {dnpRequest.isValidating ? (
          <Loading steps={[`Loading ${prettyDnpName(tailscaleDnpName)}`]} />
        ) : dnpRequest.error ? (
          dnpRequest.error.message.includes("No DNP was found") ? (
            <NoDnpInstalled id={tailscaleDnpName} />
          ) : (
            <ErrorView error={dnpRequest.error} />
          )
        ) : null}
      </>
    );
  }

  const { userSettings, setupWizard } = dnp;
  return (
    <div className="section-spacing">
      <VpnDocsGuide variant="tailscale" />
      <Config dnpName={dnp.dnpName} {...{ userSettings, setupWizard }} />
    </div>
  );
}
