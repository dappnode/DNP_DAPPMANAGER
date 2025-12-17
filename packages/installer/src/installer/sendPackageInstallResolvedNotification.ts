import { Category, InstallPackageData, Priority, Status } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { notifications } from "@dappnode/notifications";
import { prettyDnpName } from "@dappnode/utils";
import { params } from "@dappnode/params";

/**
 * Send resolved notification for regular packages once installed/updated
 * This dismisses the "update available" notification by sending a resolved status
 * @param packagesData
 */
export async function sendPackageInstalledResolvedNotification(packagesData: InstallPackageData[]): Promise<void> {
  // Filter out core packages as they are handled separately
  const regularPackages = packagesData.filter((p) => !params.corePackagesNotAutoupdatable.includes(p.dnpName));

  for (const pkg of regularPackages) {
    const title = `${prettyDnpName(pkg.dnpName)} installed successfully`;
    const body = `${prettyDnpName(pkg.dnpName)} version ${pkg.semVersion} has been installed successfully`;

    await notifications
      .sendNotification({
        title: title,
        dnpName: pkg.dnpName,
        body: body,
        category: Category.system,
        priority: Priority.low,
        status: Status.resolved,
        isBanner: false,
        isRemote: false,
        correlationId: "dappmanager-update-pkg"
      })
      .catch((e) => logs.error(`Error sending resolved notification for ${pkg.dnpName}`, e));
  }
}
