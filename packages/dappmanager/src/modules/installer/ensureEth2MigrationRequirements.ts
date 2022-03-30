import { InstallPackageData } from "../../types";
import semver from "semver";
import params from "../../params";
import { listPackageNoThrow } from "../docker/list";

/**
 * Ensure the following requirements for Eth2 migration:
 * - From dappmanager v0.2.46 prevent from installing legacy version (previous to remote signer support) for packages: (Prysm, Prysm-prater and Gnosis-Beacon-Chain-Prysm)
 * - Ensure not to install web3signer if Prysm package legacy version is installed
 */
export async function ensureEth2MigrationRequirements(
  packagesData: InstallPackageData[]
): Promise<void> {
  const minimumAllowedPackageVersions = new Map(
    params.minimumAllowedPackageVersions.map(({ dnpName, version }) => [
      dnpName,
      version
    ])
  );

  const web3SignerClientsDnpNames = new Map(
    params.web3SignerClientsDnpNames.map(
      ({ web3SignerDnpName, clientDnpName }) => [
        web3SignerDnpName,
        clientDnpName
      ]
    )
  );

  for (const pkg of packagesData) {
    // Ensure not to install a legacy version of a package
    const pkgLegacyVersion = minimumAllowedPackageVersions.get(pkg.dnpName);
    if (pkgLegacyVersion && semver.lte(pkg.semVersion, pkgLegacyVersion))
      throw Error(
        `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
      );

    // Ensure not to install web3signer if client package legacy version is installed
    const web3SignerClientDnpName = web3SignerClientsDnpNames.get(pkg.dnpName);
    if (!web3SignerClientDnpName) continue;
    const web3SignerClientPkg = await listPackageNoThrow({
      dnpName: web3SignerClientDnpName
    });
    if (!web3SignerClientPkg) continue;
    if (semver.lte(pkg.semVersion, web3SignerClientPkg.version)) {
      throw Error(
        `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
      );
    }
  }
}

export function isClientLegacy(dnpName: string, dnpVersion: string): boolean {
  const dnpVersionParsed = semver.valid(dnpVersion);
  if (!dnpVersionParsed) return false;
  return params.minimumAllowedPackageVersions.some(
    clientPkg =>
      clientPkg.dnpName === dnpName &&
      semver.lt(dnpVersionParsed, clientPkg.version)
  );
}
