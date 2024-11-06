import { listPackages, getDockerVersion } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { Manifest, InstalledPackageData } from "@dappnode/types";
import { valid, gt } from "semver";

/**
 * Get the install requirements and throw an error if they are not met
 */
export async function checkInstallRequirements({ manifest }: { manifest: Manifest }): Promise<void> {
  if (manifest.type === "dncore") return;
  const installedPackages = await listPackages();
  const packagesRequiredToBeUninstalled = getRequiresUninstallPackages({ manifest, installedPackages });
  const requiresCoreUpdate = getRequiresCoreUpdateTo({ manifest, installedPackages });
  const requiresDockerUpdate = await getRequiresDockerUpdateTo({ manifest });

  const errors: string[] = [];
  if (packagesRequiredToBeUninstalled.length > 0)
    errors.push(`The following packages must be uninstalled: ${packagesRequiredToBeUninstalled.join(", ")}`);
  if (requiresCoreUpdate) errors.push(`Core update required to ${requiresCoreUpdate}`);
  if (requiresDockerUpdate) errors.push(`Docker update required to ${requiresDockerUpdate}`);
  if (errors.length > 0)
    throw new Error(`The package cannot be installed because of the following requirements:
${errors.join("\n")}`);
}

function getRequiresUninstallPackages({
  manifest,
  installedPackages
}: {
  manifest: Manifest;
  installedPackages: InstalledPackageData[];
}): string[] {
  const { notInstalledPackages } = manifest.requirements || {};
  if (!notInstalledPackages || notInstalledPackages.length === 0) return [];
  return notInstalledPackages.filter((dnpName) => installedPackages.find((dnp) => dnp.dnpName === dnpName));
}

function getRequiresCoreUpdateTo({
  manifest,
  installedPackages
}: {
  manifest: Manifest;
  installedPackages: InstalledPackageData[];
}): string | null {
  const coreVersion = installedPackages.find((dnp) => dnp.dnpName === params.coreDnpName)?.version;
  const minDnVersion = manifest.requirements?.minimumDappnodeVersion;

  if (!coreVersion || !minDnVersion) return null;

  const requiresCoreUpdate = Boolean(valid(minDnVersion) && valid(coreVersion) && gt(minDnVersion, coreVersion));
  if (requiresCoreUpdate) return minDnVersion;

  return null;
}
async function getRequiresDockerUpdateTo({ manifest }: { manifest: Manifest }): Promise<string | null> {
  const minDockerVersion = manifest.requirements?.minimumDockerVersion;
  if (!minDockerVersion) return null;
  const currentDockerVersion = await getDockerVersion();
  const requiresDockerUpdate = Boolean(
    minDockerVersion &&
      valid(minDockerVersion) &&
      valid(currentDockerVersion) &&
      gt(minDockerVersion, currentDockerVersion)
  );

  if (requiresDockerUpdate) return minDockerVersion;
  return null;
}
