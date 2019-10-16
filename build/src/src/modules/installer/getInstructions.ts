import { PackageRelease, UserSet, InstallPackageData } from "../../types";
import { merge, sortBy } from "lodash";
import { getUserSet, writeComposeObj } from "../../utils/dockerComposeFile";
import * as validate from "../../utils/validate";
import * as getPath from "../../utils/getPath";
import {
  applyUserSet,
  addGeneralDataToCompose
} from "../../utils/dockerComposeParsers";
import getRelease from "../release/getRelease";
import { dockerComposeConfig } from "../docker/dockerCommands";

const dappmanager = "dappmanager.dnp.dappnode.eth";

/**
 * GOALS:
 * 2. Get release for each dnp
 * 2A. X Parse release dir files and convert manifest to compose
 * 2B. X Enforce core restrictions
 * 2C. X Load previous user settings and merge with current settings
 * 2D. Generate final files
 * 2E. Verify the resulting compose with docker-compose
 * 2F. Order packages
 */
export async function preInstallPackage(
  name: string,
  version: string,
  userSet: UserSet,
  BYPASS_CORE_RESTRICTION: boolean
): Promise<InstallPackageData> {
  const release = await getRelease(name, version);

  // .origin is only false when the origin is the AragonAPM
  if (release.warnings.unverifiedCore && !BYPASS_CORE_RESTRICTION)
    throw Error(`Core package ${name} is from an unverified origin`);

  const packageData = getInstallerPackageData(release, userSet);

  // Validate (create mkdir -p) paths
  validate.path(packageData.composePath);
  validate.path(packageData.composeNextPath);
  validate.path(packageData.manifestPath);
  validate.path(packageData.imagePath);

  /**
   * Write the new compose and test it with config
   * `docker-compose config` will ONLY catch syntactic errors,
   * Stuff like port collisions or environment: - "" will NOT be reported
   *
   * #### TODO / IDEA: Up the compose replacing the image with a busybox
   * just try the package is able to start.
   */
  writeComposeObj(packageData.composeNextPath, packageData.compose);
  await dockerComposeConfig(packageData.composeNextPath);

  return packageData;
}

/**
 * Receives a release and returns all the information and instructions
 * for the installer to process it.
 * This step is isolated to be a pure function and ease its testing
 * [PURE] Function
 */
function getInstallerPackageData(
  release: PackageRelease,
  userSet: UserSet
): InstallPackageData {
  const { name, version, isCore, compose, metadata, origin } = release;
  /**
   * Compute paths
   */
  const composePath = getPath.dockerCompose(name, isCore);
  const composeNextPath = getPath.nextPath(composePath);
  const manifestPath = getPath.manifest(name, isCore);
  const imagePath = getPath.image(name, version, isCore);

  /**
   * Gather extra data
   */
  const previousUserSet = getPreviousUserSet(name, isCore);

  return {
    ...release,
    // Paths
    composePath,
    composeNextPath,
    manifestPath,
    imagePath,
    // Data to write
    compose: addGeneralDataToCompose(
      applyUserSet(compose, merge(previousUserSet, userSet)),
      { metadata, origin, isCore }
    )
  };
}

function getPreviousUserSet(name: string, isCore: boolean): UserSet {
  // What if it's not previous there?
  const composePath = getPath.dockerCompose(name, isCore);
  return getUserSet(composePath);
}

/**
 * Order the packages to be installed.
 * This is critical when packages are `docker-compose up`:
 * - On CORE updates the order can potentially unstuck critical bugs
 * - On CORE updates the order can improve the user experience alerting
 *   the user when certain components will go offline (vpn, dappmanager)
 * - On regular installs the may be package interdependencies such as
 *   volumes, so the packages have to be ordered
 * @param packagesData
 */
export function orderInstallPackages(
  packagesData: InstallPackageData[],
  requestName: string
): InstallPackageData[] {
  // Generic order, by name and the dappmanager the last
  const basicOrder = sortBy(packagesData, ["name"]).sort(function(a, b) {
    if (a.name === dappmanager && b.name !== dappmanager) return 1;
    if (a.name !== dappmanager && b.name === dappmanager) return -1;
    else return 0;
  });

  // The requested package can provide an order to up the packages
  // runOrder: ["core.dnp.dappnode.eth", "dappmanager.dnp.dappnode.eth"]
  // Which will overwrite the basic order in the trailing part
  const requestPkg = packagesData.find(pkg => pkg.name === requestName);
  if (requestPkg && requestPkg.metadata.runOrder) {
    const runOrder = requestPkg.metadata.runOrder;
    return basicOrder.sort(
      (a, b) => runOrder.indexOf(a.name) - runOrder.indexOf(b.name)
    );
  }

  // Order by volume dependencies

  return basicOrder;
}
