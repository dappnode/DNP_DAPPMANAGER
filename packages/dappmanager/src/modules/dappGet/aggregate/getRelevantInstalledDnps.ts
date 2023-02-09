import { intersection } from "lodash-es";
import { InstalledPackageData } from "@dappnode/common";

/**
 * @param requestedDnps = [
 *   'nginx-proxy.dnp.dappnode.eth',
 *   'otpweb.dnp.dappnode.eth',
 *   'kovan.dnp.dappnode.eth'
 * ]
 *
 * @param installedDnps = [
 *    {
 *      version: '0.0.3',
 *      origin: '/ipfs/Qmb3L7wgoJ8UvduwcwjqUudcEnZgXKVAZvQ8rNE5L6vR34',
 *      dependencies: { 'nginx-proxy.dnp.dappnode.eth': 'latest' },
 *      name: 'nginx-proxy.dnp.dappnode.eth',
 *    },
 *    ...
 *  ]
 */

export default function getRelevantInstalledDnps({
  requestedDnps,
  installedDnps
}: {
  requestedDnps: string[];
  installedDnps: InstalledPackageData[];
}): InstalledPackageData[] {
  // Prevent possible recursive loops
  const start = Date.now();

  const state: { [dnpName: string]: InstalledPackageData } = {};
  const intersectedDnps = intersection(
    requestedDnps,
    installedDnps.map(dnp => dnp.dnpName)
  );
  const installedDnpsWithDeps = installedDnps.filter(dnp => dnp.dependencies);
  for (const dnpName of intersectedDnps) {
    const dnp = installedDnps.find(dnp => dnp.dnpName === dnpName);
    if (dnp) addDependants(dnp);
  }
  // Return only packages that are not already included in the requestedDnps array
  return Object.values(state).filter(
    dnp => !requestedDnps.includes(dnp.dnpName)
  );

  function addDependants(dnp: InstalledPackageData): void {
    // Prevent possible recursive loops
    if (Date.now() - start > 2000) return;

    addToState(dnp);
    for (const dependantPkg of installedDnpsWithDeps) {
      if (dependsOn(dependantPkg, dnp) && !isInState(dependantPkg)) {
        addDependants(dependantPkg);
      }
    }
  }

  function addToState(dnp: InstalledPackageData): void {
    state[dnp.dnpName] = dnp;
  }
  function isInState(dnp: InstalledPackageData): boolean {
    return Boolean(state[dnp.dnpName]);
  }
  function dependsOn(
    dependantPkg: InstalledPackageData,
    dnp: InstalledPackageData
  ): boolean {
    return Boolean(dependantPkg.dependencies[dnp.dnpName]);
  }
}
