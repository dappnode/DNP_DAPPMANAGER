import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "components/Button";
import { basePath, relativePath, subPaths } from "../data";

import { SectionNavigator } from "components/SectionNavigator";
import { RouteType } from "types";
import { Card } from "react-bootstrap";
import { NetworkBackup } from "./NetworkBackup";
import { availableNetworks, useBackupNode2 } from "hooks/useBackupNodev2";

export function BackupNode2({
  isActivated: isPremium,
  hashedLicense
}: {
  isActivated: boolean;
  hashedLicense: string;
}) {
  const { fakeBackupData } = useBackupNode2({ hashedLicense, isPremiumActivated: isPremium });

  const navigate = useNavigate();

  // if no backup subroute selected, redirect automatically to first network
  useEffect(() => {
    if (
      window.location.pathname === `/${basePath}/${subPaths.backupNode2}` ||
      window.location.pathname === `/${basePath}/${subPaths.backupNode2}/`
    )
      navigate(`${availableNetworks[0]}`);
  }, []);

  const routes: RouteType[] = availableNetworks.map((network) => ({
    name: `${network}`,
    subPath: `${network}`,
    element: <NetworkBackup network={network} networkData={fakeBackupData[network]} />
  }));

  const DescriptionCard = () => (
    <Card style={{ padding: "15px" }}>
      <div className="description-row">
        <div className="description-row-text">
          <p>
            The backup node for validators ensures that your imported validators in Dappnode stay up when you have
            problems attesting.
          </p>
          <ul>
            <li>Provides 7-day backup coverage to diagnose and fix issues</li>
            <li>By default, it covers up to 10 validators per available network</li>
            <li>The backup service can be used once a month per user</li>
            <li>
              After activating the backup, you'll need to wait 2 epochs (≈13 minutes) for your validators to start
              attesting
            </li>
          </ul>
        </div>
        {!isPremium && (
          <Button variant="dappnode" onClick={() => navigate("/" + relativePath)}>
            Activate Premium
          </Button>
        )}
      </div>
    </Card>
  );

  if (!isPremium) {
    return (
      <div className="premium-backup-node">
        <DescriptionCard />
        <div className="premium-backup-info-cards">
          <p>Premium not active</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      {<DescriptionCard />}
      <SectionNavigator routes={routes} variant="sm" />
    </div>
  );
}
