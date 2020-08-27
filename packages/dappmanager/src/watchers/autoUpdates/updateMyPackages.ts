import semver from "semver";
import { listPackages } from "../../modules/docker/listContainers";
import * as eventBus from "../../eventBus";
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
import { packageInstall } from "../../calls";
import { logs } from "../../logs";

export default async function updateMyPackages(
  releaseFetcher: ReleaseFetcher
): Promise<void> {
  const dnpList = await listPackages();

  for (const { dnpName, isDnp, version: currentVersion } of dnpList) {
    if (
      dnpName &&
      // Ignore core DNPs
      isDnp &&
      // Ignore wierd versions
      semver.valid(currentVersion)
    ) {
      try {
        await updateMyPackage(releaseFetcher, dnpName, currentVersion);
      } catch (e) {
        logs.error(`Error auto-updating ${dnpName}`, e);
      }
    }
  }
}

/**
 * Only `minor` and `patch` updates are allowed
 */

async function updateMyPackage(
  releaseFetcher: ReleaseFetcher,
  dnpName: string,
  currentVersion: string
): Promise<void> {
  // Check if this specific dnp has auto-updates enabled
  if (!isDnpUpdateEnabled(dnpName)) return;

  // MUST exist an APM repo with the package name
  // Check here instead of the if statement to be inside the try / catch
  const repoExists = await releaseFetcher.repoExists(dnpName);
  if (!repoExists) return;

  const { version: latestVersion } = await releaseFetcher.fetchVersion(dnpName);

  // Compute if the update type is "patch"/"minor" = is allowed
  // If release is not allowed, abort
  const updateType = computeSemverUpdateType(currentVersion, latestVersion);
  if (updateType !== "minor" && updateType !== "patch") return;

  // Enforce a 24h delay before performing an auto-update
  // Also records the remaining time in the db for the UI
  if (!isUpdateDelayCompleted(dnpName, latestVersion)) return;

  logs.info(`Auto-updating ${dnpName} to ${latestVersion}...`);

  try {
    await packageInstall({ name: dnpName, version: latestVersion });

    flagCompletedUpdate(dnpName, latestVersion);
    logs.info(`Successfully auto-updated system packages`);
    eventBus.requestPackages.emit();
  } catch (e) {
    flagErrorUpdate(dnpName, e.message);
    throw e;
  }
}
