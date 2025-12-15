import { Network } from "@dappnode/types";
import { useApi } from "api";
import { useEffect, useMemo, useState } from "react";

export const availableNetworks: Network[] = [Network.Mainnet, Network.Gnosis, Network.Hoodi];

export type ConsensusInfo = {
  noConsensusSelected: boolean;
  isPrysmOrTeku: boolean;
  name: string | null | undefined;
};

export type BackupData = {
  isActive: boolean;
  activable: boolean;
  timeLeft: number;
  activeValidators: number;
  maxValidators: number;
  beaconApiError: boolean;
  timeUntilAvailable: number;
  nextAvailableDate: string | null;
  consensusInfo: ConsensusInfo | undefined;
  activationsHistory: { activation_date: Date; end_date: Date }[];
};

export function useBackupNodeData({
  hashedLicense,
  isPremiumActivated
}: {
  hashedLicense: string;
  isPremiumActivated: boolean;
}) {
  const [currentConsensus, setCurrentConsensus] = useState<Partial<Record<Network, ConsensusInfo>>>({});
  const [activeValidatorsCounts, setActiveValidatorsCounts] = useState<
    Partial<Record<Network, { count: number | null; limitExceeded: boolean; beaconApiError: boolean }>>
  >({});

  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork({ networks: availableNetworks });
  const currentConsensusReq = useApi.consensusClientsGetByNetworks({ networks: availableNetworks });
  const backupStatusReq = useApi.premiumBeaconBackupStatus(hashedLicense);

  const consensusLoading = currentConsensusReq.isValidating;
  const backupStatusLoading = isPremiumActivated ? backupStatusReq.isValidating : false;
  const backupStatusData = backupStatusReq.data;

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
        limitExceeded:
          count !== null && backupStatusData?.[network]?.validatorLimit !== undefined
            ? count > backupStatusData?.[network]?.validatorLimit
            : false
      };
    }

    setActiveValidatorsCounts(counts);
  }, [validatorsFilterActiveReq.data, backupStatusData]);

  useEffect(() => {
    if (currentConsensusReq.data) {
      const data = currentConsensusReq.data;
      const consensusInfo: Partial<Record<Network, ConsensusInfo>> = {};
      for (const [network, clientName] of Object.entries(data) as [Network, string | null | undefined][]) {
        consensusInfo[network] = {
          name: clientName,
          isPrysmOrTeku:
            clientName?.toLowerCase().includes("prysm") || clientName?.toLowerCase().includes("teku") || false,
          noConsensusSelected: !clientName ? true : false
        };
      }
      setCurrentConsensus(consensusInfo);
    }
  }, [currentConsensusReq.data]);

  const backupData: Partial<Record<Network, BackupData>> = useMemo(() => {
    return availableNetworks.reduce<Partial<Record<Network, BackupData>>>((acc, network) => {
      const backupStatus = backupStatusData?.[network];
      const activeValidatorsInfo = activeValidatorsCounts[network];
      const consensus = currentConsensus[network];
      const formattedActivationsHistory = backupStatus?.activationHistory
        ? backupStatus.activationHistory.map(({ activation_date, end_date }) => ({
            activation_date: new Date(activation_date),
            end_date: new Date(end_date)
          }))
        : [];

      acc[network] = {
        isActive: backupStatus?.isActive ?? false,
        activable: backupStatus?.isActivable ?? false,
        timeLeft: backupStatus?.timeLeft ?? 60,
        timeUntilAvailable: backupStatus?.isActivable ? 0 : 60,
        activeValidators: activeValidatorsInfo?.count ?? 0,
        maxValidators: backupStatus?.validatorLimit ?? 0,
        beaconApiError: activeValidatorsInfo?.beaconApiError ?? false,
        nextAvailableDate: null,
        consensusInfo: consensus,
        activationsHistory: formattedActivationsHistory
      };

      return acc;
    }, {});
  }, [currentConsensus, backupStatusData, activeValidatorsCounts]);

  return {
    backupData,
    consensusLoading,
    backupStatusLoading,
    revalidateBackup: backupStatusReq.revalidate
  };
}
