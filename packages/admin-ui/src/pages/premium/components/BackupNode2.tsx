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
      navigate(`ethereum`);
  }, []);

  const routes: RouteType[] = availableNetworks.map((network) => ({
    name: network === Network.Mainnet ? "Ethereum" : `${network}`,
    subPath: network === Network.Mainnet ? "ethereum" : `${network}`,
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
            <li>Available in Ethereum, Gnosis and Hoodi.</li>
            <li>Provides 168h of backup coverage per month in each network.</li>
            <li>
              You can activate and deactivate the backup at any moment. You will only spend time when the backup is
              active in the selected network.
            </li>
            <li>After activating the backup, you will need to wait 2 epochs (13 min) to start attesting.</li>
            <li>Each network has its own validator limit. Check Active validators below.</li>
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
