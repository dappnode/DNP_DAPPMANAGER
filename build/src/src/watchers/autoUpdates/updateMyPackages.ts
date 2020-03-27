import semver from "semver";
import { listContainers } from "../../modules/docker/listContainers";
import * as eventBus from "../../eventBus";
import params from "../../params";
import { ReleaseFetcher } from "../../modules/release";
// Utils
import computeSemverUpdateType from "../../utils/computeSemverUpdateType";
import {
  isDnpUpdateEnabled,
  isUpdateDelayCompleted,
  flagCompletedUpdate,
  flagErrorUpdate
} from "../../utils/autoUpdateHelper";
// External calls
import installPackage from "../../calls/installPackage";
import Logs from "../../logs";
const logs = Logs(module);

export default async function updateMyPackages(): Promise<void> {
  const releaseFetcher = new ReleaseFetcher();
  const dnpList = await listContainers();

  const dnps = dnpList.filter(
    dnp =>
      dnp.name &&
      // Ignore core DNPs
      dnp.isDnp &&
      // Ignore wierd versions
      semver.valid(dnp.version) &&
      // MUST come from the APM
      (!dnp.origin || params.AUTO_UPDATE_INCLUDE_IPFS_VERSIONS)
  );

  for (const { name, version: currentVersion } of dnps) {
    try {
      await updateMyPackage(releaseFetcher, name, currentVersion);
    } catch (e) {
      logs.error(`Error auto-updating ${name}: ${e.stack}`);
    }
  }
}

/**
 * Only `minor` and `patch` updates are allowed
 */

async function updateMyPackage(
  releaseFetcher: ReleaseFetcher,
  name: string,
  currentVersion: string
): Promise<void> {
  // Check if this specific dnp has auto-updates enabled
  if (!isDnpUpdateEnabled(name)) return;

  const { version: latestVersion } = await releaseFetcher.fetchVersion(name);

  // Compute if the update type is "patch"/"minor" = is allowed
  // If release is not allowed, abort
  const updateType = computeSemverUpdateType(currentVersion, latestVersion);
  if (updateType !== "minor" && updateType !== "patch") return;

  // Enforce a 24h delay before performing an auto-update
  // Also records the remaining time in the db for the UI
  if (!isUpdateDelayCompleted(name, latestVersion)) return;

  logs.info(`Auto-updating ${name} to ${latestVersion}...`);

  try {
    await installPackage({ name, version: latestVersion });

    flagCompletedUpdate(name, latestVersion);
    logs.info(`Successfully auto-updated system packages`);
    eventBus.requestPackages.emit();
  } catch (e) {
    flagErrorUpdate(name, e.message);
    throw e;
  }
}
