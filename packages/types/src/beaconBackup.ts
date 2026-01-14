import { Network } from "./stakers.js";

export type BeaconBackupNetworkStatus = {
  validatorLimit: number;
  isActivable: boolean;
  isActive: boolean;
  activationHistory?: Array<{
    activation_date: string;
    end_date: string;
  }>;
  timeLeft: number;
  timeUntilAvailable: number;
};

/**
 * Parameters for beacon backup activation/deactivation
 */
export type BeaconBackupActivationParams = {
  key: string;
  network: Network;
};

export type ConsensusInfo = {
  noConsensusSelected: boolean;
  isPrysmOrTeku: boolean;
  name: string | null | undefined;
};

/**
 * Type used in the admin UI to show parsed backup data for a network
 */
export type ParsedNetworkBackupData = BeaconBackupNetworkStatus & {
  activeValidators: number;
  beaconApiError: boolean;
  consensusInfo?: ConsensusInfo;
  activationHistoryParsed: { activation_date: Date; end_date: Date }[];
};
