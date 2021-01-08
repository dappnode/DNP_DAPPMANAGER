import semver from "semver";
import params from "../../params";
import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { ReleaseFetcher } from "../../modules/release";
import { shortNameCapitalized } from "../../utils/format";
import { CoreUpdateDataAvailable } from "../../types";
import {
  isCoreUpdateEnabled,
  isDnpUpdateEnabled
} from "../../utils/autoUpdateHelper";
import {
  formatPackageUpdateNotification,
  formatSystemUpdateNotification
} from "./formatNotificationBody";

export async function sendUpdatePackageNotificationMaybe(
  releaseFetcher: ReleaseFetcher,
  {
    dnpName,
    currentVersion,
    newVersion
  }: {
    dnpName: string;
    currentVersion: string;
    newVersion: string;
  }
): Promise<void> {
  // If version has already been emitted, skip
  const lastEmittedVersion = db.notificationLastEmitVersion.get(dnpName);
  if (
    lastEmittedVersion &&
    semver.valid(lastEmittedVersion) &&
    semver.lte(newVersion, lastEmittedVersion)
  )
    return; // Already emitted update available for this version

  // Ensure the release resolves on IPFS
  const release = await releaseFetcher.getRelease(dnpName, newVersion);

  eventBus.notification // Emit notification about new version available
    .emit({
      id: `update-available-${dnpName}-${newVersion}`,
      type: "success",
      title: `Update available for ${shortNameCapitalized(dnpName)}`,
      body: formatPackageUpdateNotification({
        dnpName: dnpName,
        newVersion,
        upstreamVersion: release.metadata.upstreamVersion,
        currentVersion,
        autoUpdatesEnabled: isDnpUpdateEnabled(dnpName)
      })
    });

  // Register version to prevent sending notification again
  db.notificationLastEmitVersion.set(dnpName, newVersion);
}

export async function sendUpdateSystemNotificationMaybe(
  data: CoreUpdateDataAvailable
): Promise<void> {
  const newVersion = data.coreVersion;
  const dnpName = params.coreDnpName;

  // If version has already been emitted, skip
  const lastEmittedVersion = db.notificationLastEmitVersion.get(dnpName);
  if (
    lastEmittedVersion &&
    semver.valid(lastEmittedVersion) &&
    semver.lte(newVersion, lastEmittedVersion)
  )
    return; // Already emitted update available for this version

  eventBus.notification // Emit notification about new version available
    .emit({
      id: `update-available-${dnpName}-${newVersion}`,
      type: "success",
      title: "System update available",
      body: formatSystemUpdateNotification({
        packages: data.packages,
        autoUpdatesEnabled: isCoreUpdateEnabled()
      })
    });

  data.packages;

  // Register version to prevent sending notification again
  db.notificationLastEmitVersion.set(dnpName, newVersion);
}
