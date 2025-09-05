import React, { useEffect } from "react";
import Loading from "components/Loading";
import Card from "components/Card";
import Button from "components/Button";
import { usePwaRequirements } from "hooks/PWA/usePwaRequirements";
import { dappnodeDiscord } from "params";
import newTabProps from "utils/newTabProps";
import Ok from "./Ok";
import ClipboardJS from "clipboard";
import { GoCopy } from "react-icons/go";
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
    privateIp,
    containersInExternalNetwork,
    pwaDnsResolves,
    externalPointToDappmanager,
    pwaCheckLogs
  } = usePwaRequirements();

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
              {privateIp !== undefined && <Ok ok={privateIp} title="Private IP" msg="Private IP" />}
              <Ok ok={pwaDnsResolves} title="PWA DNS resolves" msg="PWA DNS resolves" />
              {containersInExternalNetwork &&
                Object.entries(containersInExternalNetwork).map(([name, inPublicNet]) => (
                  <Ok
                    key={name}
                    ok={inPublicNet}
                    title={`${name} on public network`}
                    msg={`${name} on public network`}
                  />
                ))}
              <Ok
                ok={externalPointToDappmanager}
                title="External points to dappmanager"
                msg="External points to dappmanager"
              />
              <Button className="copy-pwa-logs" data-clipboard-text={pwaCheckLogs}>
                <GoCopy /> Copy PWA logs
              </Button>
            </RequirementCard>
            <RequirementCard>
              <div>{handleRedirectMessage}</div>
              <Button variant="dappnode" href={`${pwaMappingUrl}${window.location.pathname}`} {...newTabProps}>
                Continue
              </Button>
              {window.location.hostname === "my.dappnode" && (
                <div className="private-domain-description">
                  Still having issues accessing the domain above? Navigate{" "}
                  <a href={`http://my.dappnode.private${window.location.pathname}`}> here</a> to execute extra
                  diagnostics.
                </div>
              )}
            </RequirementCard>
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
