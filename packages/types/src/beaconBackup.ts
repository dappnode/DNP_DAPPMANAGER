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
