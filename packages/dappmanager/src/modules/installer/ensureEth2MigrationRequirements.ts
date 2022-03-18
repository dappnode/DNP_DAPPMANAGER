import { InstallPackageData } from "../../types";
import semver from "semver";
import params from "../../params";
import { listPackageNoThrow } from "../docker/list";

/**
 * Ensure the following requirements for Eth2 migration:
 * - From dappmanager v0.2.46 prevent from installing legacy version (previous to remote signer support) for packages: (Prysm, Prysm-prater and Gnosis-Beacon-Chain-Prysm)
 * -
 */
export async function ensureEth2MigrationRequirements(
  packagesData: InstallPackageData[]
): Promise<void> {
  for (const pkg of packagesData) {
    params.minimumAllowedPackageVersions.forEach(
      async ({ dnpName, version }) => {
        // Ensure is not a validator client legacy package
        if (pkg.dnpName === dnpName && semver.lte(pkg.semVersion, version))
          throw Error(
            `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
          );
        // Ensure not installing web3signer if legacy client is installed
        if (pkg.dnpName === params.web3SignerDnpName) {
          const prysmPackage = await listPackageNoThrow({ dnpName: dnpName });
          if (prysmPackage && semver.lte(prysmPackage.version, version))
            throw Error(
              `${params.web3SignerDnpName} cannot be installed having a legacy validator client installed, install a more recent version with remote signer support`
            );
        }
      }
    );
  }
}
