import {
  PackageReleaseMetadata,
  UserSettings,
  SetupWizard,
  SpecialPermission,
  InstalledPackageDetailData
} from "../../../src/types";

export interface MockDnp {
  metadata: PackageReleaseMetadata;
  avatar?: string;
  userSettings?: UserSettings;
  setupWizard?: SetupWizard;
  specialPermissions?: SpecialPermission[];
  gettingStarted?: string;
  dependencies?: MockDnp[];
  installedData?: Partial<InstalledPackageDetailData>;
}
