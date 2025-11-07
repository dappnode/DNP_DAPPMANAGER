import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "components/Button";
import { basePath, relativePath, subPaths } from "../data";

import { Network } from "@dappnode/types";
import { SectionNavigator } from "components/SectionNavigator";
import { RouteType } from "types";
import SubTitle from "components/SubTitle";
import { CustomAccordion, CustomAccordionItem } from "components/CustomAccordion";
import { Card } from "react-bootstrap";
import { MdOutlineBackup } from "react-icons/md";

const availableNetworks = [Network.Mainnet, Network.Gnosis, Network.Hoodi];

type BackupData = {
  activable: boolean;
  activeValidators: number;
  maxValidators: number;
  nextAvailableDate: string | null;
  consensusClient: string;
  // activationsHistory: Array<{
  //   activation_date: string;
  //   end_date: string;
  // }>;
  activationsHistory: string[];
};

const fakeBackupData: Partial<Record<Network, BackupData>> = {
  [Network.Mainnet]: {
    activable: true,
    activeValidators: 5,
    maxValidators: 10,
    nextAvailableDate: null,
    consensusClient: "lighthouse.dnp.dappnode.eth",
    activationsHistory: [
      // { activation_date: "2025-10-10T12:00:00Z", end_date: "2025-10-15T12:00:00Z" },
      // { activation_date: "2025-10-20T08:00:00Z", end_date: "2025-10-25T08:00:00Z" }
      "November 1, 2023 - 12:00 - 5 hours 23 minutes",
      "December 15, 2023 - 09:30 - 3 hours 45 minutes"
    ]
  }
};

export function BackupNode2({
  isActivated: isPremium,
  hashedLicense
}: {
  isActivated: boolean;
  hashedLicense: string;
}) {
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
    element: <NetworkBackup networkData={fakeBackupData[network]} />
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

const NetworkBackup = ({ networkData }: { networkData: BackupData | undefined }) => {
  const backupData = networkData;
  return (
    <div>
      {/*Get the network name from networkData key*/}
      {backupData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", flexDirection: "row", gap: "15px" }}>
            <Card style={{ flex: 1, padding: "15px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <SubTitle>Consensus Client Data</SubTitle>
                <div>{backupData.consensusClient}</div>
              </div>
            </Card>
            <Card style={{ flex: 1, padding: "15px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <SubTitle>Validators coverage Data</SubTitle>
                <div>
                  {backupData.activeValidators}/{backupData.maxValidators} validators
                </div>
              </div>
            </Card>
          </div>

          <ActivateCard />

          <CustomAccordion defaultOpen={false}>
            <CustomAccordionItem header={<b>Activation history</b>}>
              <div>
                {backupData.activationsHistory.map((activation, index) => (
                  <div key={index}>- {activation}</div>
                ))}
              </div>
            </CustomAccordionItem>
          </CustomAccordion>
        </div>
      ) : (
        <p>No backup data available</p>
      )}
    </div>
  );
};

const ActivateCard = () => (
  <Card
    style={{
      padding: "15px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px"
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <MdOutlineBackup className="blue-text" style={{ fontSize: "36px" }} />
      <h5 className="blue-text">Ready to activate</h5>
    </div>

    <div>Your backup service is ready to cover your validators for 5 days 4 hours 3 minutes</div>

    <Button variant="dappnode" onClick={() => {}}>
      Activate Backup
    </Button>
  </Card>
);
