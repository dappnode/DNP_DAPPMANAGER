import { Category, InstallPackageDataPaths, Priority, Status } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { notifications } from "@dappnode/notifications";
import { params } from "@dappnode/params";

/**
 * Send resolved notification for core packages once installed
 * @param packagesData
 */
export async function sendCoreInstalledResolvedNotification(packagesData: InstallPackageDataPaths[]): Promise<void> {
  if (packagesData.some((p) => p.dnpName === params.coreDnpName)) {
    const title = "System update completed successfully";
    const body = formatNotificationBody({ packages: packagesData });

    await notifications
      .sendNotification({
        title: title,
        dnpName: params.coreDnpName,
        body: body,
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

function formatNotificationBody({ packages }: { packages: InstallPackageDataPaths[] }): string {
  return [
    "The installation of the following packages has been completed successfully:",
    packages.map((p) => ` - ${p.dnpName}: ${p.semVersion}`).join("\n")
  ].join("\n\n");
}
