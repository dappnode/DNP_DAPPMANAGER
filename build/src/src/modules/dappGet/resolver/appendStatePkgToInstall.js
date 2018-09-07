const getPkgsToInstall = require('./getPkgsToInstall');

function appendStatePkgToInstall(pkgToInstall, state, repo) {
    Object.keys(state).forEach((pkgName) => {
        const pkgVer = state[pkgName];
        const pkgDeps = Object.keys(repo[pkgName][pkgVer]);
        // Check that this state package is not already in pkgToInstall
        if (pkgName in pkgToInstall) return;
        // && it has a dependency that may be updated
        if (!pkgDeps.some((dep) => dep in pkgToInstall)) return;
        // For each state package, fetch the dependencies of valid versions
        // and include them to pkgToInstall
        const pkgToInstallFromState = getPkgsToInstall(pkgName, '>='+pkgVer, repo);
        Object.keys(pkgToInstallFromState).forEach((pkg) => {
            // Remove duplicated instances of versions
            pkgToInstall[pkg] = uniqArray([
                ...(pkgToInstall[pkg] || []),
                ...pkgToInstallFromState[pkg],
            ]);
        });
    });
    return pkgToInstall;
}

let uniqArray = (arrArg) => arrArg.filter((elem, pos, arr) => arr.indexOf(elem) == pos);


module.exports = appendStatePkgToInstall;
