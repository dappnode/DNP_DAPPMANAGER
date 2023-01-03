import { InstallPackageData } from "@dappnode/common";
import semver from "semver";
import params from "../../params";
import { listPackageNoThrow } from "../docker/list";

interface PrysmLegacySpec {
  prysmDnpName: string;
  prysmVersion: string;
  web3signerDnpName: string;
  incompatibleClientsDnpNames: string[];
}

/**
 * Returns if it is Prysm legacy
 */
export function isPrysmLegacy(dnpName: string, dnpVersion: string): boolean {
  const dnpVersionParsed = semver.valid(dnpVersion);
  if (!dnpVersionParsed) return false;
  return params.prysmLegacySpecs.some(
    clientPkg =>
      clientPkg.prysmDnpName === dnpName &&
      semver.lt(dnpVersionParsed, clientPkg.prysmVersion)
  );
}

/**
 * Ensure the following requirements for Eth2 migration:
 * - Ensure not installing Prysm legacy
 * - Ensure not installing web3signer if Prysm legacy is installed
 * - Ensure not installing any other client if Prysm legacy is installed
 */
export async function ensureEth2MigrationRequirements(
  packagesData: InstallPackageData[]
): Promise<void> {
  const prysmLegacyVersions = new Map(
    params.prysmLegacySpecs.map(({ prysmDnpName, prysmVersion }) => [
      prysmDnpName,
      prysmVersion
    ])
  );

  try {
    for (const pkg of packagesData) {
      const prysmVersion = prysmLegacyVersions.get(pkg.dnpName);

      // not allow to install Prysm Legacy
      if (prysmVersion && semver.lte(pkg.semVersion, prysmVersion))
        throw Error(
          `${pkg.dnpName}:${pkg.semVersion} is a legacy validator client, install a more recent version with remote signer support`
        );
      // bypass if it is a Prysm update that installs web3signer
      if (prysmVersion && semver.gt(pkg.semVersion, prysmVersion)) return;

      await Promise.all(
        params.prysmLegacySpecs.map(async prysmLegacySpec => {
          await ensureNotInstallWeb3signerIfPrysmLegacyIsInstalled(
            prysmLegacySpec,
            pkg
          );

          await ensureNotInstallOtherClientIfPrysmLegacyIsInstalled(
            prysmLegacySpec,
            pkg
          );
        })
      );
    }
  } catch (e) {
    e.message = `Eth2 migration requirements failed: ${e.message}`;
    throw e;
  }
}

export async function ensureNotInstallWeb3signerIfPrysmLegacyIsInstalled(
  prysmLegacySpec: PrysmLegacySpec,
  pkg: InstallPackageData
): Promise<void> {
  if (pkg.dnpName === prysmLegacySpec.web3signerDnpName) {
    const prysmPkg = await listPackageNoThrow({
      dnpName: prysmLegacySpec.prysmDnpName
    });
    if (prysmPkg && semver.lte(prysmPkg.version, prysmLegacySpec.prysmVersion))
      throw Error(
        `Not allowed to install ${prysmLegacySpec.web3signerDnpName} having Prysm legacy client installed ${prysmPkg.dnpName}:${prysmPkg.version}. Update it or remove it`
      );
  }
}

export async function ensureNotInstallOtherClientIfPrysmLegacyIsInstalled(
  prysmLegacySpec: PrysmLegacySpec,
  pkg: InstallPackageData
): Promise<void> {
  if (prysmLegacySpec.incompatibleClientsDnpNames.includes(pkg.dnpName)) {
    const prysmPkg = await listPackageNoThrow({
      dnpName: prysmLegacySpec.prysmDnpName
    });

    if (prysmPkg && semver.lte(prysmPkg.version, prysmLegacySpec.prysmVersion))
      throw Error(
        `Not allowed to install client ${pkg.dnpName} having Prysm legacy client installed: ${prysmPkg.dnpName}:${prysmPkg.version}. Update it or remove it`
      );
  }
}
