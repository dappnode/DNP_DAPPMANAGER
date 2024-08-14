import { Dependencies } from "@dappnode/types";
import { isIpfsHash } from "../../utils.js";
import { DappnodeInstaller } from "../../dappnodeInstaller.js";
import { maxSatisfying, validRange } from "semver";

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
 * Given the following dependencies object with semver ranges:
 * const dependencies = {
 *   "example-dnp": "^1.0.0",
 *   "another-dnp": "2.x",
 *   "ipfs-dnp": "/ipfs/QmXf2...abc"
 * };
 * 
 * And assuming the following versions are available in the APM:
 * example-dnp: ["1.0.0", "1.1.0", "1.2.0"]
 * another-dnp: ["2.0.0", "2.1.0", "2.5.0"]
 * ipfs-dnp: ["/ipfs/QmXf2...abc"]
 * 
 * After calling defineExactVersions, the dependencies object will be updated to:
 * {
 *   "example-dnp": "1.2.0",  // The highest version satisfying "^1.0.0"
 *   "another-dnp": "2.5.0",  // The highest version satisfying "2.x"
 *   "ipfs-dnp": "/ipfs/QmXf2...abc"  // Exact match
 * }
 */
export async function parseSemverRangeToVersion(
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