const getPkgsToInstall = require('./getPkgsToInstall');
const getFromRepo = require('../utils/getFromRepo');
const isIpfs = require('../utils/isIpfs');
const mergePkgs = require('../utils/mergePkgs');
const logs = require('logs.js')(module);

function getStatePkgToInstall(pkgToInstall, state, repo) {
    let pkgToInstallFromState = {};

    const statePkgNames = Object.keys(state)
    .filter((pkgName) => {
        if (!(pkgName in repo)) {
            logs.warn('State package not found in repo: '+pkgName);
        }
        // Ignore state packages that are not found in the repo
        return pkgName in repo;
    });

    // Using `continue` statements to avoid heavy if nesting
    for (const pkgName of statePkgNames) {
        try {
            const pkgVer = state[pkgName];
            const pkgDeps = Object.keys(getFromRepo(repo, pkgName, pkgVer));
            // Check that this state package is not already in pkgToInstall
            if (pkgName in pkgToInstall) continue;
            // && it has a dependency that may be updated
            if (!pkgDeps.some((dep) => dep in pkgToInstall)) continue;
            // For each state package, fetch the dependencies of valid versions
            // and include them to pkgToInstall
            pkgToInstallFromState = mergePkgs(
                pkgToInstallFromState,
                getPkgsToInstall(
                    pkgName,
                    isIpfs(pkgVer) ? pkgVer : '>='+pkgVer,
                    repo
                )
            );
        } catch (e) {
            logs.warn(`Error fetching state package ${pkgName} versions: ${e.stack || e.message}`);
        }
    }
    return pkgToInstallFromState;
}


module.exports = getStatePkgToInstall;
