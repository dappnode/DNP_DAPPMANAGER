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
        timeLeft: "5d 23h 12m 44s",
        activeValidators: 5,
        maxValidators: 10,
        beaconApiError: false,
        nextAvailableDate: null,
        consensusInfo: currentConsensus[Network.Mainnet],
        activationsHistory: [
          { activation_date: new Date("2025-01-10T09:00:00Z"), end_date: new Date("2025-01-15T09:00:00Z") },
          { activation_date: new Date("2025-03-05T14:30:00Z"), end_date: new Date("2025-03-10T14:30:00Z") },
          { activation_date: new Date("2025-06-20T08:00:00Z"), end_date: new Date("2025-06-25T08:00:00Z") }
        ]
      },
      [Network.Hoodi]: {
        activable: true,
        timeLeft: "2d 10h 5m 30s",
        activeValidators: 9,
        maxValidators: 10,
        beaconApiError: true,
        nextAvailableDate: null,
        consensusInfo: currentConsensus[Network.Hoodi],
        activationsHistory: [
          { activation_date: new Date("2024-11-12T10:15:00Z"), end_date: new Date("2024-11-12T16:45:00Z") },
          { activation_date: new Date("2025-02-01T07:00:00Z"), end_date: new Date("2025-02-01T12:00:00Z") }
        ]
      },
      [Network.Gnosis]: {
        activable: true,
        timeLeft: "5d 23h 12m 44s",
        activeValidators: 234,
        maxValidators: 100,
        beaconApiError: false,
        nextAvailableDate: null,
        consensusInfo: currentConsensus[Network.Gnosis],
        activationsHistory: [
          { activation_date: new Date("2024-09-20T18:00:00Z"), end_date: new Date("2024-09-21T18:00:00Z") },
          { activation_date: new Date("2024-12-10T11:00:00Z"), end_date: new Date("2024-12-15T11:00:00Z") },
          { activation_date: new Date("2025-04-01T09:00:00Z"), end_date: new Date("2025-04-06T09:00:00Z") }
        ]
      },
      [Network.Holesky]: {
        activable: true,
        timeLeft: "0",
        activeValidators: 35,
        maxValidators: 15,
        beaconApiError: false,
        nextAvailableDate: null,
        consensusInfo: currentConsensus[Network.Holesky],
        activationsHistory: [
          { activation_date: new Date("2025-05-10T13:00:00Z"), end_date: new Date("2025-05-10T18:00:00Z") },
          { activation_date: new Date("2025-07-22T06:00:00Z"), end_date: new Date("2025-07-22T12:00:00Z") }
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
