import { Category, InstallPackageData, Priority, Status } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { notifications } from "@dappnode/notifications";

/**
 * Send resolved notification for core packages once installed
 * @param packagesData
 */
export async function sendCoreInstalledResolvedNotification(packagesData: InstallPackageData[]): Promise<void> {
  if (packagesData.some((p) => p.isCore)) {
    for (const pkg of packagesData.filter((p) => p.isCore)) {
      await notifications
        .sendNotification({
          title: `Installation of ${pkg.dnpName} completed`,
          dnpName: pkg.dnpName,
          body: `The installation of ${pkg.dnpName} (${pkg.semVersion}) has been completed successfully.`,
          category: Category.system,
          priority: Priority.low,
          status: Status.resolved,
          isBanner: false,
          isRemote: false,
          correlationId: "dappmanager-update-systemPkg"
        })
        .catch((e) => logs.error("Error sending core package installation notification", e));
    }
  }
}
