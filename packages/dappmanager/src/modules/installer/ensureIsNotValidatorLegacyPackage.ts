import { InstallPackageData } from "../../types";
import semver from "semver";

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
    switch (pkg.dnpName) {
      case "prysm-prater.dnp.dappnode.eth":
        if (semver.lte(pkg.semVersion, "1.0.7"))
          throw Error(
            `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
          );
        continue;

      // To be included once after prysm-prater
      /*       case "gnosis-beacon-chain-prysm.dnp.dappnode.eth":
        if (semver.lte(pkg.semVersion, "1.0.0"))
          throw Error(
            `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
          );
        continue;
      case "prysm.dnp.dappnode.eth":
        if (semver.lte(pkg.semVersion, "1.0.0"))
          throw Error(
            `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
          );
        continue; */
      default:
        continue;
    }
  }
}
