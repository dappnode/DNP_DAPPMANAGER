import { Network } from "@dappnode/types";
import Button from "components/Button";
import React from "react";
import { Alert, Card } from "react-bootstrap";
import Loading from "components/Loading";
import { relativePath } from "../data";
import { useNavigate } from "react-router-dom";
import { prettyDnpName } from "utils/format";
import { useBeaconNodeBackup } from "hooks/useBeaconNodeBackup";
import { capitalize } from "utils/strings";
import "./beaconNodeBackup.scss";

export function BeaconNodeBackup({
  isActivated: isPremium,
  hashedLicense
}: {
  isActivated: boolean;
  hashedLicense: string;
}) {
  const navigate = useNavigate();
  const {
    consensusLoading,
    currentConsensus,
    backupStatusLoading,
    backupActivable,
    backupActive,
    activateBackup,
    deactivateBackup,
    secondsUntilActivable,
    secondsUntilDeactivation,
    formatCountdown
  } = useBeaconNodeBackup(hashedLicense);

  if (consensusLoading || backupStatusLoading) {
    return <Loading steps={["Loading beacon node backup data"]} />;
  }

  return (
    <div className="premium-beacon-backup-cont">
      <Card className="premium-activate-backup-card">
        <div>
          <p>
            The beacon node backup ensures that all your imported Ethereum validators in Dappnode stay up when you have
            problems attesting. It backs you for 7 days to let you diagnose the issue, fix your setup and be back to
            normal without missing attestations.
          </p>
          {isPremium ? (
            <div>
              Once the backup is activated, it will be used regardless of whether you deactivate it later. The backup is
              renewed monthly.
              {!backupActive && secondsUntilActivable !== undefined && (
                <div>
                  <br />
                  <div>Time remaining until backup available:</div>
                  <div className="premium-beacon-backup-countdown">
                    <b>{formatCountdown(secondsUntilActivable)}</b>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>Activate Premium to enable the beacon node backup.</div>
          )}
        </div>
        {isPremium ? (
          backupActivable && (
            <Button variant="dappnode" onClick={activateBackup} disabled={consensusLoading || backupStatusLoading}>
              Activate Backup
            </Button>
          )
        ) : (
          <Button variant="dappnode" onClick={() => navigate("/" + relativePath)}>
            Activate Premium
          </Button>
        )}
      </Card>

      <Alert variant="warning">
        <div className="premium-beacon-backup-alert">
          <div>
            The maximum number of Ethereum validators to use the beacon node backup is 10. If you exceed this number we
            invite you to consolidate your validators to use the service.
          </div>
        </div>
      </Alert>

      {backupActive && (
        <Card className="premium-backup-active-card">
          <div className="premium-backup-active-col">
            <h5>Backup active</h5>
            {secondsUntilDeactivation !== undefined && (
              <div>
                <div>Backup time remaining:</div>
                <div className="premium-beacon-backup-countdown">
                  <b>{formatCountdown(secondsUntilDeactivation)}</b>
                </div>
              </div>
            )}
          </div>
          <Button variant="danger" onClick={deactivateBackup} disabled={consensusLoading || backupStatusLoading}>
            Stop Backup
          </Button>
        </Card>
      )}

      {isPremium && (
        <>
          <div>
            <h5>Beacon Backup Nodes Available</h5>
            {Object.entries(currentConsensus).map(([network, client]) => (
              <NetworkSection key={network} network={network as Network} client={client} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const NetworkSection: React.FC<{ network: Network; client: string | null }> = ({ network, client }) => {
  return (
    <>
      <Card>
        <div>
          <h5>{capitalize(network)}</h5>
          {client ? (
            <div>
              Selected consensus client: <b>{prettyDnpName(client)}</b>
            </div>
          ) : (
            <div>No consensus client set for {network} network</div>
          )}
        </div>
      </Card>
    </>
  );
};
