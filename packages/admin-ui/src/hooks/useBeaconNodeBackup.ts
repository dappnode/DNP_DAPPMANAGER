import { Network } from "@dappnode/types";
import { api, useApi } from "api";
import { withToast } from "components/toast/Toast";
import { useEffect, useState } from "react";
import { prettyDnpName } from "utils/format";

export const useBeaconNodeBackup = (
  hashedLicense: string
): {
  consensusLoading: boolean;
  currentConsensus: Partial<Record<Network, string | null | undefined>>;
  activateBackup: () => Promise<void>;
  deactivateBackup: () => Promise<void>;
  backupStatusLoading: boolean;
  backupActive: boolean;
  backupActivable: boolean;
  timeUntilActivable?: string;
  timeUntilDeactivation?: string;
} => {
  const availableNetworks: Network[] = [Network.Mainnet];
  const backupEnvName = "BACKUP_BEACON_NODES";
  const beaconChainServiceName = "beacon-chain";

  const [consensusLoading, setConsensusLoading] = useState(true);
  const [currentConsensus, setCurrentConsensus] = useState<Partial<Record<Network, string | null | undefined>>>({});
  const [backupStatusLoading, setBackupStatusLoading] = useState(true);
  const [backupActive, setBackupActive] = useState<boolean>(false);
  const [backupActivable, setBackupActivable] = useState<boolean>(false);
  const [timeUntilActivable, setTimeUntilActivable] = useState<string | undefined>(undefined);
  const [timeUntilDeactivation, setTimeUntilDeactivation] = useState<string | undefined>(undefined);

  const currentConsensusReq = useApi.consensusClientsGetByNetworks({
    networks: availableNetworks
  });

  const BackupStatusReq = useApi.premiumBeaconBackupStatus(hashedLicense);

  useEffect(() => {
    setConsensusLoading(currentConsensusReq.isValidating);
  }, [currentConsensusReq.isValidating]);

  useEffect(() => {
    setBackupStatusLoading(BackupStatusReq.isValidating);
  }, [BackupStatusReq.isValidating]);

  useEffect(() => {
    if (currentConsensusReq.data) {
      setCurrentConsensus(currentConsensusReq.data);
    }
  }, [currentConsensusReq.data]);

  useEffect(() => {
    if (BackupStatusReq.data) {
      console.log("Backup Status Data:", BackupStatusReq.data);

      setBackupActive(BackupStatusReq.data.isActive);
      setTimeUntilActivable(BackupStatusReq.data.timeUntilActivable);
      setBackupActivable(BackupStatusReq.data.isActivable);
      setTimeUntilDeactivation(BackupStatusReq.data.timeUntilDeactivation);
    }
  }, [BackupStatusReq.data]);

  const setBackupEnv = async (type: "activate" | "deactivate") => {
    if (!hashedLicense) {
      throw new Error("Hashed license is required to set backup environment");
    }

    const entries = Object.entries(currentConsensus) as [Network, string | null | undefined][];

    for (const [network, dnpName] of entries) {
      if (!dnpName) continue; // Skip if dnpName is null or undefined
      const envValue = type === "activate" ? `https://${hashedLicense}:@${network}.beacon.dappnode.io` : "";
      const env = {
        [backupEnvName]: envValue
      };

      await withToast(
        () =>
          api.packageSetEnvironment({
            dnpName,
            environmentByService: { [beaconChainServiceName]: env }
          }),
        {
          message: `Updating ${prettyDnpName(dnpName)} ENVs...`,
          onSuccess: `Updated ${prettyDnpName(dnpName)} ENVs`
        }
      );
    }
  };

  const activate = async () => {
    if (!hashedLicense) {
      throw new Error("Hashed license is required to activate beacon backup");
    }
    await api.premiumBeaconBackupActivate(hashedLicense);
    await setBackupEnv("activate");
    BackupStatusReq.revalidate();
  };

  const deactivate = async () => {
    if (!hashedLicense) {
      throw new Error("Hashed license is required to activate beacon backup");
    }
    await api.premiumBeaconBackupDeactivate(hashedLicense);
    await setBackupEnv("deactivate");
    BackupStatusReq.revalidate();
  };

  const activateBackup = async () => {
    await withToast(() => activate(), {
      message: `Activating Beacon Node Backup...`,
      onSuccess: `Beacon Node Backup activated`,
      onError: `Error while activating Beacon Node Backup`
    });
  };

  const deactivateBackup = async () => {
    await withToast(() => deactivate(), {
      message: `Deactivating Beacon Node Backup...`,
      onSuccess: `Beacon Node Backup deactivated`,
      onError: `Error while deactivating Beacon Node Backup`
    });
  };

  return {
    consensusLoading,
    currentConsensus,
    activateBackup,
    deactivateBackup,
    backupStatusLoading,
    backupActive,
    backupActivable,
    timeUntilActivable,
    timeUntilDeactivation
  };
};
