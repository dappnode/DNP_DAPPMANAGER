import {
  UserSettings,
  SpecialPermission,
  InstalledPackageDetailData,
  PackageContainer,
  RequestedDnp
} from "@dappnode/types";
import { Manifest, SetupWizard } from "@dappnode/types";

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
