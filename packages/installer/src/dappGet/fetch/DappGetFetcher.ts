import { Dependencies, InstalledPackageData } from "@dappnode/types";
import { validRange, satisfies, valid, Range } from "semver";
import { DappnodeInstaller } from "../../dappnodeInstaller.js";
import { listPackages } from "@dappnode/dockerapi";

export class DappGetFetcher {
  /**
   * Fetches the dependencies of a given DNP name and version.
   * Injects the optional dependencies if the package is installed.
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
    this.processDependencies(dependencies, installedPackages);

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
  private processDependencies(
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

      // Remove dependency if it is already satisfied by an installed package
      if (installedPackage && satisfies(installedPackage.version, depVersion)) {
        console.log(
          `Dependency ${depName} is already installed with version ${installedPackage.version}`
        );
        delete dependencies[depName];
        continue;
      }

      dependencies[depName] = this.parseSemverRangeToApmVersion(depVersion);
    }
  }

  /**
   * Parses a semver range and converts it to a version suitable for APM.
   * Handles specific semver operators like ^, ~, >, >= and converts them to
   * appropriate APM-compatible versions.
   *
   * @param semverRange The semver range to be parsed.
   * @returns The parsed version as a string.
   */
  private parseSemverRangeToApmVersion(semverRange: string): string {
    // Exact version, just keep it
    if (/\d+\.\d+\.\d+$/.test(semverRange))
      return semverRange;

    // Use "*" (latest) if version is >... or >=...
    if (/^>=?\d+\.\d+\.\d+$/.test(semverRange)) {
      return '*';
    }

    // Use x.x.x if version is ^x.x.x or ~x.x.x
    if (/^[\^~]\d+\.\d+\.\d+$/.test(semverRange)) {
      return semverRange.slice(1);
    }

    throw new Error(`Unsupported version range (${semverRange}). Only simple ranges with operators ^, ~, > and >= are supported`);
  }
}
