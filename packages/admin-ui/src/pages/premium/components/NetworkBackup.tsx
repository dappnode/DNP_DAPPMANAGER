import React from "react";
import Button from "components/Button";

import SubTitle from "components/SubTitle";
import { CustomAccordion, CustomAccordionItem } from "components/CustomAccordion";
import { Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  MdGroup,
  MdInfoOutline,
  MdOutlineAccessTime,
  MdOutlineBackup,
  MdOutlineCheckCircleOutline,
  MdWarningAmber
} from "react-icons/md";
import { BackupData, ConsensusInfo } from "hooks/useBackupNodev2";

import "./networkBackup.scss";
import { prettyDnpName } from "utils/format";
import { Link } from "react-router-dom";
import { Network } from "@dappnode/types";
import { basePath as stakersBasePath } from "pages/stakers/data";
import { capitalize } from "utils/strings";
import { docsUrl } from "params";
import newTabProps from "utils/newTabProps";

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
            <ValidatorsCard
              network={network}
              activeValidators={backupData.activeValidators}
              maxValidators={backupData.maxValidators}
              beaconApiError={backupData.beaconApiError}
            />
          </div>

          {/* <ActivateCard timeLeft={backupData.timeLeft} /> */}
          <CooldownCard timeLeft={backupData.timeLeft} />

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

  return (
    <Card className="consensus-card">
      <div className="header-row">
        <SubTitle>CONSENSUS CLIENT</SubTitle>
        <OverlayTrigger
          overlay={
            <Tooltip id="active-cc">
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
          <div className={`cc-item ${currentConsensus.isPrysmOrTeku && "color-danger"}`}>
            {currentConsensus.name ? prettyDnpName(currentConsensus.name) : "-"}
          </div>

          <div>
            <div className="cc-warning">
              {currentConsensus.noConsensusSelected ? (
                <div>
                  No staking clients selected. Set up your node in the <Link to={stakersPath}> Stakers tab</Link>.
                </div>
              ) : currentConsensus.isPrysmOrTeku ? (
                <div>
                  Prysm and Teku not supported. To enable the backup, switch to a different client in the{" "}
                  <Link to={stakersPath}> Stakers tab</Link>.
                </div>
              ) : (
                <div> Compatible client selected </div>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

const ValidatorsCard = ({
  network,
  activeValidators,
  maxValidators,
  beaconApiError
}: {
  network: Network;
  activeValidators: number;
  maxValidators: number;
  beaconApiError: boolean;
}) => {
  const limitExceeded = activeValidators > maxValidators;
  const barPercentage = maxValidators ? Math.min((activeValidators / maxValidators) * 100, 100) : 100;

  return (
    <Card className="validators-card">
      <div className="header-row">
        <SubTitle>Active validators</SubTitle>
        <OverlayTrigger
          overlay={
            <Tooltip id="validators-coverage">
              The number of active validators supported by the backup service for the selected network
            </Tooltip>
          }
          placement="top"
        >
          <span>
            <MdInfoOutline className="tooltip-icon" />
          </span>
        </OverlayTrigger>
      </div>

      <div className="validators-item">
        <div className="validators-item-row">
          <i className={limitExceeded ? "color-danger" : ""}>Your active validators</i>

          <div>
            <MdGroup />{" "}
            <span className={limitExceeded ? "color-danger" : beaconApiError ? "color-warning" : undefined}>
              {activeValidators ?? "0"}
            </span>{" "}
            {beaconApiError && (
              <OverlayTrigger
                overlay={
                  <Tooltip id="beacon-api-error">
                    Error fetching {capitalize(network)} validators status. All keystores imported in your
                    {capitalize(network)} Web3Signer are being considered as active validators.
                  </Tooltip>
                }
                placement="top"
              >
                <span>
                  <MdWarningAmber className="tooltip-beacon-api-error" />{" "}
                </span>
              </OverlayTrigger>
            )}
            / {maxValidators ?? "—"}
          </div>
        </div>

        <div className="validators-limit-bar">
          <div
            className={`validators-curr-bar ${limitExceeded && "color-danger"}`}
            style={{ width: `${barPercentage}%` }}
          />
        </div>
      </div>
      {limitExceeded ? (
        <div className="validators-limit-warning">
          You are exceeding the supported number of validators in {capitalize(network)}.{" "}
          {network !== "gnosis" && (
            <>
              We invite you to consolidate them to use this service.{" "}
              <Link to={docsUrl.premiumBackupValidatorsLimit} {...newTabProps}>
                Learn more
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="validators-limit-desc">Up to {maxValidators ?? "—"} validators supported per network.</div>
      )}
    </Card>
  );
};

const ActivateCard = ({ timeLeft }: { timeLeft: string }) => (
  <Card className="action-backup-card">
    <div className="action-backup-col">
      <MdOutlineBackup className="blue-text action-icon" />
      <SubTitle className="blue-text">Ready to activate </SubTitle>
    </div>

    <div>Your backup service is ready to cover your validators for: </div>
    <div className="action-backup-col">
      <div className="countdown-text">Available time remaining:</div>
      <div className="countdown-time">{timeLeft}</div>
    </div>
    <Button variant="dappnode" onClick={() => {}}>
      Activate Backup
    </Button>
  </Card>
);

const DeactivateCard = ({ timeLeft }: { timeLeft: string }) => (
  <Card className="action-backup-card">
    <div className="action-backup-col">
      <MdOutlineCheckCircleOutline className="green-text action-icon" />

      <SubTitle className="green-text">Backup Active </SubTitle>
    </div>

    <div>Your validators are protected by backup coverage</div>
    <div className="action-backup-col">
      <div className="countdown-text">Auto-deactivation in:</div>
      <div className="countdown-time">{timeLeft}</div>
    </div>
    <Button variant="danger" onClick={() => {}}>
      Stop Backup
    </Button>
  </Card>
);

const CooldownCard = ({ timeLeft }: { timeLeft: string }) => (
  <Card className="action-backup-card">
    <div className="action-backup-col">
      <MdOutlineAccessTime className="orange-text action-icon" />
      <SubTitle className="orange-text">Cooldown Period</SubTitle>
    </div>
    <div>Backup cannot be reactivated during cooldown</div>

    <div className="action-backup-col">
      <div className="countdown-text">Available again in:</div>
      <div className="countdown-time">{timeLeft}</div>
    </div>

    <Button variant="dappnode" disabled={true}>
      Backup unavailable
    </Button>
  </Card>
);
