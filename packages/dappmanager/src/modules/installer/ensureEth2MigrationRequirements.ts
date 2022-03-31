import { InstallPackageData } from "../../types";
import semver from "semver";
import params from "../../params";
import { listPackageNoThrow } from "../docker/list";

/**
 * Check it is a legacy client package version
 */
export function isClientLegacy(dnpName: string, dnpVersion: string): boolean {
  const dnpVersionParsed = semver.valid(dnpVersion);
  if (!dnpVersionParsed) return false;
  return params.minimumAllowedClientsLegacyVersions.some(
    clientPkg =>
      clientPkg.clientDnpName === dnpName &&
      semver.lt(dnpVersionParsed, clientPkg.clientVersion)
  );
}

/**
 * Ensure the following requirements for Eth2 migration, from dappmanager v0.2.46 prevent the following:
 * - Ensure not installing client legacy version (previous to remote signer support) for packages: (Prysm, Prysm-prater and Gnosis-Beacon-Chain-Prysm)
 * - Ensure not installing web3signer if Prysm package legacy version is installed
 */
export async function ensureEth2MigrationRequirements(
  packagesData: InstallPackageData[]
): Promise<void> {
  const minimumAllowedClientVersions = new Map(
    params.minimumAllowedClientsLegacyVersions.map(
      ({ clientDnpName, clientVersion }) => [clientDnpName, clientVersion]
    )
  );

  for (const pkg of packagesData) {
    // Ensure not to install legacy client
    const pkgLegacyVersion = minimumAllowedClientVersions.get(pkg.dnpName);
    if (pkgLegacyVersion && semver.lte(pkg.semVersion, pkgLegacyVersion))
      throw Error(
        `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
      );

    // Ensure not to install web3signer if client package legacy version is installed
    params.minimumAllowedClientsLegacyVersions.map(async item => {
      if (pkg.dnpName === item.web3signerDnpName) {
        const clientPkg = await listPackageNoThrow({
          dnpName: item.clientDnpName
        });
        if (clientPkg && semver.lte(clientPkg.version, pkg.semVersion))
          throw Error(
            `Not allowed to install web3signer having a legacy client installed it ${pkg.dnpName}:${pkg.semVersion}. Update it or remove it`
          );
      }
    });
  }
}
