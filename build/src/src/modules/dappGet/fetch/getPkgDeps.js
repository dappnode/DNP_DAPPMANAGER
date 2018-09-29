const ipfs = require('../../../modules/ipfs');
const getVersions = require('./getVersions');
const logs = require('../../../logs')(module);

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

    for (let ver of Object.keys(versions)) {
        if (repo[name][ver]) {
            // Already checked, skip
        } else {
            // Get the dependencies of a specific package and version.
            // Will pass the manifest hash to getManifest instead of the version
            // to avoid calling apm again. allVersions[ver] = /ipfs/QmZ4ops2...
            // ##### EXTERNAL INPUT: manifest
            // ##### WARNING, this swallows errors
            const hash = versions[ver];
            let manifest;
            try {
                manifest = JSON.parse( await ipfs.cat(hash) );
            } catch (e) {
                logs.debug('Error downloading manifest '+name+' '+versions[ver]+': '+e.stack);
            }
            const deps = (manifest || {}).dependencies || {};
            repo[name][ver] = manifest;

            // ######
            // console.log('name', name, 'ver', ver, 'deps', deps);

            for (const depName of Object.keys(deps)) {
                let depVerReq = deps[depName];
                // ###### EXTERNAL INUT, deps
                if (depVerReq === 'latest') {
                    repo[name][ver].dependencies[depName] = '*';
                    depVerReq = '*';
                }
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
