import React from "react";
import Button from "components/Button";

import SubTitle from "components/SubTitle";
import { CustomAccordion, CustomAccordionItem } from "components/CustomAccordion";
import { Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { MdInfoOutline, MdOutlineBackup } from "react-icons/md";
import { BackupData, ConsensusInfo } from "hooks/useBackupNodev2";

import "./networkBackup.scss";
import { prettyDnpName } from "utils/format";
import { Link } from "react-router-dom";
import { Network } from "@dappnode/types";
import { basePath as stakersBasePath } from "pages/stakers/data";

export const NetworkBackup = ({ network, networkData }: { network: Network; networkData: BackupData | undefined }) => {
  const backupData = networkData;
  console.log("NetworkBackup backupData", backupData);

  return (
    <div>
      {/*Get the network name from networkData key*/}
      {backupData ? (
        <div className="network-backup-container">
          <div className="info-cards-row">
            <ConsensusCard network={network} consensusData={backupData.consensusInfo} />
            <Card>
              <div>
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

const ConsensusCard = ({ network, consensusData }: { network: Network; consensusData: ConsensusInfo | undefined }) => {
  const currentConsensus = consensusData;
  const stakersPath = `/${stakersBasePath}/${network === "mainnet" ? "ethereum" : network}`;
  console.log("ConsensusCard currentConsensus", currentConsensus);

  return (
    <Card className="consensus-card">
      <div className="header-row">
        <SubTitle>CONSENSUS CLIENT</SubTitle>
        <OverlayTrigger
          overlay={
            <Tooltip id="active-networks">
              The consensus client currently active on your Dappnode for the selected network
            </Tooltip>
          }
          placement="top"
        >
          <span>
            <MdInfoOutline className="tooltip-icon" />
          </span>
        </OverlayTrigger>
      </div>

      {currentConsensus && (
        <>
          {currentConsensus.name && (
            <div className={`cc-item ${currentConsensus.isPrysmOrTeku && "color-danger"}`}>
              {prettyDnpName(currentConsensus.name)}
            </div>
          )}

          {currentConsensus.noConsensusSelected && (
            <div>
              <div className="cc-warning">
                No staking clients selected. Set up your node in the <Link to={stakersPath}> Stakers tab</Link>.
              </div>
            </div>
          )}
          {currentConsensus.isPrysmOrTeku && (
            <div className="cc-warning">
              Prysm and Teku not supported. To enable the backup, switch to a different client in the{" "}
              <Link to={stakersPath}> Stakers tab</Link>.
            </div>
          )}
        </>
      )}
    </Card>
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
