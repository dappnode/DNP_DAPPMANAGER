import { valid, lte } from "semver";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { DappnodeInstaller } from "@dappnode/installer";
import { prettyDnpName } from "@dappnode/utils";
import { CoreUpdateDataAvailable, NotificationCategory, upstreamVersionToString } from "@dappnode/types";
import { formatPackageUpdateNotification, formatSystemUpdateNotification } from "./formatNotificationBody.js";
import { isCoreUpdateEnabled } from "./isCoreUpdateEnabled.js";
import { isDnpUpdateEnabled } from "./isDnpUpdateEnabled.js";
import { notifications } from "@dappnode/notifications";
import { logs } from "@dappnode/logger";

export async function sendUpdatePackageNotificationMaybe({
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
  // Check if auto-update notifications are enabled
  const dappmanagerCustomEndpoint = notifications
    .getEndpointsIfExists(params.dappmanagerDnpName, true)
    ?.customEndpoints?.find((customEndpoint) => customEndpoint.name === "auto-updates");

  if (!dappmanagerCustomEndpoint || !dappmanagerCustomEndpoint.enabled) return;

  // If version has already been emitted, skip
  const lastEmittedVersion = db.notificationLastEmitVersion.get(dnpName);
  if (lastEmittedVersion && valid(lastEmittedVersion) && lte(newVersion, lastEmittedVersion)) return; // Already emitted update available for this version

  // Ensure the release resolves on IPFS
  const release = await dappnodeInstaller.getRelease(dnpName, newVersion);
  const upstreamVersion = upstreamVersionToString({
    upstreamVersion: release.manifest.upstreamVersion,
    upstream: release.manifest.upstream
  });

  // Send notification about new version available
  await notifications
    .sendNotification({
      title: `Update available for ${prettyDnpName(dnpName)}`,
      dnpName,
      body: formatPackageUpdateNotification({
        dnpName,
        currentVersion,
        newVersion,
        upstreamVersion,
        autoUpdatesEnabled: isDnpUpdateEnabled(dnpName)
      }),
      category: NotificationCategory.CORE
    })
    .catch((e) => logs.error("Error sending package update notification", e));

  // Register version to prevent sending notification again
  db.packageLatestKnownVersion.set(dnpName, { newVersion, upstreamVersion });
  db.notificationLastEmitVersion.set(dnpName, newVersion);
}

export async function sendUpdateSystemNotificationMaybe(data: CoreUpdateDataAvailable): Promise<void> {
  const newVersion = data.coreVersion;
  const dnpName = params.coreDnpName;

  // If version has already been emitted, skip
  const lastEmittedVersion = db.notificationLastEmitVersion.get(dnpName);
  if (lastEmittedVersion && valid(lastEmittedVersion) && lte(newVersion, lastEmittedVersion)) return; // Already emitted update available for this version

  // Send notification about new version available
  await notifications
    .sendNotification({
      title: `System update available`,
      dnpName,
      body: formatSystemUpdateNotification({
        packages: data.packages,
        autoUpdatesEnabled: isCoreUpdateEnabled()
      }),
      category: NotificationCategory.CORE
    })
    .catch((e) => logs.error("Error sending system update notification", e));

  data.packages;

  // Register version to prevent sending notification again
  db.packageLatestKnownVersion.set(dnpName, { newVersion });
  db.notificationLastEmitVersion.set(dnpName, newVersion);
}
