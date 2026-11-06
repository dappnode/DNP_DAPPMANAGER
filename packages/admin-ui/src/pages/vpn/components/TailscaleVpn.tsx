import React from "react";
import { useNavigate } from "react-router-dom";
import { MdExpandMore, MdOpenInNew, MdSettings } from "react-icons/md";
import { useApi } from "api";
import Loading from "components/Loading";
import { docsUrl, externalUrlProps, tailscaleDnpName } from "params";
import { prettyDnpName } from "utils/format";
import { NoDnpInstalled } from "pages/packages/components/NoDnpInstalled";
import ErrorView from "components/ErrorView";
import { Config } from "pages/packages/components/Config";
import Card from "components/Card";
import Button from "components/Button";
import { TailscaleStatusPanel } from "./TailscaleStatusPanel";
import "./tailscale.scss";

export function TailscaleVpn() {
  const navigate = useNavigate();
  const dnpRequest = useApi.packageGet({ dnpName: tailscaleDnpName });
  const dnp = dnpRequest.data;

  if (!dnp) {
    return (
      <>
        {dnpRequest.isValidating ? (
          <Loading steps={[`Loading ${prettyDnpName(tailscaleDnpName)}`]} />
        ) : dnpRequest.error ? (
          dnpRequest.error.message.includes("No DNP was found") ? (
            <NoDnpInstalled
              id={tailscaleDnpName}
              customCopy="Access your Dappnode remotely through your Tailscale network. Install the package, then sign in here."
            />
          ) : (
            <ErrorView error={dnpRequest.error} />
          )
        ) : null}
      </>
    );
  }

  const { userSettings, setupWizard } = dnp;
  return (
    <div className="section-spacing tailscale-vpn">
      <TailscaleStatusPanel
        dnp={dnp}
        unavailable={Boolean(dnpRequest.error)}
        refreshing={dnpRequest.isValidating}
        onRefresh={() => void dnpRequest.revalidate()}
      />
      <Card>
        <details className="tailscale-settings">
          <summary>
            <MdSettings aria-hidden="true" /> Auth key &amp; advanced settings <MdExpandMore aria-hidden="true" />
          </summary>
          <div className="mt-3">
            <p>Use an auth key for automatic sign-in, or change your package configuration.</p>
            <Config dnpName={dnp.dnpName} {...{ userSettings, setupWizard }} />
            <p className="small text-muted mt-3 mb-0">
              If an auth key is rejected, clear TS_AUTHKEY (and TS_AUTH_KEY if set), then restart the package to use
              browser sign-in.
            </p>
          </div>
        </details>
      </Card>
      <div className="d-flex flex-wrap align-items-center gap-3 small">
        <a href={docsUrl.tailscaleVpn} {...externalUrlProps}>
          Setup guide <MdOpenInNew aria-hidden="true" />
        </a>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/packages/my/${dnp.dnpName}/info`)}>
          Manage package
        </Button>
      </div>
    </div>
  );
}
