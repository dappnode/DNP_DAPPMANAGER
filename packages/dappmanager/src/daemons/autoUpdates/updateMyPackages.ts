import { valid, lte } from "semver";
import params from "../../params.js";
import { listPackages } from "../../modules/docker/list/index.js";
import { eventBus } from "../../eventBus.js";
import { ReleaseFetcher } from "../../modules/release/index.js";
import { packageInstall } from "../../calls/index.js";
import { logs } from "../../logs.js";
import { sendUpdatePackageNotificationMaybe } from "./sendUpdateNotification.js";
import computeSemverUpdateType from "../../utils/computeSemverUpdateType.js";
import {
  isDnpUpdateEnabled,
  isUpdateDelayCompleted,
  flagCompletedUpdate,
  flagErrorUpdate
} from "../../utils/autoUpdateHelper.js";

/**
 * For all installed non-core DAppNode packages, check their latest version
 * If there is an update available (of any kind)
 * - Send notification once per package and version
 * - Auto-update the package if allowed
 */
export async function checkNewPackagesVersion(
  releaseFetcher: ReleaseFetcher
): Promise<void> {
  const dnps = await listPackages();

  for (const { dnpName, version: currentVersion } of dnps) {
    try {
      // Ignore:
      // - core DNPs that must be updatable only from the "core.dnp.dappnode.eth" package
      // - non-valid versions (semver.lte will throw)
      if (
        !dnpName ||
        !valid(currentVersion) ||
        params.corePackagesNotAutoupdatable.includes(dnpName)
      ) {
        continue;
      }

      // MUST exist an APM repo with the package dnpName
      // Check here instead of the if statement to be inside the try / catch
      const repoExists = await releaseFetcher.repoExists(dnpName);
      if (!repoExists) {
        continue;
      }

      const { version: newVersion } = await releaseFetcher.fetchVersion(
        dnpName
      );

      // This version is not an update
      if (lte(newVersion, currentVersion)) {
        continue;
      }

      const updateData = { dnpName, currentVersion, newVersion };

      // Will try to resolve the IPFS release content, so await it to ensure it resolves
      await sendUpdatePackageNotificationMaybe(releaseFetcher, updateData);

      await autoUpdatePackageMaybe(updateData);
    } catch (e) {
      logs.error(`Error checking ${dnpName} version`, e);
    }
  }
}

/**
 * Auto-update only if:
 * - Updates are enabled for this specific package or all my-packages
 * - Update type is minor or patch
 * - The update delay is completed
 */
async function autoUpdatePackageMaybe({
  dnpName,
  currentVersion,
  newVersion
}: {
  dnpName: string;
  currentVersion: string;
  newVersion: string;
}): Promise<void> {
  // Check if this specific dnp has auto-updates enabled
  if (!isDnpUpdateEnabled(dnpName)) return;

  // Compute if the update type is "patch"/"minor" = is allowed
  // If release is not allowed, abort
  const updateType = computeSemverUpdateType(currentVersion, newVersion);
  if (updateType !== "minor" && updateType !== "patch") return;

  // Enforce a 24h delay before performing an auto-update
  // Also records the remaining time in the db for the UI
  if (!isUpdateDelayCompleted(dnpName, newVersion)) return;

  logs.info(`Auto-updating ${dnpName} to ${newVersion}...`);

  try {
    await packageInstall({ name: dnpName, version: newVersion });

    flagCompletedUpdate(dnpName, newVersion);
    logs.info(`Successfully auto-updated system packages`);
    eventBus.requestPackages.emit();
  } catch (e) {
    flagErrorUpdate(dnpName, e.message);
    throw e;
  }
}
