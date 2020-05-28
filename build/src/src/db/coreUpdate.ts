import { staticKey } from "./dbCache";
import { pick } from "lodash";
import { InstallPackageData, InstallPackageDataPaths } from "../common/types";

const CORE_UPDATE_PACKAGES_DATA = "core-update-packages-data";

const _coreUpdatePackagesData = staticKey<InstallPackageDataPaths[] | null>(
  CORE_UPDATE_PACKAGES_DATA,
  null
);

/**
 * Store packages install data to finalize a core update after the DAPPMANAGER
 * is restarted. Only store the necessary properties, since packageData contains
 * a lot of unnecesary data such as the compose and manifest
 */
export const coreUpdatePackagesData = {
  get: _coreUpdatePackagesData.get,
  set: (
    packagesData: (InstallPackageData | InstallPackageDataPaths)[] | null
  ) =>
    _coreUpdatePackagesData.set(
      packagesData
        ? packagesData.map(packageData =>
            pick(packageData, [
              "name",
              "semVersion",
              "composePath",
              "composeBackupPath",
              "manifestPath",
              "manifestBackupPath",
              "imagePath",
              "isUpdate"
            ])
          )
        : packagesData
    )
};
