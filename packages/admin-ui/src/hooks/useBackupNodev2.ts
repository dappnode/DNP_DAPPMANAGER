import { Network } from "@dappnode/types";
import { useApi } from "api";

import { useEffect, useMemo, useState } from "react";

export const availableNetworks: Network[] = [Network.Mainnet, Network.Hoodi, Network.Gnosis, Network.Holesky];

export type ConsensusInfo = {
  noConsensusSelected: boolean;
  isPrysmOrTeku: boolean;
  name: string | null | undefined;
};

export type BackupData = {
  activable: boolean;
  activeValidators: number;
  maxValidators: number;
  beaconApiError: boolean;
  nextAvailableDate: string | null;
  consensusInfo: ConsensusInfo | undefined;
  // activationsHistory: Array<{
  //   activation_date: string;
  //   end_date: string;
  // }>;
  activationsHistory: string[];
};

export const useBackupNode2 = ({
  hashedLicense,
  isPremiumActivated
}: {
  hashedLicense: string;
  isPremiumActivated: boolean;
}) => {
  console.log("useBackupNode2 called with", { hashedLicense, isPremiumActivated });

  const [currentConsensus, setCurrentConsensus] = useState<Partial<Record<Network, ConsensusInfo>>>({});

  const [activeValidatorsCounts, setActiveValidatorsCounts] = useState<
    Partial<Record<Network, { count: number | null; limitExceeded: boolean; beaconApiError: boolean }>>
  >({});

  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork({ networks: availableNetworks });
  const currentConsensusReq = useApi.consensusClientsGetByNetworks({ networks: availableNetworks });
  // const backupStatusReq = useApi.premiumBeaconBackupStatus(hashedLicense);

  const consensusLoading = currentConsensusReq.isValidating;
  // const backupStatusLoading = isPremiumActivated ? backupStatusReq.isValidating : false;

  const validatorLimit = 10; // Placeholder for validator limit
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

  const fakeBackupData: Partial<Record<Network, BackupData | undefined>> = useMemo(
    () => ({
      [Network.Mainnet]: {
        activable: true,
        activeValidators: 5,
        maxValidators: 10,
        beaconApiError: false,
        nextAvailableDate: null,
        consensusInfo: currentConsensus[Network.Mainnet],
        activationsHistory: [
          // { activation_date: "2025-10-10T12:00:00Z", end_date: "2025-10-15T12:00:00Z" },
          // { activation_date: "2025-10-20T08:00:00Z", end_date: "2025-10-25T08:00:00Z" }
          "November 1, 2023 - 12:00 - 5 hours 23 minutes",
          "December 15, 2023 - 09:30 - 3 hours 45 minutes"
        ]
      },
      [Network.Hoodi]: {
        activable: true,
        activeValidators: 9,
        maxValidators: 10,
        beaconApiError: true,
        nextAvailableDate: null,
        consensusInfo: currentConsensus[Network.Hoodi],
        activationsHistory: [
          "November 1, 2023 - 12:00 - 5 hours 23 minutes",
          "December 15, 2023 - 09:30 - 3 hours 45 minutes"
        ]
      },
      [Network.Gnosis]: {
        activable: true,
        activeValidators: 234,
        maxValidators: 100,
        beaconApiError: false,
        nextAvailableDate: null,
        consensusInfo: currentConsensus[Network.Gnosis],
        activationsHistory: [
          "November 1, 2023 - 12:00 - 5 hours 23 minutes",
          "December 15, 2023 - 09:30 - 3 hours 45 minutes"
        ]
      },
      [Network.Holesky]: {
        activable: true,
        activeValidators: 35,
        maxValidators: 15,
        beaconApiError: false,
        nextAvailableDate: null,
        consensusInfo: currentConsensus[Network.Holesky],
        activationsHistory: [
          "November 1, 2023 - 12:00 - 5 hours 23 minutes",
          "December 15, 2023 - 09:30 - 3 hours 45 minutes"
        ]
      }
    }),
    [currentConsensus]
  );

  return {
    fakeBackupData,
    consensusLoading,
    currentConsensus,

    activeValidatorsCounts,
    validatorLimit
  };
};
