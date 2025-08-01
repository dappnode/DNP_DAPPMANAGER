import React from "react";
import Loading from "components/Loading";
import Card from "components/Card";
import Button from "components/Button";
import { dappnodeDiscord, premiumLanding } from "params";
import newTabProps from "utils/newTabProps";
import "./premiumWrapper.scss";

interface PremiumWrapperProps {
  isLoading: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  installPremiumPkg: () => Promise<void>;
  isRunning: boolean;
  successComponent: React.ReactNode;
}

export function PremiumWrapper({
  isLoading,
  isInstalled,
  isInstalling,
  installPremiumPkg,
  isRunning,
  successComponent
}: PremiumWrapperProps) {
  if (isLoading) {
    return <Loading steps={["Checking Requirements"]} />;
  }

  if (isInstalling) {
    return (
      <Card>
        <div className="premium-installing">
          <Loading steps={["Installing Premium Package"]} />
        </div>
      </Card>
    );
  }

  if (!isInstalled) {
    return (
      <RequirementCard>
        <div>The Premium package must be installed to continue.</div>
        <div>
          Premium unlocks powerful features, including advanced push notifications, priority support, and automatic
          beacon node backups.
        </div>
        <div>
          To explore all features and pricing, click <i>Learn More</i> to visit the Dappnode Premium landing page.
        </div>
        <div className="premium-buttons">
          <Button variant="outline-dappnode" href={premiumLanding} {...newTabProps}>
            Learn More
          </Button>
          <Button variant="dappnode" onClick={() => installPremiumPkg()}>
            Install Premium
          </Button>
        </div>
      </RequirementCard>
    );
  }

  if (!isRunning) {
    return (
      <RequirementCard>
        <div>Premium Package is installed but not running.</div>
        <div>Please try restarting the package, reinstalling it, or contacting support for further help.</div>
        <Button href={dappnodeDiscord} {...newTabProps} variant="dappnode">
          Contact support
        </Button>
      </RequirementCard>
    );
  }

  return <>{successComponent}</>;
}

function RequirementCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <div className="premium-requirements-card">{children}</div>
    </Card>
  );
}
