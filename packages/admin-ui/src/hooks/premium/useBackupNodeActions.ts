import { Network } from "@dappnode/types";
import { api } from "api";
import { withToast } from "components/toast/Toast";
import { useEffect, useState, useRef } from "react";
import { confirm } from "components/ConfirmDialog";
import { prettyDnpName } from "utils/format";

const backupEnvName = "BACKUP_BEACON_NODES";
const beaconChainServiceName = "validator";

export function useBackupNodeActions({
  network,
  hashedLicense,
  timeLeftInitial,
  isActive,
  isActivable,
  timeUntilAvailableInitial,
  currentConsensus,
  revalidate
}: {
  network: Network;
  hashedLicense: string;
  isActive: boolean;
  isActivable: boolean;
  timeLeftInitial: number;
  timeUntilAvailableInitial: number;
  currentConsensus: string | undefined;
  revalidate: () => Promise<boolean>;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(timeLeftInitial);
  const [timeUntilAvailable, setTimeUntilAvailable] = useState<number>(timeUntilAvailableInitial);

  // Prevent multiple revalidates
  const hasRevalidatedTimeLeft = useRef(false);
  const hasRevalidatedTimeUntil = useRef(false);

  useEffect(() => {
    setTimeLeft(timeLeftInitial);
    setTimeUntilAvailable(timeUntilAvailableInitial);
    hasRevalidatedTimeLeft.current = false;
    hasRevalidatedTimeUntil.current = false;
  }, [timeLeftInitial, timeUntilAvailableInitial]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive) {
        setTimeLeft((prev) => {
          if (prev > 0) return prev - 1;
          if (!hasRevalidatedTimeLeft.current) {
            hasRevalidatedTimeLeft.current = true;
            revalidate();
          }
          return 0;
        });
      } else if (!isActivable) {
        setTimeUntilAvailable((prev) => {
          if (prev > 0) return prev - 1;
          if (!hasRevalidatedTimeUntil.current) {
            hasRevalidatedTimeUntil.current = true;
            revalidate();
          }
          return 0;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isActivable, revalidate]);

  const formatCountdown = (totalSeconds?: number): string => {
    if (totalSeconds === undefined) return "0d 0h 0m 0s";
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const setBackupEnv = async (type: "activate" | "deactivate") => {
    if (!hashedLicense) {
      throw new Error("Hashed license is required to set backup environment");
    }

    if (!currentConsensus) return;
    const envValue = type === "activate" ? `https://${hashedLicense}:@${network}.beacon.dappnode.io` : "";
    const env = {
      [backupEnvName]: envValue
    };

    await withToast(
      () =>
        api.packageSetEnvironment({
          dnpName: currentConsensus,
          environmentByService: { [beaconChainServiceName]: env }
        }),
      {
        message: `Updating ${prettyDnpName(currentConsensus)} ENVs...`,
        onSuccess: `Updated ${prettyDnpName(currentConsensus)} ENVs`
      }
    );
  };

  const activate = async () => {
    if (!hashedLicense) throw new Error("Hashed license is required to activate beacon backup");
    await api.premiumBeaconBackupActivate({ key: hashedLicense, network });
    await setBackupEnv("activate");
    revalidate();
  };

  const deactivate = async () => {
    if (!hashedLicense) throw new Error("Hashed license is required to activate beacon backup");
    await api.premiumBeaconBackupDeactivate({ key: hashedLicense, network });
    await setBackupEnv("deactivate");
    revalidate();
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
      text: `Once deactivated, you'll have ${formatCountdown(timeLeft)} until its fully renewed again.`,
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

  return { timeLeft, timeUntilAvailable, formatCountdown, activateBackup, deactivateBackup };
}
