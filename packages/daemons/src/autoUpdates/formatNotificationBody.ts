import { CoreUpdateDataAvailable } from "@dappnode/types";
import { urlJoin, prettyDnpName } from "@dappnode/utils";
import { getInstallerPath } from "admin-ui/src/pages/system/data"

const adminUiUpdateCoreUrl = "http://my.dappnode/system/update";

export function formatPackageUpdateNotification({
  dnpName,
  currentVersion,
  newVersion,
  upstreamVersion,
  autoUpdatesEnabled,
}: {
  dnpName: string;
  currentVersion: string;
  newVersion: string;
  upstreamVersion?: string | string[];
  autoUpdatesEnabled: boolean;
}): string {
  const prettyName = prettyDnpName(dnpName);
  const installUrl = urlJoin(getInstallerPath(dnpName), dnpName);

  return [
    `New version ready to install for ${prettyName} (current version ${currentVersion})`,
    upstreamVersion
      ? ` - package version: ${newVersion}\n` +
      ` - upstream version: ${upstreamVersion}`
      : ` - version: ${newVersion}`,

    `Connect to your DAppNode to install this new version [install / ${prettyName}](${installUrl}).`,
    autoUpdatesEnabled
      ? `You may also wait for auto-updates to automatically install this version for you`
      : `You can also enable auto-updates so packages are updated automatically by responding with the command: \n\n  /enable_auto_updates`,
  ].join("\n\n");
}

export function formatSystemUpdateNotification({
  packages,
  autoUpdatesEnabled,
}: {
  packages: CoreUpdateDataAvailable["packages"];
  autoUpdatesEnabled: boolean;
}): string {
  return [
    "New system version ready to install",
    packages.map(
      (p) =>
        ` - ${prettyDnpName(p.name)}: ${p.to} ${p.from ? `(current: ${p.from})` : ""
        }`
    ),

    `Connect to your DAppNode to install this [system / update](${adminUiUpdateCoreUrl}).`,
    autoUpdatesEnabled
      ? `You may also wait for auto-updates to automatically install this version for you`
      : `You can also enable auto-updates so packages are updated automatically by responding with the command: \n\n  /enable_auto_updates`,
  ].join("\n\n");
}
