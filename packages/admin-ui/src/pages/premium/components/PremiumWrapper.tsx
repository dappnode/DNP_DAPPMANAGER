import React from "react";
import Loading from "components/Loading";
import Card from "components/Card";
import Button from "components/Button";
import { dappnodeDiscord } from "params";
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
        <div>Premium package is not installed.</div>
        <div>To continue, you must first install it.</div>
        <Button variant="dappnode" onClick={() => console.log("Install Premium Pkg")}>
          Install Premium
        </Button>
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
