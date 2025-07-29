import { Network } from "@dappnode/types";
import { api, useApi } from "api";
import Button from "components/Button";
import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import Loading from "components/Loading";
import { relativePath } from "../data";
import { useNavigate } from "react-router-dom";
import { withToast } from "components/toast/Toast";
import { prettyDnpName } from "utils/format";
import "./beaconNodeBackup.scss";

export function BeaconNodeBackup({ isActivated }: { isActivated: boolean }) {
  const availableNetworks: Network[] = [Network.Mainnet];
  const [consensusLoading, setConsensusLoading] = useState(true);
  const [currentConsensus, setCurrentConsensus] = useState<Partial<Record<Network, string | null | undefined>>>({});

  const navigate = useNavigate();

  const currentConsensusReq = useApi.consensusClientsGetByNetworks({
    networks: availableNetworks
  });

  useEffect(() => {
    setConsensusLoading(currentConsensusReq.isValidating);
  }, [currentConsensusReq.isValidating]);

  useEffect(() => {
    if (currentConsensusReq.data) {
      setCurrentConsensus(currentConsensusReq.data);
    }
  }, [currentConsensusReq.data]);

  async function setBackupEnv() {
    const envs = {
      ["BACKUP_BEACON_NODES"]: "my-license-key"
    };

    const entries = Object.entries(currentConsensus) as [Network, string | null | undefined][];

    for (const [, dnpName] of entries) {
      if (!dnpName) continue; // Skip if dnpName is null or undefined

      await withToast(
        () =>
          api.packageSetEnvironment({
            dnpName,
            environmentByService: { ["beacon-chain"]: envs }
          }),
        {
          message: `Updating ${prettyDnpName(dnpName)} ENVs...`,
          onSuccess: `Updated ${prettyDnpName(dnpName)} ENVs`
        }
      );
    }
  }

  return (
    <div className="premium-beacon-backup-cont">
      <Card>
        <p>
          The beacon node backup ensures that all your imported Ethereum validators in Dappnode stay up when you have
          problems attesting. It backs you for 7 days to let you diagnose the issue, fix your setup and be back to
          normal without missing attestations.
        </p>
      </Card>

      {/* <div>
        <div>
          The maximum number of Ethereum validators to use the beacon node backup is 10. If you exceed this number we
          invite you to consolidate your validators to use the service.
        </div>
        <Button>Check Docs</Button>
      </div> */}

      {isActivated ? (
        consensusLoading ? (
          <Loading steps={[`Loading consensus data`]} />
        ) : (
          <>
            {" "}
            <div>
              Once the backup is activated, it will be used regardless of whether you deactivate it later. The backup is
              renewed monthly.
            </div>
            <Button onClick={() => setBackupEnv()}> Inject ENV</Button>
            <div>
              {Object.entries(currentConsensus).map(([network, client]) => (
                <NetworkSection key={network} network={network as Network} client={client} />
              ))}
            </div>
          </>
        )
      ) : (
        <>
          <div>Activate Premium to enable the beacon node bakcup.</div>
          <Button variant="dappnode" onClick={() => navigate("/" + relativePath)}>
            Activate Premium
          </Button>
        </>
      )}
    </div>
  );
}

const NetworkSection: React.FC<{ network: Network; client: string | null }> = ({ network, client }) => {
  return (
    <div>
      <h5>{network}</h5>
      {client ? (
        <div>Your current consensus: {prettyDnpName(client)}</div>
      ) : (
        <div>No consensus client set for this network</div>
      )}
    </div>
  );
};
