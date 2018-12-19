const intersect = require('../utils/intersect');

/**
 * @param {Array} requestedDnps = [
 *   'nginx-proxy.dnp.dappnode.eth',
 *   'otpweb.dnp.dappnode.eth',
 *   'kovan.dnp.dappnode.eth'
 * ]
 *
 * @param {Array} installedDnps = [
 *    {
 *      version: '0.0.3',
 *      origin: '/ipfs/Qmb3L7wgoJ8UvduwcwjqUudcEnZgXKVAZvQ8rNE5L6vR34',
 *      dependencies: { 'nginx-proxy.dnp.dappnode.eth': 'latest' },
 *      name: 'nginx-proxy.dnp.dappnode.eth',
 *    },
 *    ...
 *  ]
 * @returns {Array}
 */

function getRelevantInstalledDnps({requestedDnps, installedDnps}) {
  // Prevent possible recursive loops
  const start = Date.now();

  const state = {};
  const intersectedDnps = intersect(
    requestedDnps,
    installedDnps.map((dnp) => dnp.name)
  );
  const installedDnpsWithDeps = installedDnps.filter((dnp) => dnp.dependencies);
  intersectedDnps.forEach((dnpName) => {
    const dnp = installedDnps.find((dnp) => dnp.name === dnpName);
    addDependants(dnp);
  });
  // Return only packages that are not already included in the requestedDnps array
  return Object.values(state).filter((dnp) => !requestedDnps.includes(dnp.name));

  function addDependants(dnp) {
    // Prevent possible recursive loops
    if (Date.now() - start > 2000) return;

    addToState(dnp);
    installedDnpsWithDeps.forEach((dependantPkg) => {
      if (dependsOn(dependantPkg, dnp) && !isInState(dependantPkg)) {
        addDependants(dependantPkg);
      }
    });
  }

  function addToState(dnp) {
    state[dnp.name] = dnp;
  }
  function isInState(dnp) {
    return Boolean(state[dnp.name]);
  }
  function dependsOn(dependantPkg, dnp) {
    return Boolean(dependantPkg.dependencies[dnp.name]);
  }
}

module.exports = getRelevantInstalledDnps;
