export type BeaconBackupNetworkStatus = {
  validatorLimit: number;
  isActivable: boolean;
  secondsUntilActivable?: number;
  isActive: boolean;
  secondsUntilDeactivation?: number;
  activationHistory?: Array<{
    activation_date: string;
    end_date: string;
  }>;
  activeTimeLeft: string;
};
