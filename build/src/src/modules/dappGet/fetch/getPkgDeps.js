const getManifest = require('modules/getManifest');
const getVersions = require('./getVersions');
const logs = require('logs.js')(module);

/**
 * Modifies the repo in place, appending this package dependencies
 * and the dependencies of the dependencies recursively.
 *
 * @param {string} name requested package name / ID
 * @param {string} verReq version requested, can be a semver range.
 * @param {object} repo Repo with a package version dependencies
 * repo = {
 *   "A": {
 *       "1.0.0": {"C": "^1.0.0"},
 *       "2.0.0": {"C": "^2.0.0", "D": "^1.0.0"},
 *       "2.1.0": {"C": "^2.0.0", "D": "^1.1.0"},
 *   },
 *   "B": ...
 *    ...
 * @param {object} checked Used to track with ranges have been checked
 *                         Helps speed up the search.
 * { A@^1.0.0: true,
 *   C@~2.3.1: true }
 * @return {none} doesn't return anything, repo is modified in place
 */
async function getPkgDeps(name, verReq, repo, checked = {}) {
    if (!repo || typeof repo !== 'object') {
        throw Error('A valid repo must be passed as a 3rd argument');
    }
    if (!repo[name]) repo[name] = {};

    let versions = await getVersions(name, verReq);
    //  versionsObj = {
    //    '0.8.0': '/ipfs/QmZ1aaB41vXI...',
    //    '1.0.0': '/ipfs/QmZvasj33j2k...',
    //    ...
    //  }

    // ######
    // console.log('name', name, 'ver', verReq, 'versions', versions);

    for (const ver of Object.keys(versions)) {
        if (repo[name][ver]) {
            // Already checked, skip
        } else {
            // Get the dependencies of a specific package and version.
            // Will pass the manifest hash to getManifest instead of the version
            // to avoid calling apm again. allVersions[ver] = /ipfs/QmZ4ops2...
            const manifest = await getManifest({name, ver: versions[ver]})
            // ##### WARNING, this swallows errors,
            .catch((e) => null);
            const deps = (manifest || {}).dependencies || {};
            repo[name][ver] = deps;

            // ######
            // console.log('name', name, 'ver', ver, 'deps', deps);

            for (const depName of Object.keys(deps)) {
                const depVerReq = deps[depName];
                if (checked[depName+'@'+depVerReq]) {
                    // Skipping requirement
                } else {
                    // Recursive call, fetch a specific dependency
                    checked[depName+'@'+depVerReq] = true;

                    // ######
                    // console.log('DEP name', depName, 'depVerReq', depVerReq);

                    await getPkgDeps(depName, depVerReq, repo, checked).catch((e) => {
                        logs.error('Error fetching DEP '+depName+'@'+depVerReq+': '+e);
                    });
                }
            }
        }
    }
}


module.exports = getPkgDeps;
