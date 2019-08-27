import { intersection } from "lodash";
import { ContainerInterface } from "../../../types";

/**
 * @param {array} requestedDnps = [
 *   'nginx-proxy.dnp.dappnode.eth',
 *   'otpweb.dnp.dappnode.eth',
 *   'kovan.dnp.dappnode.eth'
 * ]
 *
 * @param {array} installedDnps = [
 *    {
 *      version: '0.0.3',
 *      origin: '/ipfs/Qmb3L7wgoJ8UvduwcwjqUudcEnZgXKVAZvQ8rNE5L6vR34',
 *      dependencies: { 'nginx-proxy.dnp.dappnode.eth': 'latest' },
 *      name: 'nginx-proxy.dnp.dappnode.eth',
 *    },
 *    ...
 *  ]
 * @returns {array}
 */

export default function getRelevantInstalledDnps({
  requestedDnps,
  installedDnps
}: {
  requestedDnps: string[];
  installedDnps: ContainerInterface[];
}): ContainerInterface[] {
  // Prevent possible recursive loops
  const start = Date.now();

  const state: { [dnpName: string]: ContainerInterface } = {};
  const intersectedDnps = intersection(
    requestedDnps,
    installedDnps.map(dnp => dnp.name)
  );
  const installedDnpsWithDeps = installedDnps.filter(dnp => dnp.dependencies);
  intersectedDnps.forEach(dnpName => {
    const dnp = installedDnps.find(dnp => dnp.name === dnpName);
    if (dnp) addDependants(dnp);
  });
  // Return only packages that are not already included in the requestedDnps array
  return Object.values(state).filter(dnp => !requestedDnps.includes(dnp.name));

  function addDependants(dnp: ContainerInterface) {
    // Prevent possible recursive loops
    if (Date.now() - start > 2000) return;

    addToState(dnp);
    installedDnpsWithDeps.forEach(dependantPkg => {
      if (dependsOn(dependantPkg, dnp) && !isInState(dependantPkg)) {
        addDependants(dependantPkg);
      }
    });
  }

  function addToState(dnp: ContainerInterface) {
    state[dnp.name] = dnp;
  }
  function isInState(dnp: ContainerInterface) {
    return Boolean(state[dnp.name]);
  }
  function dependsOn(
    dependantPkg: ContainerInterface,
    dnp: ContainerInterface
  ) {
    return Boolean(dependantPkg.dependencies[dnp.name]);
  }
}
