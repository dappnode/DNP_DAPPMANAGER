import React from "react";

import Loading from "components/Loading";
import Card from "components/Card";
import Button from "components/Button";
import { pathName, subPaths } from "pages/system/data";
import { usePwaRequirements } from "hooks/PWA/usePwaRequirements";
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

  return requirementsLoading ? (
    <Loading steps={["Checking App requirements"]} />
  ) : Boolean(pwaMappingUrl && httpsDnpInstalled && isHttpsRunning && isOnPwaDomain) ? (
    <div>ALL REQUIREMENTS MET AND ALREADY IN PWA DOMAIN</div>
  ) : !httpsDnpInstalled ? (
    installingHttps ? (
      <Loading steps={["Installing https package"]} />
    ) : (
      <Card>
        <div>
          <p>Https package is not installed</p>
          <p>To download the app, you must install the https package</p>
          <Button variant="dappnode" onClick={() => installHttpsPkg()}>
            Install
          </Button>
        </div>
      </Card>
    )
  ) : !isHttpsRunning ? (
    restartingHttps ? (
      <Loading steps={["Restarting https package"]} />
    ) : (
      <div>HTTPS Package not running. Try restarting the package or contacting support</div>
    )
  ) : !pwaMappingUrl ? (
    <div>PWA HTTPS mapping failed. Contact support</div>
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
