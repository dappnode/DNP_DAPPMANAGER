import { InstallPackageData } from "../../types";
import semver from "semver";
import params from "../../params";

/**
 * From dappmanager v0.2.46 prevent from installing legacy version (previous to remote signer support) for packages:
 * - Prysm
 * - Prysm-Prater
 * - Gnosis-Beacon-Chain-Prysm
 */
export async function ensureIsNotValidatorLegacyPackage(
  packagesData: InstallPackageData[]
): Promise<void> {
  for (const pkg of packagesData) {
    params.minimumAllowedPackageVersions.forEach(({ dnpName, version }) => {
      if (pkg.dnpName === dnpName && semver.lte(pkg.semVersion, version))
        throw Error(
          `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
        );
    });
  }
}
