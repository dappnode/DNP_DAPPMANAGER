import React from "react";
import Button from "components/Button";

import SubTitle from "components/SubTitle";
import { Card } from "react-bootstrap";
import { MdOutlineAccessTime, MdOutlineBackup, MdOutlineCheckCircleOutline } from "react-icons/md";

import "./networkBackup.scss";

export const ActivateCard = ({
  timeLeft,
  valLimitExceeded,
  noConsensusSelected,
  consensusPrysmOrTeku,
  activateBackup
}: {
  timeLeft: string;
  valLimitExceeded: boolean;
  noConsensusSelected: boolean;
  consensusPrysmOrTeku: boolean;
  activateBackup: () => void;
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
      onClick={activateBackup}
      disabled={valLimitExceeded || consensusPrysmOrTeku || noConsensusSelected}
    >
      Activate Backup
    </Button>
    {valLimitExceeded && <div className="color-danger">Validator limit exceeded</div>}
    {consensusPrysmOrTeku && <div className="color-danger">Clients are not supported</div>}
    {noConsensusSelected && <div className="color-danger">No staking clients selected</div>}
  </Card>
);

export const DeactivateCard = ({ timeLeft, deactivateBackup }: { timeLeft: string; deactivateBackup: () => void }) => (
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
    <Button variant="danger" onClick={deactivateBackup}>
      Stop Backup
    </Button>
  </Card>
);

export const CooldownCard = ({ timeLeft, deactivateBackup }: { timeLeft: string; deactivateBackup: () => void }) => (
  <Card className="action-backup-card">
    <div className="action-backup-col">
      <MdOutlineAccessTime className="orange-text action-icon" />
      <SubTitle className="orange-text">Cooldown Period</SubTitle>
    </div>
    <div>Backup cannot be reactivated during cooldown</div>

    <div className="action-backup-col">
      <div className="countdown-text">Available again in</div>
      <div className="countdown-time">{timeLeft}</div>
    </div>

    <Button variant="dappnode" disabled={true} onClick={deactivateBackup}>
      Backup unavailable
    </Button>
  </Card>
);
