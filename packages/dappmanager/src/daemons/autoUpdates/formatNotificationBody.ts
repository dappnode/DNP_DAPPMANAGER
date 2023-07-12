import { CoreUpdateDataAvailable } from "@dappnode/common";
import {
  adminUiInstallPackageUrl,
  adminUiUpdateCoreUrl
} from "../../externalLinks.js";
import { prettyDnpName } from "../../utils/format.js";
import { urlJoin } from "../../utils/url.js";
import { enableAutoUpdatesCmd } from "../telegramBot/commands.js";

export function formatPackageUpdateNotification({
  dnpName,
  currentVersion,
  newVersion,
  upstreamVersion,
  autoUpdatesEnabled
}: {
  dnpName: string;
  currentVersion: string;
  newVersion: string;
  upstreamVersion?: string;
  autoUpdatesEnabled: boolean;
}): string {
  const prettyName = prettyDnpName(dnpName);
  const installUrl = urlJoin(adminUiInstallPackageUrl, dnpName);

  return [
    `New version ready to install for ${prettyName} (current version ${currentVersion})`,
    upstreamVersion
      ? ` - package version: ${newVersion}\n` +
        ` - upstream version: ${upstreamVersion}`
      : ` - version: ${newVersion}`,

    `Connect to your DAppNode to install this new version [install / ${prettyName}](${installUrl}).`,
    autoUpdatesEnabled
      ? `You may also wait for auto-updates to automatically install this version for you`
      : `You can also enable auto-updates so packages are updated automatically by responding with the command: \n\n  ${enableAutoUpdatesCmd}`
  ].join("\n\n");
}

export function formatSystemUpdateNotification({
  packages,
  autoUpdatesEnabled
}: {
  packages: CoreUpdateDataAvailable["packages"];
  autoUpdatesEnabled: boolean;
}): string {
  return [
    "New system version ready to install",
    packages.map(
      p =>
        ` - ${prettyDnpName(p.name)}: ${p.to} ${
          p.from ? `(current: ${p.from})` : ""
        }`
    ),

    `Connect to your DAppNode to install this [system / update](${adminUiUpdateCoreUrl}).`,
    autoUpdatesEnabled
      ? `You may also wait for auto-updates to automatically install this version for you`
      : `You can also enable auto-updates so packages are updated automatically by responding with the command: \n\n  ${enableAutoUpdatesCmd}`
  ].join("\n\n");
}
