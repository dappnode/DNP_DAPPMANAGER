import React, { useEffect, useState } from "react";
import Loading from "components/Loading";
import Card from "components/Card";
import Button from "components/Button";
import { usePwaRequirements } from "hooks/PWA/usePwaRequirements";
import { dappnodeDiscord } from "params";
import newTabProps from "utils/newTabProps";
import ClipboardJS from "clipboard";
import { GoCopy } from "react-icons/go";
import { confirm } from "components/ConfirmDialog";

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
    restartingHttps,
    failedChecksCount,
    pwaCheckLogs,
    isPrivateDomain
  } = usePwaRequirements();

  const [continueClicked, setContinueClicked] = useState(false); // State to track if pwa domain redirect btn was clicked

  useEffect(() => {
    if (continueClicked) {
      confirm({
        title: `Having problems accessing the App?`,
        text: `If you are having problems accessing the App after clicking "Continue", you can navigate to private secure domain to perform additional diagnostics.`,
        label: "Navigate",
        variant: "dappnode",
        onClick: () => (window.location.href = `http://my.dappnode.private${window.location.pathname}`)
      });
    }
  }, [continueClicked]);

  useEffect(() => {
    const clipboard = new ClipboardJS(".copy-pwa-logs");
    return () => clipboard.destroy();
  }, [pwaCheckLogs]);

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

  if (isPrivateDomain) {
    return <DiagnoseCard failedChecksCount={failedChecksCount} pwaCheckLogs={pwaCheckLogs} />;
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
          <>
            <RequirementCard>
              <div>{handleRedirectMessage}</div>
              <Button
                variant="dappnode"
                href={`${pwaMappingUrl}${window.location.pathname}`}
                {...newTabProps}
                onClick={() => setContinueClicked(true)}
              >
                Continue
              </Button>
            </RequirementCard>
            {continueClicked && <RedirectDiagnoseCard />}
          </>
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

function DiagnoseCard({ failedChecksCount, pwaCheckLogs }: { failedChecksCount: number; pwaCheckLogs: string }) {
  return (
    <RequirementCard>
      <div className="diagnose-card">
        {failedChecksCount > 0 ? (
          <>
            <div className="diagnose-warning">
              Checks failed: <span className="warning-color">{failedChecksCount}</span>
            </div>
            <div>Please, follow the steps below to report the issue</div>
            <div className="diagnose-actions-container">
              <div className="diagnose-step">
                <span className="diagnose-description">1. Copy logs to share with support</span>
                <Button className="copy-pwa-logs" data-clipboard-text={pwaCheckLogs}>
                  <GoCopy /> Copy Diagnostic logs
                </Button>
              </div>
              <div className="splitter"></div>
              <div className="diagnose-step">
                <span className="diagnose-description">
                  2. Join our Discord Server, open a ticket with your issue and paste the Diagnostic logs.
                </span>
                <Button href={dappnodeDiscord} {...newTabProps} variant="dappnode">
                  Get Help on Discord
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>All Diagnostic checks passed successfully.</div>
            <Button href={dappnodeDiscord} {...newTabProps} variant="dappnode">
              Get Help on Discord
            </Button>
            <span className="diagnose-description">
              If you still facing problems when clicking "Continue", join our Discord Server and open a ticket with your
              issue.
            </span>
          </>
        )}
      </div>
    </RequirementCard>
  );
}

function RedirectDiagnoseCard() {
  return (
    <RequirementCard>
      <div>
        Having issues accessing the domain above? Navigate{" "}
        <a href={`http://my.dappnode.private${window.location.pathname}`}> here</a> to execute extra diagnostics.
      </div>
    </RequirementCard>
  );
}
