import { Network } from "@dappnode/types";
import { api, useApi } from "api";
import { withToast } from "components/toast/Toast";
import { useEffect, useState } from "react";
import { prettyDnpName } from "utils/format";
import { confirm } from "components/ConfirmDialog";

export const useBeaconNodeBackup = (
  hashedLicense: string
): {
  consensusLoading: boolean;
  currentConsensus: Partial<Record<Network, string | null | undefined>>;
  activateBackup: () => void;
  deactivateBackup: () => void;
  backupStatusLoading: boolean;
  backupActive: boolean;
  backupActivable: boolean;
  secondsUntilActivable?: number;
  secondsUntilDeactivation?: number;
  formatCountdown: (totalSeconds?: number) => string | undefined;
} => {
  const availableNetworks: Network[] = [Network.Mainnet, Network.Hoodi];
  const activeValidatorLimit = 10; // Max validators for backup
  const backupEnvName = "BACKUP_BEACON_NODES";
  const beaconChainServiceName = "validator";

  const [consensusLoading, setConsensusLoading] = useState(true);
  const [currentConsensus, setCurrentConsensus] = useState<Partial<Record<Network, string | null | undefined>>>({});
  const [backupStatusLoading, setBackupStatusLoading] = useState(true);
  const [backupActive, setBackupActive] = useState<boolean>(false);
  const [backupActivable, setBackupActivable] = useState<boolean>(false);
  const [secondsUntilActivable, setSecondsUntilActivable] = useState<number | undefined>(undefined);
  const [secondsUntilDeactivation, setSecondsUntilDeactivation] = useState<number | undefined>(undefined);
  const [activeValidators, setActiveValidators] = useState<number>(0);

  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork({
    networks: availableNetworks
  });

  useEffect(() => {
    type ActiveByNetwork = Partial<Record<Network, string[] | null>>;
    function totalActiveCount(map: ActiveByNetwork): number {
      return Object.values(map).reduce((sum, v) => sum + (Array.isArray(v) ? v.length : 0), 0);
    }
    if (validatorsFilterActiveReq.data === undefined) return;

    console.log("Active validators data:", validatorsFilterActiveReq.data);
    const count = totalActiveCount(validatorsFilterActiveReq.data as ActiveByNetwork);
    console.log("Active validators count:", count);
    setActiveValidators(count);
  }, [validatorsFilterActiveReq.data]);

  const currentConsensusReq = useApi.consensusClientsGetByNetworks({
    networks: availableNetworks
  });

  const backupStatusReq = useApi.premiumBeaconBackupStatus(hashedLicense);

  useEffect(() => {
    setConsensusLoading(currentConsensusReq.isValidating);
  }, [currentConsensusReq.isValidating]);

  useEffect(() => {
    setBackupStatusLoading(backupStatusReq.isValidating);
  }, [backupStatusReq.isValidating]);

  useEffect(() => {
    if (currentConsensusReq.data) {
      setCurrentConsensus(currentConsensusReq.data);
    }
  }, [currentConsensusReq.data]);

  useEffect(() => {
    if (backupStatusReq.data) {
      setBackupActive(backupStatusReq.data.isActive);
      setSecondsUntilActivable(backupStatusReq.data.secondsUntilActivable);
      setBackupActivable(backupStatusReq.data.isActivable);
      setSecondsUntilDeactivation(backupStatusReq.data.secondsUntilDeactivation);
    }
  }, [backupStatusReq.data]);

  // useEffect to update the seconds until activable and deactivation without revalidating the request
  // revalidating if the seconds reach < 1
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsUntilActivable((prev) => {
        if (typeof prev === "number") {
          if (prev <= 0) {
            backupStatusReq.revalidate();
            return undefined;
          }
          return prev - 1;
        }
        return prev;
      });

      setSecondsUntilDeactivation((prev) => {
        if (typeof prev === "number") {
          if (prev <= 0) {
            backupStatusReq.revalidate();
            return undefined;
          }
          return prev - 1;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
    backupStatusReq.revalidate();
  };

  const deactivate = async () => {
    if (!hashedLicense) {
      throw new Error("Hashed license is required to activate beacon backup");
    }
    await api.premiumBeaconBackupDeactivate(hashedLicense);
    await setBackupEnv("deactivate");
    backupStatusReq.revalidate();
  };

  const activateBackup = () => {
    withToast(() => activate(), {
      message: `Activating Backup node...`,
      onSuccess: `Backup node activated`,
      onError: `Error while activating Backup node`
    });
  };

  const deactivateBackup = () => {
    confirm({
      title: `Deactivating Backup node`,
      text: `Deactivating the Backup node is not reversible until it is renewed. Once deactivated, it cannot be reactivated until ${formatCountdown(
        secondsUntilActivable
      )}.`,
      label: "Deactivate",
      variant: "danger",
      onClick: () =>
        withToast(() => deactivate(), {
          message: `Deactivating Backup node...`,
          onSuccess: `Backup node deactivated`,
          onError: `Error while deactivating Backup node`
        })
    });
  };

  const formatCountdown = (totalSeconds?: number): string | undefined => {
    if (totalSeconds === undefined) return undefined;
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return {
    consensusLoading,
    currentConsensus,
    activateBackup,
    deactivateBackup,
    backupStatusLoading,
    backupActive,
    backupActivable,
    secondsUntilActivable,
    secondsUntilDeactivation,
    formatCountdown
  };
};
