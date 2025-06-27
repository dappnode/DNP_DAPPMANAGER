import React from "react";
import Loading from "components/Loading";
import Card from "components/Card";
import Button from "components/Button";
import { pathName, subPaths } from "pages/system/data";
import { usePwaRequirements } from "hooks/PWA/usePwaRequirements";
import { PwaInstallCards } from "./PwaInstallCards";
import DiscordActions from "pages/community/components/DiscordActions";
import "./pwaRequirementsCheck.scss";

export function PwaRequirementsCheck() {
  const {
    requirementsLoading,
    httpsDnpInstalled,
    isHttpsRunning,
    pwaMappingUrl,
    isOnPwaDomain,
    installingHttps,
    installHttpsPkg,
    restartingHttps
  } = usePwaRequirements();
  const pwaAppSubtabUrl = pwaMappingUrl + "/" + pathName + "/" + subPaths.app;
  const allRequirementsMet = Boolean(pwaMappingUrl && httpsDnpInstalled && isHttpsRunning && isOnPwaDomain);

  return requirementsLoading ? (
    <Loading steps={["Checking App requirements"]} />
  ) : allRequirementsMet ? (
    <PwaInstallCards pwaAppSubtabUrl={pwaAppSubtabUrl} />
  ) : installingHttps ? (
    <Loading steps={["Installing HTTPS package"]} />
  ) : !httpsDnpInstalled ? (
    <Card>
      <div>
        <p>HTTPS package is not installed</p>
        <p>To download the app, you must install the HTTPS package</p>
        <Button variant="dappnode" onClick={() => installHttpsPkg()}>
          Install
        </Button>
      </div>
    </Card>
  ) : !isHttpsRunning ? (
    restartingHttps ? (
      <Loading steps={["Restarting HTTPS package"]} />
    ) : (
      <Card>
        <p>HTTPS Package not running after restart.</p> <p>Try re-installing it or contacting support</p>{" "}
        <DiscordActions />
      </Card>
    )
  ) : !pwaMappingUrl ? (
    <div>
      PWA HTTPS mapping failed. Contact support. <DiscordActions />
    </div>
  ) : (
    !isOnPwaDomain && (
      <Card>
        <div>
          <p>In order to download the app, you will be redirected to a different secure domain.</p>
          <p>Please login with your current Dappnode credentials.</p>
          <Button variant="dappnode" onClick={() => (window.location.href = pwaAppSubtabUrl)}>
            Continue
          </Button>
        </div>
      </Card>
    )
  );
}
