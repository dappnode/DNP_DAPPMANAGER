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
  const requiresCoreUpdate = getRequiresCoreUpdate({ manifest, installedPackages });
  const requiresDockerUpdate = await getRequiresDockerUpdate({ manifest });

  const errors: string[] = [];
  if (packagesRequiredToBeUninstalled.length > 0)
    errors.push(`The following packages must be uninstalled: ${packagesRequiredToBeUninstalled.join(", ")}`);
  if (requiresCoreUpdate) errors.push("The core package must be updated");
  if (requiresDockerUpdate) errors.push("Docker must be updated");
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

function getRequiresCoreUpdate({
  manifest,
  installedPackages
}: {
  manifest: Manifest;
  installedPackages: InstalledPackageData[];
}): boolean {
  const coreDnp = installedPackages.find((dnp) => dnp.dnpName === params.coreDnpName);
  if (!coreDnp) return false;
  const coreVersion = coreDnp.version;
  const minDnVersion = manifest.requirements ? manifest.requirements.minimumDappnodeVersion : "";
  return Boolean(minDnVersion && valid(minDnVersion) && valid(coreVersion) && gt(minDnVersion, coreVersion));
}
async function getRequiresDockerUpdate({ manifest }: { manifest: Manifest }): Promise<boolean> {
  const minDockerVersion = manifest.requirements?.minimumDockerVersion;
  if (!minDockerVersion) return false;
  const currentDockerVersion = await getDockerVersion();
  return Boolean(
    minDockerVersion &&
      valid(minDockerVersion) &&
      valid(currentDockerVersion) &&
      gt(minDockerVersion, currentDockerVersion)
  );
}
