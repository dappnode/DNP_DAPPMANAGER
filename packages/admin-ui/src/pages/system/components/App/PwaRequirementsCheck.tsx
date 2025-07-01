import React from "react";
import Loading from "components/Loading";
import Card from "components/Card";
import Button from "components/Button";
import { pathName, subPaths } from "pages/system/data";
import { usePwaRequirements } from "hooks/PWA/usePwaRequirements";
import { PwaInstallCards } from "./PwaInstallCards";
import { dappnodeDiscord } from "params";
import newTabProps from "utils/newTabProps";
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
  ) : (
    <>
      <h5>App installation</h5>
      {!httpsDnpInstalled ? (
        <RequirementCard>
          <div>Https package is not installed. </div>
          <div>To install the App, you must first install the Https package.</div>
          <Button variant="dappnode" onClick={() => installHttpsPkg()}>
            Install Https
          </Button>
        </RequirementCard>
      ) : !isHttpsRunning ? (
        restartingHttps ? (
          <Loading steps={["Restarting HTTPS package"]} />
        ) : (
          <RequirementCard>
            <div>Https Package is not running after restarting.</div>
            <div>Try to reinstall the package or contact support. </div>
            <Button href={dappnodeDiscord} {...newTabProps} variant="dappnode">
              Contact support
            </Button>
          </RequirementCard>
        )
      ) : !pwaMappingUrl ? (
        <RequirementCard>
          <div>PWA Https mapping failed. Please, contact support. </div>
          <Button href={dappnodeDiscord} {...newTabProps} variant="dappnode">
            Contact support
          </Button>
        </RequirementCard>
      ) : (
        !isOnPwaDomain && (
          <RequirementCard>
            <div>
              To install the app, you will be redirected to a different secure domain. Please, login with your current
              Dappnode credentials
            </div>
            <Button variant="dappnode" onClick={() => (window.location.href = pwaAppSubtabUrl)}>
              Continue
            </Button>
          </RequirementCard>
        )
      )}
    </>
  );
}

function RequirementCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <div className="pwa-requirements-card">{children}</div>
    </Card>
  );
}
