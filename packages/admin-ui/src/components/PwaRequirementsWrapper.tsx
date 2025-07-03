import React from "react";
import Loading from "components/Loading";
import Card from "components/Card";
import Button from "components/Button";
import { usePwaRequirements } from "hooks/PWA/usePwaRequirements";
import { dappnodeDiscord } from "params";
import newTabProps from "utils/newTabProps";
import "./pwaRequirementsWrapper.scss";

interface PwaRequirementsWrapperProps {
  successComponent: React.ReactNode;
  handleRedirectMessage: string;
}

export function PwaRequirementsWrapper({ successComponent, handleRedirectMessage }: PwaRequirementsWrapperProps) {
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

  const allRequirementsMet = Boolean(pwaMappingUrl && httpsDnpInstalled && isHttpsRunning && isOnPwaDomain);

  if (requirementsLoading) {
    return <Loading steps={["Checking Requirements"]} />;
  }

  if (allRequirementsMet) {
    return <>{successComponent}</>;
  }

  if (installingHttps) {
    return <Loading steps={["Installing HTTPS package"]} />;
  }

  return (
    <>
      {!httpsDnpInstalled ? (
        <RequirementCard>
          <div>Https package is not installed.</div>
          <div>To continue, you must first install the Https package.</div>
          <Button variant="dappnode" onClick={installHttpsPkg}>
            Install Https
          </Button>
        </RequirementCard>
      ) : !isHttpsRunning ? (
        restartingHttps ? (
          <Loading steps={["Restarting HTTPS package"]} />
        ) : (
          <RequirementCard>
            <div>Https Package is not running after restarting.</div>
            <div>Try to reinstall the package or contact support.</div>
            <Button href={dappnodeDiscord} {...newTabProps} variant="dappnode">
              Contact support
            </Button>
          </RequirementCard>
        )
      ) : !pwaMappingUrl ? (
        <RequirementCard>
          <div>PWA Https mapping failed. Please, contact support.</div>
          <Button href={dappnodeDiscord} {...newTabProps} variant="dappnode">
            Contact support
          </Button>
        </RequirementCard>
      ) : (
        !isOnPwaDomain && (
          <RequirementCard>
            <div>{handleRedirectMessage}</div>
            <Button variant="dappnode" href={`${pwaMappingUrl}${window.location.pathname}`} {...newTabProps}>
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
