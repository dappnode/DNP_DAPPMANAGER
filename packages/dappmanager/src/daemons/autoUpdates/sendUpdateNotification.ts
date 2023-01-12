import semver from "semver";
import params from "../../params";
import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { ReleaseFetcher } from "../../modules/release";
import { prettyDnpName } from "../../utils/format";
import { CoreUpdateDataAvailable } from "@dappnode/common";
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
  const upstreamVersion = release.metadata.upstreamVersion;

  // Emit notification about new version available
  eventBus.notification.emit({
    id: `update-available-${dnpName}-${newVersion}`,
    type: "info",
    title: `Update available for ${prettyDnpName(dnpName)}`,
    body: formatPackageUpdateNotification({
      dnpName: dnpName,
      newVersion,
      upstreamVersion,
      currentVersion,
      autoUpdatesEnabled: isDnpUpdateEnabled(dnpName)
    })
  });

  // Register version to prevent sending notification again
  db.packageLatestKnownVersion.set(dnpName, { newVersion, upstreamVersion });
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

  // Emit notification about new version available
  eventBus.notification.emit({
    id: `update-available-${dnpName}-${newVersion}`,
    type: "info",
    title: "System update available",
    body: formatSystemUpdateNotification({
      packages: data.packages,
      autoUpdatesEnabled: isCoreUpdateEnabled()
    })
  });

  data.packages;

  // Register version to prevent sending notification again
  db.packageLatestKnownVersion.set(dnpName, { newVersion });
  db.notificationLastEmitVersion.set(dnpName, newVersion);
}
