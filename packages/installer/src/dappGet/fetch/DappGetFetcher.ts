import { Dependencies, InstalledPackageData } from "@dappnode/types";
import { validRange, satisfies, valid, maxSatisfying } from "semver";
import { DappnodeInstaller } from "../../dappnodeInstaller.js";
import { listPackages } from "@dappnode/dockerapi";
import { isIpfsHash } from "../../utils.js";

export class DappGetFetcher {
  /**
   * Fetches the dependencies of a given DNP name and version.
   * Injects the optional dependencies if the package is installed.
   * @returns dependencies:
   *   { dnp-name-1: "semverRange", dnp-name-2: "/ipfs/Qmf53..."}
   */
  async dependenciesToInstall(
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
    await this.defineExactVersions(dependencies, dappnodeInstaller);

    console.log(`Resolved dependencies to install for ${name}@${version}: ${JSON.stringify(dependencies)}`);

    return dependencies;
  }

  /**
   * Fetches the available versions given a request.
   * Will fetch the versions from different places according to the type of version range:
   * - valid semver range: Fetch the valid versions from APM
   * - valid semver version (not range): Return that version
   * - invalid semver version ("/ipfs/Qmre4..."): Assume it's the only version
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
    // Case 3. invalid semver version ("/ipfs/Qmre4..."): Assume it's the only version
    return [versionRange];
  }

  /**
   * Merges optional dependencies into the main dependencies object if the corresponding 
   * packages are installed.
   *
   * @param dependencies The main dependencies object to be merged into.
   * @param optionalDependencies The optional dependencies to be checked and merged.
   * @param installedPackages The list of currently installed packages.
   */
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

  /**
   * Processes the dependencies by first filtering out those that are already satisfied by installed packages
   * and then converting any remaining semver ranges to appropriate APM versions.
   *
   * @param dependencies The main dependencies object to be processed.
   * @param installedPackages The list of currently installed packages.
   */
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

      // Remove dependency if it is already satisfied by an installed package
      if (installedPackage && satisfies(installedPackage.version, depVersion)) {
        console.log(
          `Dependency ${depName} is already installed with version ${installedPackage.version}`
        );
        delete dependencies[depName];
      }
    }
  }

  /**
   * Resolves and updates the given dependencies to their exact version by determining the maximum satisfying version.
   * 
   * This method takes a set of dependencies where the version is specified as a semver range and resolves it to the exact
   * version that should be installed. It does so by fetching all published versions of each dependency from the APM and 
   * determining the highest version that satisfies the given semver range.
   *
   * @param dependencies - An object representing the dependencies where the key is the dependency name and the value is the semver range or version.
   * @param dappnodeInstaller - An instance of `DappnodeInstaller` used to fetch published versions from the APM.
   * @throws If a semver range is invalid or if no satisfying version can be found for a dependency.
   * 
   * @example
   * // Given the following dependencies object with semver ranges:
   * const dependencies = {
   *   "example-dnp": "^1.0.0",
   *   "another-dnp": "2.x",
   *   "ipfs-dnp": "/ipfs/QmXf2...abc"
   * };
   * 
   * // And assuming the following versions are available in the APM:
   * // example-dnp: ["1.0.0", "1.1.0", "1.2.0"]
   * // another-dnp: ["2.0.0", "2.1.0", "2.5.0"]
   * // ipfs-dnp: ["/ipfs/QmXf2...abc"]
   * 
   * // After calling defineExactVersions:
   * await defineExactVersions(dependencies, dappnodeInstaller);
   * 
   * // The dependencies object will be updated to:
   * // {
   * //   "example-dnp": "1.2.0",  // The highest version satisfying "^1.0.0"
   * //   "another-dnp": "2.5.0",  // The highest version satisfying "2.x"
   * //   "ipfs-dnp": "/ipfs/QmXf2...abc"  // Exact match
   * // }
   */
  private async defineExactVersions(
    dependencies: Dependencies,
    dappnodeInstaller: DappnodeInstaller
  ): Promise<void> {

    for (const [depName, depVersion] of Object.entries(dependencies)) {

      if (isIpfsHash(depVersion)) continue;

      if (!validRange(depVersion))
        throw new Error(`Invalid semver notation for dependency ${depName}: ${depVersion}`);

      const pkgPublishments = await dappnodeInstaller.fetchApmVersionsState(depName);

      const pkgVersions = Object.values(pkgPublishments)
        .map(({ version }) => version);

      const maxSatisfyingVersion = maxSatisfying(pkgVersions, depVersion);

      if (!maxSatisfyingVersion)
        throw new Error(`Could not find any satisfying versions for ${depName}`);

      dependencies[depName] = maxSatisfyingVersion;

    }
  }
}