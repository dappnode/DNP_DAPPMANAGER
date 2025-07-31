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
    backupActive,
    backupActivable,
    activateBackup,
    deactivateBackup,
    timeUntilActivable,
    timeUntilDeactivation
  } = useBeaconNodeBackup(hashedLicense);

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
            </div>
          ) : (
            <div>Activate Premium to enable the beacon node backup.</div>
          )}
        </div>
        {isPremium ? (
          <Button
            variant="dappnode"
            onClick={() => console.log("Activate Beacon Node Backup")}
            disabled={consensusLoading}
          >
            Activate Backup
          </Button>
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
          <Button variant="warning">Check Docs</Button>
        </div>
      </Alert>
      {isPremium &&
        (consensusLoading ? (
          <Loading steps={[`Loading consensus data`]} />
        ) : (
          <>
            <div>
              <h5>Beacon Backup Nodes Available</h5>
              {Object.entries(currentConsensus).map(([network, client]) => (
                <NetworkSection key={network} network={network as Network} client={client} />
              ))}
            </div>
            <Button onClick={activateBackup}> Activate Backup</Button>
            <Button onClick={deactivateBackup}>Deactivate Backup</Button>
          </>
        ))}

      <div>
        <div>Backup Status Loading? {backupStatusLoading ? "true" : "false"}</div>
        <div>Backup activable? {backupActivable ? "true" : "false"}</div>
        <div>timeUntilActivable? {timeUntilActivable}</div>
        <div>Backup active? {backupActive ? "true" : "false"}</div>
        <div>timeUntilDeactivation? {timeUntilDeactivation}</div>
      </div>
    </div>
  );
}

const NetworkSection: React.FC<{ network: Network; client: string | null }> = ({ network, client }) => {
  return (
    <>
      <Card>
        {client ? (
          <div>
            <h5>{capitalize(network)}</h5>
            <div>
              Selected consensus client: <b>{prettyDnpName(client)}</b>
            </div>
          </div>
        ) : (
          <div>No consensus client set for this network</div>
        )}
      </Card>
    </>
  );
};
