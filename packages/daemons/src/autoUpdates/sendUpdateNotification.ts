import { valid, lte } from "semver";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { DappnodeInstaller } from "@dappnode/installer";
import { prettyDnpName, urlJoin } from "@dappnode/utils";
import { CoreUpdateDataAvailable, Category, Priority, upstreamVersionToString, Status } from "@dappnode/types";
import { formatPackageUpdateNotification, formatSystemUpdateNotification } from "./formatNotificationBody.js";
import { isCoreUpdateEnabled } from "./isCoreUpdateEnabled.js";
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
    ?.customEndpoints?.find((customEndpoint) => customEndpoint.correlationId === "dappmanager-update-pkg");

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

  const adminUiInstallPackageUrl = "http://my.dappnode/installer/dnp";

  // Send notification about new version available
  await notifications
    .sendNotification({
      title: `Update available for ${prettyDnpName(dnpName)}`,
      dnpName,
      body: formatPackageUpdateNotification({
        dnpName,
        currentVersion,
        newVersion,
        upstreamVersion
      }),
      category: Category.system,
      priority: Priority.low,
      status: Status.triggered,
      callToAction: {
        title: "Update",
        url: urlJoin(adminUiInstallPackageUrl, dnpName)
      },
      isBanner: false,
      isRemote: false,
      correlationId: "dappmanager-update-pkg"
    })
    .catch((e) => logs.error("Error sending package update notification", e));

  // Register version to prevent sending notification again
  db.packageLatestKnownVersion.set(dnpName, { newVersion, upstreamVersion });
  db.notificationLastEmitVersion.set(dnpName, newVersion);
}

export async function sendUpdateSystemNotificationMaybe(data: CoreUpdateDataAvailable): Promise<void> {
  const newVersion = data.coreVersion;
  const dnpName = params.coreDnpName;

  const adminUiUpdateCoreUrl = "http://my.dappnode/system/update";

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
      category: Category.system,
      priority: Priority.high,
      status: Status.triggered,
      callToAction: {
        title: "Update",
        url: adminUiUpdateCoreUrl
      },
      isBanner: true,
      isRemote: false,
      correlationId: "dappmanager-update-systemPkg"
    })
    .catch((e) => logs.error("Error sending system update notification", e));

  data.packages;

  // Register version to prevent sending notification again
  db.packageLatestKnownVersion.set(dnpName, { newVersion });
  db.notificationLastEmitVersion.set(dnpName, newVersion);
}
