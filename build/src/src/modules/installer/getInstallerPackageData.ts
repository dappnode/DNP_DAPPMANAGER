import { PackageRelease, UserSet, InstallPackageData } from "../../types";
import { merge } from "lodash";
import { getUserSet } from "../../utils/dockerComposeFile";
import * as getPath from "../../utils/getPath";
import {
  applyUserSet,
  addGeneralDataToCompose
} from "../../utils/dockerComposeParsers";
import Logs from "../../logs";
const logs = Logs(module);

/**
 * Receives a release and returns all the information and instructions
 * for the installer to process it.
 * This step is isolated to be a pure function and ease its testing
 * [PURE] Function
 */
export default function getInstallerPackageData(
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

  // If the compose is invalid, just return empty ENVs
  try {
    return getUserSet(composePath);
  } catch (e) {
    logs.error(`Error getting user set envs: ${e.stack}`);
    return {};
  }
}
