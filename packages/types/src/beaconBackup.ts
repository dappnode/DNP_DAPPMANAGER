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
