import {
  PackageReleaseMetadata,
  UserSettings,
  SetupWizard,
  SpecialPermission,
  InstalledPackageDetailData,
  PackageContainer
} from "../../../common";

export { PortProtocol } from "../../../common";

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
}
