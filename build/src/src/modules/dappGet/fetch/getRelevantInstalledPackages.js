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
  // Prevent possible recursive loops
  const start = Date.now();

  const state = {};
  const intersectedPackages = intersect(
    requestedPackages,
    installedPackages.map((pkg) => pkg.name)
  );
  const installedPackagesWithDeps = installedPackages.filter((pkg) => pkg.dependencies);
  intersectedPackages.forEach((pkgName) => {
    const pkg = installedPackages.find((pkg) => pkg.name === pkgName);
    addDependants(pkg);
  });
  // Return only packages that are not already included in the requestedPackages array
  return Object.values(state).filter((pkg) => !requestedPackages.includes(pkg.name));

  function addDependants(pkg) {
    // Prevent possible recursive loops
    if (Date.now() - start > 2000) return;

    addToState(pkg);
    installedPackagesWithDeps.forEach((dependantPkg) => {
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
