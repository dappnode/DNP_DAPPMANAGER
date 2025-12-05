import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "components/Button";
import { basePath, relativePath, subPaths } from "../data";

import { SectionNavigator } from "components/SectionNavigator";
import { RouteType } from "types";
import { Card } from "react-bootstrap";
import { NetworkBackup } from "./NetworkBackup";
import { availableNetworks, useBackupNode2 } from "hooks/useBackupNodev2";
import { Network } from "@dappnode/types";
import "./backupNode.scss";

export function BackupNode2({
  isActivated: isPremium,
  hashedLicense
}: {
  isActivated: boolean;
  hashedLicense: string;
}) {
  const { backupData, consensusLoading, backupStatusLoading } = useBackupNode2({
    hashedLicense,
    isPremiumActivated: isPremium
  });

  const navigate = useNavigate();

  // if no backup subroute selected, redirect automatically to first network
  useEffect(() => {
    if (
      window.location.pathname === `/${basePath}/${subPaths.backupNode2}` ||
      window.location.pathname === `/${basePath}/${subPaths.backupNode2}/`
    )
      navigate(`ethereum`);
  }, []);

  const routes: RouteType[] = availableNetworks.map((network) => ({
    name: network === Network.Mainnet ? "Ethereum" : `${network}`,
    subPath: network === Network.Mainnet ? "ethereum" : `${network}`,
    element: (
      <NetworkBackup
        network={network}
        networkData={backupData[network]}
        isLoading={consensusLoading || backupStatusLoading}
      />
    )
  }));

  const DescriptionCardsGrid = () => (
    <>
      <div>
        <div className="backup-description-grid ">
          <DescriptionCard title="🛡️ Secure Validator Duties" body="Keep all your validators up when having problems" />
          <DescriptionCard title="🕒 168 hours of coverage" body="In each network, every 30 days " />
          <DescriptionCard title="🕹️ Enable or disable anytime" body="Backup time only spent in the selected network" />
          <DescriptionCard title="⏳ Wait 2 epochs" body="≈13 minutes to start attesting once activated" />
        </div>
      </div>
    </>
  );

  if (!isPremium) {
    return (
      <div className="premium-backup-node">
        <DescriptionCardsGrid />
        <Card>
          <div className="premium-backup-not-premium-card">
            <div>Activate Premium to enable the backup node for validators.</div>
            <Button variant="dappnode" onClick={() => navigate("/" + relativePath)}>
              Activate Premium
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div className="premium-backup-node">
      <DescriptionCardsGrid />
      <SectionNavigator routes={routes} variant="sm" />
    </div>
  );
}

const DescriptionCard = ({ title, body }: { title: string; body: string }) => (
  <Card className="backup-description-card">
    <div>
      <div className="backup-card-title">{title}</div>
      <span className="backup-card-body">{body}</span>
    </div>
  </Card>
);
