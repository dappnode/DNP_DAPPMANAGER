import { hasVersion, setVersion } from "../utils/dnpUtils.js";
import { sanitizeVersions } from "../utils/sanitizeVersions.js";
import { sanitizeDependencies } from "../utils/sanitizeDependencies.js";
import { DappGetDnps } from "../types.js";
import { DappGetFetcher } from "../fetch/index.js";
import { DappnodeInstaller } from "../../dappnodeInstaller.js";

/**
 * The goal of this function is to recursively aggregate all dependencies
 * of a given request. The structure of the data is:
 * dnps = {
 *   dnp-name-1: {
 *     version-1: { dependency-name-1: semverRange, dependency-name-2: ipfsHash },
 *     version-2: ...,
 *     ...
 *   },
 *   dnp-name-2: ...,
 *   ...
 * }
 *
 * IPFS versions will be treated generically as non-semver.
 * Non-semver versions
 */

export default async function aggregateDependencies({
  dappnodeInstaller,
  name,
  versionRange,
  dnps,
  recursiveCount,
  dappGetFetcher
}: {
  dappnodeInstaller: DappnodeInstaller;
  name: string;
  versionRange: string;
  dnps: DappGetDnps;
  recursiveCount?: number;
  dappGetFetcher: DappGetFetcher;
}): Promise<void> {
  // Control infinite loops
  if (!recursiveCount) recursiveCount = 1;
  else if (recursiveCount++ > 1000) return;

  // Check injected dependency
  if (!dappGetFetcher) throw Error('injected dependency "fetch" is not defined');

  // 1. Fetch versions of "name" that match this request
  //    versions = [ "0.1.0", "/ipfs/QmFe3..."]
  const versions = await dappGetFetcher.versions(dappnodeInstaller, name, versionRange).then(sanitizeVersions);

  await Promise.all(
    versions.map(async (version) => {
      // Already checked, skip. Otherwise lock request to prevent duplicate fetches
      if (hasVersion(dnps, name, version)) return;
      else setVersion(dnps, name, version, {});

      let dependencies;
      try {
        dependencies = await dappGetFetcher
          .dependencies(dappnodeInstaller, name, version)
          .then(sanitizeDependencies);
      } catch (e) {
        // Log the error and skip this version
        // Prefer using the DappNode logger if possible, otherwise fallback to console
        if (typeof console !== "undefined" && console.warn) {
          console.warn(`Skipping ${name}@${version}: could not fetch dependencies: ${e.message}`);
        }
        // Remove placeholder from dnps if present
        if (dnps[name] && dnps[name].versions) {
          delete dnps[name].versions[version];
          // If no versions left, delete dnps[name] as well (optional, cleaner)
          if (Object.keys(dnps[name].versions).length === 0) {
            delete dnps[name];
          }
        }
        return;
      }

      setVersion(dnps, name, version, dependencies);

      await Promise.all(
        Object.keys(dependencies).map(async (dependencyName) => {
          await aggregateDependencies({
            dappnodeInstaller,
            name: dependencyName,
            versionRange: dependencies[dependencyName],
            dnps,
            recursiveCount,
            dappGetFetcher
          });
        })
      );
    })
  );
}