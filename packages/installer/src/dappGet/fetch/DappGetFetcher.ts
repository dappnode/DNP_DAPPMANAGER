import { Dependencies, InstalledPackageData } from "@dappnode/types";
import { validRange, satisfies, valid, Range } from "semver";
import { DappnodeInstaller } from "../../dappnodeInstaller.js";
import { listPackages } from "@dappnode/dockerapi";

export class DappGetFetcher {
  /**
   * Fetches the dependencies of a given DNP name and version
   * Injects the optional dependencies if the package is installed
   * @returns dependencies:
   *   { dnp-name-1: "semverRange", dnp-name-2: "/ipfs/Qmf53..."}
   */
  async dependencies(
    dappnodeInstaller: DappnodeInstaller,
    name: string,
    version: string
  ): Promise<Dependencies> {
    const manifest = await dappnodeInstaller.getManifestFromDir(name, version);
    const dependencies = manifest.dependencies || {};
    const optionalDependencies = manifest.optionalDependencies || {};
    const installedPackages = await listPackages();

    this.mergeOptionalDependencies(dependencies, optionalDependencies, installedPackages);
    this.filterSatisfiedDependencies(dependencies, installedPackages);

    return dependencies;
  }

  /**
   * Fetches the available versions given a request.
   * Will fetch the versions from different places according the type of version range:
   * - valid semver range: Fetch the valid versions from APM
   * - valid semver version (not range): Return that version
   * - unvalid semver version ("/ipfs/Qmre4..."): Asume it's the only version
   *
   * @param kwargs: {
   *   name: Name of package i.e. "kovan.dnp.dappnode.eth"
   *   versionRange: version range requested i.e. "^0.1.0" or "0.1.0" or "/ipfs/Qmre4..."
   * }
   * @returns set of versions
   */
  async versions(
    dappnodeInstaller: DappnodeInstaller,
    name: string,
    versionRange: string
  ): Promise<string[]> {
    if (validRange(versionRange)) {
      if (versionRange === "*") {
        // ##### TODO: Case 0. Force "*" to strictly fetch the last version only
        // If "*" is interpreted as any version, many old manifests are not well
        // hosted and delay the resolution too much because all old versions have
        // to timeout in order to proceed
        const { version: latestVersion } =
          await dappnodeInstaller.getVersionAndIpfsHash({
            dnpNameOrHash: name,
          });
        return [latestVersion];
      } else if (valid(versionRange)) {
        // Case 1. Valid semver version (not range): Return that version
        return [versionRange];
      } else {
        // Case 1. Valid semver range: Fetch the valid versions from APM
        const requestedVersions = await dappnodeInstaller.fetchApmVersionsState(
          name
        );
        return Object.values(requestedVersions)
          .map(({ version }) => version)
          .filter((version) => satisfies(version, versionRange));
      }
    }
    // Case 3. unvalid semver version ("/ipfs/Qmre4..."): Asume it's the only version
    return [versionRange];
  }

  private mergeOptionalDependencies(
    dependencies: Dependencies,
    optionalDependencies: Dependencies,
    installedPackages: InstalledPackageData[]
  ): void {
    for (const [optionalDepName, optionalDepVersion] of Object.entries(optionalDependencies)) {
      const isInstalled = installedPackages.some(
        (installedPackage) => installedPackage.dnpName === optionalDepName
      );

      if (isInstalled) {
        dependencies[optionalDepName] = optionalDepVersion;
      }
    }
  }

  private filterSatisfiedDependencies(
    dependencies: Dependencies,
    installedPackages: InstalledPackageData[]
  ): void {
    for (const [depName, depVersion] of Object.entries(dependencies)) {
      const installedPackage = installedPackages.find(
        (pkg) => pkg.dnpName === depName
      );

      if (!validRange(depVersion))
        throw new Error(`Invalid semver notation for dependency ${depName}: ${depVersion}`);

      if (depVersion.includes('||') || depVersion.includes(' ')) {
        throw new Error(`Unsupported version range for dependency ${depName}: ${depVersion}. Only simple ranges are supported`);
      }

      if (installedPackage && satisfies(installedPackage.version, depVersion)) {
        console.log(
          `Dependency ${depName} is already installed with version ${installedPackage.version}`
        );
        // Remove the dependency if the installed version satisfies the required version
        delete dependencies[depName];
      } else {

        // Use "*" (latest) if the dependency is not installed and version is >... or >=... 
        if (!installedPackage && /^>=?\d+\.\d+\.\d+$/.test(depVersion)) {
          dependencies[depName] = '*';

          // Use x.x.x if the dependency is not installed and version is ^x.x.x or ~x.x.x
        } else if (!installedPackage && /^[\^~]\d+\.\d+\.\d+$/.test(depVersion)) {

          // Remove the operator prefix and use the defined version
          dependencies[depName] = depVersion.slice(1);

        } else {

          throw new Error(`Unsupported version range for dependency ${depName}: ${depVersion}. Only simle ranges with operators ^, ~, > and >= are supported`);
        }
      }
    }
  }
}
