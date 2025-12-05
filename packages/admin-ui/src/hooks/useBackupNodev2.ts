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
  activable: boolean;
  timeLeft: string;
  activeValidators: number;
  maxValidators: number;
  beaconApiError: boolean;
  nextAvailableDate: string | null;
  consensusInfo: ConsensusInfo | undefined;
  // activationsHistory: Array<{
  //   activation_date: string;
  //   end_date: string;
  // }>;
  activationsHistory: { activation_date: Date; end_date: Date }[];
};

export const useBackupNode2 = ({
  hashedLicense,
  isPremiumActivated
}: {
  hashedLicense: string;
  isPremiumActivated: boolean;
}) => {
  const [currentConsensus, setCurrentConsensus] = useState<Partial<Record<Network, ConsensusInfo>>>({});

  const [activeValidatorsCounts, setActiveValidatorsCounts] = useState<
    Partial<Record<Network, { count: number | null; limitExceeded: boolean; beaconApiError: boolean }>>
  >({});

  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork({ networks: availableNetworks });
  const currentConsensusReq = useApi.consensusClientsGetByNetworks({ networks: availableNetworks });
  const backupStatusReq = useApi.premiumBeaconBackupStatus("05f116fdb971e44f1c59fddc8a29954");

  const consensusLoading = currentConsensusReq.isValidating;
  const backupStatusLoading = isPremiumActivated ? backupStatusReq.isValidating : false;

  const backupStatusData = backupStatusReq.data;
  console.log("backupStatusReq data:", backupStatusData);

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
          // Check if the selected client is Prysm or Teku
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

      // Default activation history per network (used as fallback)
      const defaultActivationsHistory: Partial<Record<Network, { activation_date: Date; end_date: Date }[]>> = {
        [Network.Mainnet]: [
          { activation_date: new Date("2025-01-10T09:00:00Z"), end_date: new Date("2025-01-15T09:00:00Z") },
          { activation_date: new Date("2025-03-05T14:30:00Z"), end_date: new Date("2025-03-10T14:30:00Z") },
          { activation_date: new Date("2025-06-20T08:00:00Z"), end_date: new Date("2025-06-25T08:00:00Z") }
        ],
        [Network.Hoodi]: [
          { activation_date: new Date("2024-11-12T10:15:00Z"), end_date: new Date("2024-11-12T16:45:00Z") },
          { activation_date: new Date("2025-02-01T07:00:00Z"), end_date: new Date("2025-02-01T12:00:00Z") }
        ],
        [Network.Gnosis]: [
          { activation_date: new Date("2024-09-20T18:00:00Z"), end_date: new Date("2024-09-21T18:00:00Z") },
          { activation_date: new Date("2024-12-10T11:00:00Z"), end_date: new Date("2024-12-15T11:00:00Z") },
          { activation_date: new Date("2025-04-01T09:00:00Z"), end_date: new Date("2025-04-06T09:00:00Z") }
        ],
        [Network.Holesky]: []
      };

      acc[network] = {
        activable: backupStatus?.isActivable ?? false,
        timeLeft: backupStatus?.activeTimeLeft ?? "0d 0h 0m 0s",
        activeValidators: activeValidatorsInfo?.count ?? 0,
        maxValidators: backupStatus?.validatorLimit ?? 0,
        beaconApiError: activeValidatorsInfo?.beaconApiError ?? false,
        nextAvailableDate: null,
        consensusInfo: consensus,
        activationsHistory: defaultActivationsHistory[network] ?? []
      };

      return acc;
    }, {});
  }, [currentConsensus, backupStatusData, activeValidatorsCounts]);

  return {
    backupData,
    consensusLoading,
    currentConsensus,
    backupStatusLoading,
    activeValidatorsCounts
  };
};
