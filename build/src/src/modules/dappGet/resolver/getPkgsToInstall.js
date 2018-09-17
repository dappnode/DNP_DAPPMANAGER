const {mapObj} = require('../utils/objUtils');
const safeSemver = require('../utils/safeSemver');
const getFromRepo = require('../utils/getFromRepo');
const isIpfs = require('../utils/isIpfs');

/**
 * Fetches a package's dependencies recursively
 *
 * @param {string} name requested package ID
 * @param {string} verReq requested package version (only support semver)
 * @param {object} repo the repo with all package dependencies
 * repo = {
    "A": {
        "1.0.0": {"C": "^1.0.0"},
        "2.0.0": {"C": "^2.0.0", "D": "^1.0.0"},
        "2.1.0": {"C": "^2.0.0", "D": "^1.1.0"},
        "2.2.0": {"C": "^1.0.0", "D": "^1.0.0"}
    },
    ...
 * @param {object} obj [never pass this argument] allows recursiveness
 * @return {obj} All packages to install and their depedencies
 * { A:
 *    { '2.0.0': { C: '^2.0.0', D: '^1.0.0' },
 *      '2.1.0': { C: '^2.0.0', D: '^1.1.0' },
 *      '2.2.0': { C: '^1.0.0', D: '^1.0.0' } },
 *   C: { '2.0.0': {}, '1.0.0': {} },
 *   D: { '1.0.0': { C: '^1.0.0' }, '1.1.0': { C: '^2.0.0' } }
 * }
 */
function getPkgsToInstall(name, verReq, repo, obj = {}) {
    if (!repo || typeof repo !== 'object') {
        throw Error('A valid repo must be passed as a 3rd argument');
    }
    if (!repo[name]) {
        throw Error(name+' cannot be found in the repo');
    }
    if (!obj[name]) obj[name] = {};
    // Check valid versions
    // Ignore versions that are out of range
    // repo[name] = {
    //   "0.1.4": {},
    //   "/ipfs/Qmabr9X4JeuUFEmSngFunBCTmKeSMtuKfnjckWkQY7EPRs": {},
    //   ...
    // }

    // It is important to just pick ipfs version if they are requested
    const vers = isIpfs(verReq) ?
        Object.keys(repo[name]).filter((ver) => ver === verReq)
        : Object.keys(repo[name])
        .filter((ver) => !isIpfs(ver))
        .filter((ver) => safeSemver.satisfies(ver, verReq));
    // ##### Not sure if this check is necessary in production
    if (!vers.length) {
        throw Error('No valid versions found for '+name+' @ '+verReq+
            ', in: '+JSON.stringify(repo[name], null, 2));
    }
    vers.forEach((ver) => {
        if (
            // Prevent dependency loops
            !obj[name][ver]
        ) {
            // #### External input
            let deps = getFromRepo(repo, name, ver);
            obj[name][ver] = deps;
            Object.keys(deps).forEach((dep) => {
                getPkgsToInstall(dep, deps[dep], repo, obj);
            });
        }
    });
    // Remove the dependencies information of each version (not needed)
    // C: { '2.0.0': {}, '1.0.0': {} }  =>  C: ['2.0.0', '1.0.0']
    return mapObj(obj, (pkg) => Object.keys(pkg));
}

module.exports = getPkgsToInstall;
