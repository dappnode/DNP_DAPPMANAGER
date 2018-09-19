const getPkgsToInstall = require('./getPkgsToInstall');
const getFromRepo = require('../utils/getFromRepo');
const isIpfs = require('../utils/isIpfs');

function appendStatePkgToInstall(pkgToInstall, state, repo) {
    // Using forEach to return, instead of using a tree of ifs.
    Object.keys(state).forEach((pkgName) => {
        if (!(pkgName in repo)) {
            throw Error('State package not found in repo: '+pkgName);
        }
        const pkgVer = state[pkgName];
        const pkgDeps = Object.keys(getFromRepo(repo, pkgName, pkgVer));
        // Check that this state package is not already in pkgToInstall
        if (pkgName in pkgToInstall) return;
        // && it has a dependency that may be updated
        if (!pkgDeps.some((dep) => dep in pkgToInstall)) return;
        // For each state package, fetch the dependencies of valid versions
        // and include them to pkgToInstall
        const pkgToInstallFromState = getPkgsToInstall(
            pkgName,
            isIpfs(pkgVer) ? pkgVer : '>='+pkgVer,
            repo
        );
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
