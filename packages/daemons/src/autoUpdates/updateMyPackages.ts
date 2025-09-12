import { valid, lte } from "semver";
import { params } from "@dappnode/params";
import { listPackages } from "@dappnode/dockerapi";
import { eventBus } from "@dappnode/eventbus";
import { DappnodeInstaller, packageInstall } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import { sendUpdatePackageNotificationMaybe } from "./sendUpdateNotification.js";
import { computeSemverUpdateType } from "@dappnode/utils";
import { flagErrorUpdate } from "./flagErrorUpdate.js";
import { isUpdateDelayCompleted } from "./isUpdateDelayCompleted.js";
import { flagCompletedUpdate } from "./flagCompletedUpdate.js";
import { isDnpUpdateEnabled } from "./isDnpUpdateEnabled.js";

const contractAddressMap = new Map<string, string>();
const contentUriMap = new Map<string, string>();

/**
 * For all installed non-core DAppNode packages, check their latest version
 * If there is an update available (of any kind)
 * - Send notification once per package and version
 * - Auto-update the package if allowed
 */
export async function checkNewPackagesVersion(dappnodeInstaller: DappnodeInstaller): Promise<void> {
  const dnps = await listPackages();

  for (const { dnpName, version: currentVersion } of dnps) {
    try {
      // Ignore:
      // - core DNPs that must be updatable only from the "core.dnp.dappnode.eth" package
      // - non-valid versions (semver.lte will throw)
      if (!dnpName || !valid(currentVersion) || params.corePackagesNotAutoupdatable.includes(dnpName)) continue;

      await updateContractAddress(dappnodeInstaller, dnpName);
      const contractAddress = contractAddressMap.get(dnpName);
      if (!contractAddress) {
        logs.warn(`No contract address found for ${dnpName}, skipping version check`);
        continue;
      }

      const { version: newVersion, contentUri: newContentUri } = await dappnodeInstaller.getVersionAndIpfsHash({
        dnpNameOrHash: dnpName,
        contractAddress
      });

      if (!contentUriMap.get(dnpName)) contentUriMap.set(dnpName, newContentUri);
      await pinAndUnpinContentNotThrow(dappnodeInstaller, dnpName, newContentUri);

      // This version is not an update
      if (lte(newVersion, currentVersion)) continue;

      const updateData = { dnpName, currentVersion, newVersion };
      // Will try to resolve the IPFS release content, so await it to ensure it resolves
      await sendUpdatePackageNotificationMaybe({
        dappnodeInstaller,
        ...updateData
      });
      await autoUpdatePackageMaybe({ dappnodeInstaller, ...updateData });
    } catch (e) {
      logs.error(`Error checking ${dnpName} version`, e);
    }
  }
}

/**
 * pinAndUnpinContent compares with the old version and content for pin and unpin content
 */
async function pinAndUnpinContentNotThrow(
  dappnodeInstaller: DappnodeInstaller,
  dnpName: string,
  newContentUri: string
): Promise<void> {
  const oldContentUri = contentUriMap.get(dnpName);
  if (oldContentUri && newContentUri !== oldContentUri) {
    logs.info(`Unpinning old content and pinning new content for ${dnpName}`);
    try {
      logs.info(`Pinning new content ${newContentUri} for ${dnpName}`);
      await dappnodeInstaller.pinAddLocal(newContentUri);
      logs.info(`Unpinning old content ${oldContentUri} for ${dnpName}`);
      await dappnodeInstaller.pinRmLocal(oldContentUri);
    } catch (e) {
      logs.error(`Error updating content for ${dnpName}`, e);
    }
  }
}

/**
 * updateContractAddress
 */
async function updateContractAddress(dappnodeInstaller: DappnodeInstaller, dnpName: string): Promise<void> {
  // MUST exist an APM repo with the package dnpName
  if (!contractAddressMap.get(dnpName)) {
    const repoContract = await dappnodeInstaller.getRepoContract(dnpName);
    if (typeof repoContract.target === "string") {
      logs.info(`Caching contract info for ${dnpName}`);
      contractAddressMap.set(dnpName, repoContract.target);
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
  dappnodeInstaller,
  dnpName,
  currentVersion,
  newVersion
}: {
  dappnodeInstaller: DappnodeInstaller;
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
    await packageInstall(dappnodeInstaller, {
      name: dnpName,
      version: newVersion
    });

    flagCompletedUpdate(dnpName, newVersion);
    logs.info(`Successfully auto-updated system packages`);
    eventBus.requestPackages.emit();
  } catch (e) {
    flagErrorUpdate(dnpName, e.message);
    throw e;
  }
}
