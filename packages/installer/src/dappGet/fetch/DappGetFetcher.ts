import { Dependencies } from "@dappnode/types";
import { validRange, satisfies, valid } from "semver";
import { DappnodeInstaller } from "../../dappnodeInstaller.js";
import { listPackageNoThrow } from "@dappnode/dockerapi";

export class DappGetFetcher {
  /**
   * Fetches the dependencies of a given DNP name and version
   * Injects the optional dependencies if the package is installed
   * @returns dependencies:
   *   { dnp-name-1: "semverRange", dnp-name-2: "/ipfs/Qmf53..."}
   */
  async dependencies(dappnodeInstaller: DappnodeInstaller, name: string, version: string): Promise<Dependencies> {
    const manifest = await dappnodeInstaller.getManifestFromDir(name, version);
    const dependencies = manifest.dependencies || {};

    const optionalDependencies = manifest.optionalDependencies;
    if (optionalDependencies) {
      // Iterate over optional dependencies and inject them if installed
      for (const [optionalDependencyName, optionalDependencyVersion] of Object.entries(optionalDependencies)) {
        const optionalDependency = await listPackageNoThrow({
          dnpName: optionalDependencyName
        });
        if (!optionalDependency) continue;
        dependencies[optionalDependencyName] = optionalDependencyVersion;
      }
    }

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
  async versions(dappnodeInstaller: DappnodeInstaller, name: string, versionRange: string): Promise<string[]> {
    if (validRange(versionRange)) {
      if (versionRange === "*") {
        // ##### TODO: Case 0. Force "*" to strictly fetch the last version only
        // If "*" is interpreted as any version, many old manifests are not well
        // hosted and delay the resolution too much because all old versions have
        // to timeout in order to proceed
        const { version: latestVersion } = await dappnodeInstaller.getVersionAndIpfsHash({
          dnpNameOrHash: name
        });
        return [latestVersion];
      } else if (valid(versionRange)) {
        // Case 1. Valid semver version (not range): Return that version
        return [versionRange];
      } else {
        // Case 1. Valid semver range: Fetch the valid versions from APM
        const requestedVersions = await dappnodeInstaller.fetchApmVersionsState(name);
        return Object.values(requestedVersions)
          .map(({ version }) => version)
          .filter((version) => satisfies(version, versionRange));
      }
    }
    // Case 3. unvalid semver version ("/ipfs/Qmre4..."): Asume it's the only version
    return [versionRange];
  }
}
