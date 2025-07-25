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
  isRunning: boolean;
  successComponent: React.ReactNode;
}

export function PremiumWrapper({ isLoading, isInstalled, isRunning, successComponent }: PremiumWrapperProps) {
  if (isLoading) {
    return <Loading steps={["Checking Requirements"]} />;
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
          <Button variant="dappnode" onClick={() => console.log("Install Premium Pkg")}>
            Install Premium
          </Button>
        </div>
      </RequirementCard>
    );
  }

  if (!isRunning) {
    return (
      <RequirementCard>
        <div>Premium Package is not running after restarting.</div>
        <div>Try to reinstall the package or contact support.</div>
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
