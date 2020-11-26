import {
  PackageReleaseMetadata,
  UserSettings,
  SetupWizard,
  SpecialPermission,
  InstalledPackageDetailData,
  PackageContainer,
  DirectoryItemOk
} from "../../../src/types";

export interface MockDnp {
  metadata: PackageReleaseMetadata;
  avatar?: string;
  userSettings?: UserSettings;
  setupWizard?: SetupWizard;
  specialPermissions?: SpecialPermission[];
  gettingStarted?: string;
  dependencies?: MockDnp[];
  installedData?: Partial<
    InstalledPackageDetailData & { containers: PackageContainer[] }
  >;
  installedContainers?: { [serviceName: string]: Partial<PackageContainer> };
  directory?: Partial<DirectoryItemOk>;
}
