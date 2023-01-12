import { Manifest, SetupWizard } from "@dappnode/dappnodesdk";
import {
  UserSettings,
  SpecialPermission,
  InstalledPackageDetailData,
  PackageContainer,
  RequestedDnp
} from "@dappnode/common";

export interface MockDnp {
  metadata: Manifest;
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
