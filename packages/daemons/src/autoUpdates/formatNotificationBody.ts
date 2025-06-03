import { CoreUpdateDataAvailable } from "@dappnode/types";
import { prettyDnpName } from "@dappnode/utils";

export function formatPackageUpdateNotification({
  dnpName,
  currentVersion,
  newVersion,
  upstreamVersion
}: {
  dnpName: string;
  currentVersion: string;
  newVersion: string;
  upstreamVersion?: string | string[];
}): string {
  const prettyName = prettyDnpName(dnpName);

  return [
    `New version ready to install for ${prettyName} (current version ${currentVersion})`,
    upstreamVersion
      ? ` - package version: ${newVersion}\n` + ` - upstream version: ${upstreamVersion}`
      : ` - version: ${newVersion}`
  ].join("\n\n");
}

export function formatSystemUpdateNotification({
  packages
}: {
  packages: CoreUpdateDataAvailable["packages"];
  autoUpdatesEnabled: boolean;
}): string {
  return [
    "New system version ready to install",
    packages.map((p) => ` - ${prettyDnpName(p.name)}: ${p.to} ${p.from ? `(current: ${p.from})` : ""}`)
  ].join("\n\n");
}
