import { Network } from "@dappnode/types";
import { api, useApi } from "api";
import { withToast } from "components/toast/Toast";
import { useEffect, useMemo, useState } from "react";
import { prettyDnpName } from "utils/format";
import { confirm } from "components/ConfirmDialog";

const availableNetworks: Network[] = [Network.Mainnet, Network.Hoodi, Network.Gnosis];
const backupEnvName = "BACKUP_BEACON_NODES";
const beaconChainServiceName = "validator";

export const useBackupNode = ({
  hashedLicense,
  isPremiumActivated
}: {
  hashedLicense: string;
  isPremiumActivated: boolean;
}) => {
  const [currentConsensus, setCurrentConsensus] = useState<Partial<Record<Network, string | null | undefined>>>({});

  const [anyPrysmOrTekuActive, setAnyPrysmOrTekuActive] = useState(false);
  const [allPrysmOrTekuActive, setAllPrysmOrTekuActive] = useState(false);

  const [backupStatusError, setBackupStatusError] = useState<string | null>(null);
  const [backupActive, setBackupActive] = useState<boolean>(false);
  const [backupActivable, setBackupActivable] = useState<boolean>(false);
  const [secondsUntilActivable, setSecondsUntilActivable] = useState<number | undefined>(undefined);
  const [secondsUntilDeactivation, setSecondsUntilDeactivation] = useState<number | undefined>(undefined);
  const [validatorLimit, setValidatorLimit] = useState<number | undefined>(undefined);
  const [activeValidatorsCounts, setActiveValidatorsCounts] = useState<
    Partial<Record<Network, { count: number | null; limitExceeded: boolean; beaconApiError: boolean }>>
  >({});

  const networksParam = useMemo(() => ({ networks: availableNetworks }), []);

  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork(networksParam);
  const currentConsensusReq = useApi.consensusClientsGetByNetworks(networksParam);
  const backupStatusReq = useApi.premiumBeaconBackupStatus(hashedLicense);

  const consensusLoading = currentConsensusReq.isValidating;
  const backupStatusLoading = isPremiumActivated ? backupStatusReq.isValidating : false;

  useEffect(() => {
    const data = validatorsFilterActiveReq.data;
    if (data === undefined) return;

    const counts: Partial<Record<
      Network,
      { count: number | null; limitExceeded: boolean; beaconApiError: boolean }
    >> = {};

    for (const [network, res] of Object.entries(data) as [
      Network,
      { validators: string[]; beaconError: Error } | null
    ][]) {
      const count = Array.isArray(res?.validators) ? res?.validators.length : null;
      const beaconApiError = res?.beaconError !== undefined;

      counts[network] = {
        count,
        beaconApiError,
        limitExceeded: count !== null && validatorLimit !== undefined ? count > validatorLimit : false
      };
    }

    setActiveValidatorsCounts(counts);
  }, [validatorsFilterActiveReq.data, validatorLimit]);

  useEffect(() => {
    if (currentConsensusReq.data) {
      setCurrentConsensus(currentConsensusReq.data);

      const clients = Object.values(currentConsensusReq.data).filter(Boolean) as string[];

      setAnyPrysmOrTekuActive(
        clients.some((client) => {
          const ccName = client.toLowerCase();
          return ccName.includes("prysm") || ccName.includes("teku");
        })
      );

      setAllPrysmOrTekuActive(
        clients.length > 0 &&
          clients.every((client) => {
            const ccName = client.toLowerCase();
            return ccName.includes("prysm") || ccName.includes("teku");
          })
      );
    }
  }, [currentConsensusReq.data]);

  useEffect(() => {
    if (backupStatusReq.data) {
      setValidatorLimit(backupStatusReq.data.validatorLimit);
      setBackupActive(backupStatusReq.data.isActive);
      setSecondsUntilActivable(backupStatusReq.data.secondsUntilActivable);
      setBackupActivable(backupStatusReq.data.isActivable);
      setSecondsUntilDeactivation(backupStatusReq.data.secondsUntilDeactivation);
    }
  }, [backupStatusReq.data]);

  useEffect(() => {
    if (backupStatusReq.error) {
      console.log("Backup status error", backupStatusReq.error);
      const errorMessage =
        backupStatusReq.error instanceof Error ? backupStatusReq.error.message : "Unknown error occurred";
      setBackupStatusError(errorMessage);
    } else {
      setBackupStatusError(null);
    }
  }, [backupStatusReq.error]);

  // countdown interval not depending on backupStatusReq
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
      if (!dnpName) continue;
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
    if (!hashedLicense) throw new Error("Hashed license is required to activate beacon backup");
    await api.premiumBeaconBackupActivate(hashedLicense);
    await setBackupEnv("activate");
    backupStatusReq.revalidate();
  };

  const deactivate = async () => {
    if (!hashedLicense) throw new Error("Hashed license is required to activate beacon backup");
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
    anyPrysmOrTekuActive,
    allPrysmOrTekuActive,
    activateBackup,
    deactivateBackup,
    backupStatusLoading,
    backupStatusError,
    backupActive,
    backupActivable,
    secondsUntilActivable,
    secondsUntilDeactivation,
    formatCountdown,
    activeValidatorsCounts,
    validatorLimit
  };
};
