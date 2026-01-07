import React from "react";

import SubTitle from "components/SubTitle";
import { Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { MdGroup, MdInfoOutline, MdWarningAmber } from "react-icons/md";
import { ConsensusInfo } from "hooks/premium/useBackupNodeData";

import "./networkBackup.scss";
import { prettyDnpName } from "utils/format";
import { Link } from "react-router-dom";
import { Network } from "@dappnode/types";
import { basePath as stakersBasePath } from "pages/stakers/data";
import { capitalize } from "utils/strings";
import { docsUrl } from "params";
import newTabProps from "utils/newTabProps";

export const ConsensusCard = ({
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

export const ValidatorsCard = ({
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
