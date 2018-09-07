const semver = require('semver');
const byVerReq = require('../utils/byVerReq');
const safeSort = require('../utils/safeSort');

function prioritizeVersions(pkgToInstall, name, verReq, state) {
    // Order the versions to prioritize which successful case will be picked first
    // 1. Requested package, newest first
    // 2. State package, oldest first
    // 3. New packages, newest first
    // Also, enforce conditions:
    // 1. The requested version has to be satisfied
    for (const pkg of Object.keys(pkgToInstall)) {
        if (pkg === name) {
            // Requested package
            pkgToInstall[pkg] = pkgToInstall[pkg]
            .filter(byVerReq(verReq))
            .sort(safeSort(semver.rcompare));
        } else if (Object.keys(state).includes(pkg)) {
            // State packages
            pkgToInstall[pkg] = pkgToInstall[pkg]
            .sort(safeSort(semver.compare));
            // State package must be given the option of not upgrading.
            // The current algorithm needs this option to be passed explicitly to be considered
            pkgToInstall[pkg].unshift(state[pkg]);
        } else {
            // Others = new packages
            pkgToInstall[pkg] = pkgToInstall[pkg]
            .sort(safeSort(semver.rcompare));
            // Newly install packages must be given the option of not being installed.
            // The current algorithm needs this option to be passed explicitly to be considered
            pkgToInstall[pkg].unshift(null);
        }
    }
    return pkgToInstall;
}

module.exports = prioritizeVersions;
