const intersect = require('../utils/intersect');

/**
 * @param {array} requestedPackages = [
 *   'nginx-proxy.dnp.dappnode.eth',
 *   'otpweb.dnp.dappnode.eth',
 *   'kovan.dnp.dappnode.eth'
 * ]
 *
 * @param {array} installedPackages = [
 *    {
 *      version: '0.0.3',
 *      origin: '/ipfs/Qmb3L7wgoJ8UvduwcwjqUudcEnZgXKVAZvQ8rNE5L6vR34',
 *      dependencies: { 'nginx-proxy.dnp.dappnode.eth': 'latest' },
 *      name: 'nginx-proxy.dnp.dappnode.eth',
 *    },
 *    ...
 *  ]
 */

function getRelevantInstalledPackages(requestedPackages, installedPackages) {
  const state = {};
  const intersectedPackages = intersect(requestedPackages, installedPackages);
  intersectedPackages.forEach(addDependants);
  return Object.values(state);

  function addDependants(pkg) {
    addToState(pkg);
    installedPackages.forEach((dependantPkg) => {
      if (dependsOn(dependantPkg, pkg) && !isInState(dependantPkg)) {
        addDependants(dependantPkg);
      }
    });
  }

  function addToState(pkg) {
    state[pkg.name] = pkg;
  }
  function isInState(pkg) {
    return Boolean(state[pkg.name]);
  }
  function dependsOn(dependantPkg, pkg) {
    return Boolean(dependantPkg.dependencies[pkg.name]);
  }
}

module.exports = getRelevantInstalledPackages;
