import { DappGetDnps } from "../types.js";
import { logs } from "@dappnode/logger";

/**
 * Cleans up the DNPs dependency graph by:
 * 1. Removing DNPs with no versions left
 * 2. Removing versions with missing dependencies
 * Repeats until the graph is stable or a safety limit is reached. 
 * Removing a version or a DNP may cause other DNPs or versions to become invalid, so we need to repeat the process.
 * If we have not changed in an iteration, the graph is stable and we can stop.
 */
export function cleanupDnps(dnps: DappGetDnps) {
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
        logs.debug(`[cleanupDnps] Removing DNP with no versions: ${dnpName}`);
        delete dnps[dnpName];
        changed = true;
      }
    }
    // Remove versions with missing dependencies
    for (const dnpName of Object.keys(dnps)) {
      for (const version of Object.keys(dnps[dnpName].versions)) {
        const deps = dnps[dnpName].versions[version];
        const missingDeps = Object.keys(deps).filter(dep => !dnps[dep]);
        if (missingDeps.length > 0) {
          logs.debug(`[cleanupDnps] Removing version with missing dependencies: ${dnpName}@${version}, missing deps: ${missingDeps.join(", ")}`);
          delete dnps[dnpName].versions[version];
          changed = true;
        }
      }
    }
  }
}
