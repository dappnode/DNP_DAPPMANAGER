const safeSemver = require('../utils/safeSemver');

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
            .filter((ver) => safeSemver.satisfies(ver, verReq))
            .sort(safeSemver.rcompare);
        } else if (Object.keys(state).includes(pkg)) {
            // State packages
            pkgToInstall[pkg] = pkgToInstall[pkg]
            .sort(safeSemver.compare);
            // State package must be given the option of not upgrading.
            // The current algorithm needs this option to be passed explicitly to be considered
            pkgToInstall[pkg].unshift(state[pkg]);
            // Ensure uniqness
            pkgToInstall[pkg] = uniqueArray(pkgToInstall[pkg]);
        } else {
            // Others = new packages
            pkgToInstall[pkg] = pkgToInstall[pkg]
            .sort(safeSemver.rcompare);
            // Newly install packages must be given the option of not being installed.
            // The current algorithm needs this option to be passed explicitly to be considered
            pkgToInstall[pkg].unshift(null);
        }
    }
    return pkgToInstall;
}

function uniqueArray(a) {
    return a ? a.filter((item, pos, self) => self.indexOf(item) == pos) : a;
}


module.exports = prioritizeVersions;
