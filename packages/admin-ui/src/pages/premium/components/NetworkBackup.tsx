import React, { useState } from "react";
import Button from "components/Button";

import SubTitle from "components/SubTitle";
import { Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  MdGroup,
  MdInfoOutline,
  // MdOutlineAccessTime,
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
import Loading from "components/Loading";

export const NetworkBackup = ({
  network,
  networkData,
  isLoading
}: {
  network: Network;
  networkData: BackupData | undefined;
  isLoading: boolean;
}) => {
  const backupData = networkData;
  const valLimitExceeded = (backupData && backupData?.activeValidators > backupData?.maxValidators) || false;
  const noConsensusSelected = (backupData && backupData.consensusInfo?.noConsensusSelected) || false;
  const consensusPrysmOrTeku = (backupData && !noConsensusSelected && backupData.consensusInfo?.isPrysmOrTeku) || false;
  console.log("!noConsensusSelected", noConsensusSelected);
  console.log("prysmteku", backupData!.consensusInfo?.isPrysmOrTeku);

  console.log("consensusPrysmOrTeku", consensusPrysmOrTeku);
  console.log(backupData && !noConsensusSelected && backupData.consensusInfo?.isPrysmOrTeku);

  return (
    <div>
      {isLoading ? (
        <Loading steps={["Loading network backup data..."]} />
      ) : backupData ? (
        <div className="network-backup-container">
          <div className="info-cards-row">
            <ConsensusCard
              network={network}
              consensusData={backupData.consensusInfo}
              noConsensusSelected={noConsensusSelected}
              consensusPrysmOrTeku={consensusPrysmOrTeku}
            />
            <ValidatorsCard
              network={network}
              activeValidators={backupData.activeValidators}
              maxValidators={backupData.maxValidators}
              valLimitExceeded={valLimitExceeded}
              beaconApiError={backupData.beaconApiError}
            />
          </div>

          <ActivateCard
            timeLeft={backupData.timeLeft}
            valLimitExceeded={valLimitExceeded}
            noConsensusSelected={noConsensusSelected}
            consensusPrysmOrTeku={consensusPrysmOrTeku}
          />
          {/* <CooldownCard timeLeft={backupData.timeLeft} /> */}

          <ActivationHistoryCard activationsHistory={backupData.activationsHistory} />
        </div>
      ) : (
        <p>No backup data available</p>
      )}
    </div>
  );
};

const ConsensusCard = ({
  network,
  consensusData,
  noConsensusSelected,
  consensusPrysmOrTeku
}: {
  network: Network;
  consensusData: ConsensusInfo | undefined;
  noConsensusSelected: boolean;
  consensusPrysmOrTeku: boolean;
}) => {
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
          <div className={`cc-item ${(noConsensusSelected || consensusPrysmOrTeku) && "color-danger"}`}>
            {currentConsensus.name ? prettyDnpName(currentConsensus.name) : "No staking clients selected"}
          </div>

          <div>
            <div className="cc-warning">
              {noConsensusSelected ? (
                <div>
                  Set up your staking clients in the <Link to={stakersPath}> Stakers tab</Link>.
                </div>
              ) : consensusPrysmOrTeku ? (
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
  valLimitExceeded,
  beaconApiError
}: {
  network: Network;
  activeValidators: number;
  maxValidators: number;
  valLimitExceeded: boolean;
  beaconApiError: boolean;
}) => {
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
          <i className={valLimitExceeded ? "color-danger" : ""}>Your active validators</i>

          <div>
            <MdGroup />{" "}
            <span className={valLimitExceeded ? "color-danger" : beaconApiError ? "orange-text" : undefined}>
              {activeValidators ?? "0"}
            </span>{" "}
            {beaconApiError && (
              <OverlayTrigger
                overlay={
                  <Tooltip id="beacon-api-error">
                    Error fetching {capitalize(network)} validators status. All keystores imported in your{" "}
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
            className={`validators-curr-bar ${valLimitExceeded && "color-danger"}`}
            style={{ width: `${barPercentage}%` }}
          />
        </div>
      </div>
      {valLimitExceeded ? (
        <div className="validators-limit-warning">
          You are exceeding the supported number of validators in {capitalize(network)}. Want to back up all your
          validators?{" "}
          <Link to={docsUrl.premiumBackupValidatorsLimit} {...newTabProps}>
            Read docs
          </Link>
        </div>
      ) : (
        <div className="validators-limit-desc">
          Up to {maxValidators ?? "—"} validators supported in {capitalize(network)}.
        </div>
      )}
    </Card>
  );
};

const ActivateCard = ({
  timeLeft,
  valLimitExceeded,
  noConsensusSelected,
  consensusPrysmOrTeku
}: {
  timeLeft: string;
  valLimitExceeded: boolean;
  noConsensusSelected: boolean;
  consensusPrysmOrTeku: boolean;
}) => (
  <Card className="action-backup-card">
    <div className="action-backup-col">
      <MdOutlineBackup className="blue-text action-icon" />
      <SubTitle className="blue-text">Ready to activate</SubTitle>
    </div>
    <div className="action-backup-col">
      <div className="countdown-text">Available time remaining</div>
      <div className="countdown-time">{timeLeft}</div>
    </div>
    <Button
      variant="dappnode"
      onClick={() => {}}
      disabled={valLimitExceeded || consensusPrysmOrTeku || noConsensusSelected}
    >
      Activate Backup
    </Button>
    {valLimitExceeded && <div className="color-danger">Validator limit exceeded</div>}
    {consensusPrysmOrTeku && <div className="color-danger">Clients are not supported</div>}
    {noConsensusSelected && <div className="color-danger">No staking clients selected</div>}
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
      <div className="countdown-text">Auto-deactivation in</div>
      <div className="countdown-time">{timeLeft}</div>
    </div>
    <Button variant="danger" onClick={() => {}}>
      Stop Backup
    </Button>
  </Card>
);

// const CooldownCard = ({ timeLeft }: { timeLeft: string }) => (
//   <Card className="action-backup-card">
//     <div className="action-backup-col">
//       <MdOutlineAccessTime className="orange-text action-icon" />
//       <SubTitle className="orange-text">Cooldown Period</SubTitle>
//     </div>
//     <div>Backup cannot be reactivated during cooldown</div>

//     <div className="action-backup-col">
//       <div className="countdown-text">Available again in</div>
//       <div className="countdown-time">{timeLeft}</div>
//     </div>

//     <Button variant="dappnode" disabled={true}>
//       Backup unavailable
//     </Button>
//   </Card>
// );

const ActivationHistoryCard = ({
  activationsHistory
}: {
  activationsHistory: { activation_date: Date; end_date: Date }[];
}) => {
  return (
    <Card className="activation-history-card">
      <SubTitle>Activation history</SubTitle>
      <ActivationHistoryTable activationsHistory={activationsHistory} />
    </Card>
  );
};

const ActivationHistoryTable = ({
  activationsHistory
}: {
  activationsHistory: { activation_date: Date; end_date: Date }[];
}) => {
  const [sortBy, setSortBy] = useState<"number" | "start" | "end" | "duration">("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (!activationsHistory?.length) return <div>No activations found.</div>;

  const getDuration = (a: { activation_date: Date; end_date: Date }) =>
    a.end_date.getTime() - a.activation_date.getTime();

  const sorted = [...activationsHistory].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "number") {
      cmp = activationsHistory.indexOf(a) - activationsHistory.indexOf(b);
    } else if (sortBy === "start") {
      cmp = a.activation_date.getTime() - b.activation_date.getTime();
    } else if (sortBy === "end") {
      cmp = a.end_date.getTime() - b.end_date.getTime();
    } else if (sortBy === "duration") {
      cmp = getDuration(a) - getDuration(b);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  const SortArrow = ({ column }: { column: typeof sortBy }) => {
    const sortIcon = sortBy === column && (sortDir === "asc" ? "▲" : "▼");
    return <span className="blue-text sort-arrow">{sortIcon}</span>;
  };

  const TableHeader = ({ column, label }: { column: typeof sortBy; label: string }) => (
    <th onClick={() => handleSort(column)}>
      {label}
      <SortArrow column={column} />
    </th>
  );

  return (
    <div>
      <table>
        <thead>
          <tr>
            <TableHeader column="number" label="#" />
            <TableHeader column="start" label="Start date" />
            <TableHeader column="end" label="End date" />
            <TableHeader column="duration" label="Time spent" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((activation, idx) => (
            <tr key={idx}>
              <td>{activationsHistory.indexOf(activation) + 1}</td>
              <td>{activation.activation_date.toLocaleString()}</td>
              <td>{activation.end_date.toLocaleString()}</td>
              <td>{getDuration(activation) / (1000 * 60 * 60)} hours</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
