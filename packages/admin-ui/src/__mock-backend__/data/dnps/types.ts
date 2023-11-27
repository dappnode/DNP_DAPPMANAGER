import {
  UserSettings,
  SpecialPermission,
  InstalledPackageDetailData,
  PackageContainer,
  RequestedDnp,
  Manifest,
  SetupWizard
} from "@dappnode/common";

export interface MockDnp {
  manifest: Manifest;
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
  requestDnp?: Partial<RequestedDnp>;
}
