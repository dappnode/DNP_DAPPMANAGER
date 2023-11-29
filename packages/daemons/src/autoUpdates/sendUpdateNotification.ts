import { valid, lte } from "semver";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { DappnodeInstaller } from "@dappnode/installer";
import { prettyDnpName } from "@dappnode/utils";
import { CoreUpdateDataAvailable } from "@dappnode/common";
import {
  formatPackageUpdateNotification,
  formatSystemUpdateNotification,
} from "./formatNotificationBody.js";
import { isCoreUpdateEnabled } from "./isCoreUpdateEnabled.js";
import { isDnpUpdateEnabled } from "./isDnpUpdateEnabled.js";

export async function sendUpdatePackageNotificationMaybe({
  dappnodeInstaller,
  dnpName,
  currentVersion,
  newVersion,
}: {
  dappnodeInstaller: DappnodeInstaller;
  dnpName: string;
  currentVersion: string;
  newVersion: string;
}): Promise<void> {
  // If version has already been emitted, skip
  const lastEmittedVersion = db.notificationLastEmitVersion.get(dnpName);
  if (
    lastEmittedVersion &&
    valid(lastEmittedVersion) &&
    lte(newVersion, lastEmittedVersion)
  )
    return; // Already emitted update available for this version

  // Ensure the release resolves on IPFS
  const release = await dappnodeInstaller.getRelease(dnpName, newVersion);
  const upstreamVersion = release.manifest.upstreamVersion;

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
      autoUpdatesEnabled: isDnpUpdateEnabled(dnpName),
    }),
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
    valid(lastEmittedVersion) &&
    lte(newVersion, lastEmittedVersion)
  )
    return; // Already emitted update available for this version

  // Emit notification about new version available
  eventBus.notification.emit({
    id: `update-available-${dnpName}-${newVersion}`,
    type: "info",
    title: "System update available",
    body: formatSystemUpdateNotification({
      packages: data.packages,
      autoUpdatesEnabled: isCoreUpdateEnabled(),
    }),
  });

  data.packages;

  // Register version to prevent sending notification again
  db.packageLatestKnownVersion.set(dnpName, { newVersion });
  db.notificationLastEmitVersion.set(dnpName, newVersion);
}
