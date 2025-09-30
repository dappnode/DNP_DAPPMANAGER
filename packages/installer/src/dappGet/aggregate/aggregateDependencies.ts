import { hasVersion, setVersion } from "../utils/dnpUtils.js";
import { sanitizeVersions } from "../utils/sanitizeVersions.js";
import { sanitizeDependencies } from "../utils/sanitizeDependencies.js";
import { DappGetDnps } from "../types.js";
import { DappGetFetcher } from "../fetch/index.js";
import { DappnodeInstaller } from "../../dappnodeInstaller.js";

// Simpler cleanup: remove DNPs with no versions, then remove versions with missing dependencies, repeat until stable
function cleanupDnps(dnps: DappGetDnps) {
  let changed = true;
  let safety = 0;
  const MAX_ITER = 1000;
  while (changed) {
    if (++safety > MAX_ITER) {
      throw new Error("cleanupDnps: Exceeded max iterations, possible infinite loop");
    }
    changed = false;
    // Remove DNPs with no versions
    for (const dnpName of Object.keys(dnps)) {
      if (Object.keys(dnps[dnpName].versions).length === 0) {
        delete dnps[dnpName];
        changed = true;
      }
    }
    // Remove versions with missing dependencies
    for (const dnpName of Object.keys(dnps)) {
      for (const version of Object.keys(dnps[dnpName].versions)) {
        const deps = dnps[dnpName].versions[version];
        if (Object.keys(deps).some(dep => !dnps[dep])) {
          delete dnps[dnpName].versions[version];
          changed = true;
        }
      }
    }
  }
}

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
      // 2. Get dependencies of this specific version
      //    dependencies = { dnp-name-1: "semverRange", dnp-name-2: "/ipfs/Qmf53..."}
      let dependencies;
      try {
        dependencies = await dappGetFetcher
          .dependencies(dappnodeInstaller, name, version)
          .then(sanitizeDependencies);
      } catch (e) {
        // Remove this version if dependencies cannot be fetched
        if (dnps[name] && dnps[name].versions) {
          delete dnps[name].versions[version];
        }
        return;
      }

      // 3. Store the dependency if it was fetched correctly
      setVersion(dnps, name, version, dependencies);
      // 4. Fetch sub-dependencies recursively
      let subDepFailed = false;
      await Promise.all(
        Object.keys(dependencies).map(async (dependencyName) => {
          try {
            await aggregateDependencies({
              dappnodeInstaller,
              name: dependencyName,
              versionRange: dependencies[dependencyName],
              dnps,
              recursiveCount,
              dappGetFetcher
            });
          } catch (e) {
            subDepFailed = true;
          }
        })
      );
      // If any sub-dependency failed, remove this version
      if (subDepFailed && dnps[name] && dnps[name].versions) {
        delete dnps[name].versions[version];
      }
    })
  );

  // Use the simpler cleanup
  cleanupDnps(dnps);
}
