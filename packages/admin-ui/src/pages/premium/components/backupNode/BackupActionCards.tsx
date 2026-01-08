import React from "react";
import Button from "components/Button";
import { Card } from "react-bootstrap";

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
      <h5>Backup Node Status</h5>
      <h5 className="backup-status blue-text">Available</h5>
    </div>
    <div className="action-backup-col">
      <h5>Available time remaining</h5>
      <div className="countdown-time">{timeLeft}</div>
    </div>
    <div className="action-backup-col">
      {valLimitExceeded && <div className="color-danger">Validator limit exceeded</div>}
      {consensusPrysmOrTeku && <div className="color-danger error-text">Consensus not supported</div>}
      {noConsensusSelected && <div className="color-danger error-text">Select staking clients</div>}
      <Button
        variant="dappnode"
        onClick={activateBackup}
        disabled={valLimitExceeded || consensusPrysmOrTeku || noConsensusSelected}
      >
        Activate Backup
      </Button>
    </div>
  </Card>
);

export const DeactivateCard = ({ timeLeft, deactivateBackup }: { timeLeft: string; deactivateBackup: () => void }) => (
  <Card className="action-backup-card">
    <div className="action-backup-col">
      <h5>Backup Node Status</h5>
      <h5 className="backup-status green-text">Active</h5>
    </div>

    <div className="action-backup-col">
      <h5>Auto-deactivation in</h5>
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
      <h5>Backup Node Status</h5>
      <h5 className="backup-status orange-text">Cooldown</h5>
    </div>

    <div className="action-backup-col">
      <h5>Available again in</h5>
      <div className="countdown-time">{timeLeft}</div>
    </div>
    <div className="action-backup-col">
      <Button variant="dappnode" disabled={true} onClick={deactivateBackup}>
        Backup unavailable
      </Button>
    </div>
  </Card>
);
