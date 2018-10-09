const ipfs = require('modules/ipfs');
const logs = require('logs.js')(module);
const isIpfsHash = require('utils/isIpfsHash');
const apm = require('modules/apm');
const semver = require('semver');

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
 * @return {none} doesn't return anything, repo is modified in place
 */
async function getPkgDeps(name, verReq, repo) {
    if (!repo || typeof repo !== 'object') {
        throw Error('A valid repo must be passed as a 3rd argument');
    }
    if (!repo[name]) repo[name] = {};

    let versions;
    //  Filtered versions object according to the verReq
    //  versions = {
    //    '0.8.0': '/ipfs/QmZ1aaB41vXI...',
    //    '1.0.0': '/ipfs/QmZvasj33j2k...',
    //    ...
    //  }

    // Case 1. The version is a valid semver version or range.
    if (semver.validRange(verReq)) {
        // Only for semver: speed up the fetch by checking if there is a new version
        // If there isn't a repo for this package, apm.getRepoHash will throw:
        // "Error: Resolver could not found a match for dnpinner.dnp.dappnode.eth"
        // The error will be ignored for state packages.
        const latestHash = await apm.getRepoHash({name, ver: 'latest'});
        const updated = Object.values(repo[name]).map((v) => v.hash).includes(latestHash);
        if (updated) {
            return;
        }
        // Case 1A It is a specific version, fetch only that version
        if (semver.valid(verReq)) {
            versions = {[verReq]: await apm.getRepoHash({name, ver: verReq})};
        }
        // Case 1B. It is a semver range: apply semver logic to filter
        else {
            versions = await apm.getRepoVersions({name}, verReq);
        }
    }
    // Case 2. The version is an IPFS hash. The version is already the hash.
    if (verReq && verReq.startsWith('/ipfs/')) {
        versions = {[verReq]: verReq};
    }
    // Case 3. The version is 'latest'. Pick the latest version.
    else if (verReq === 'latest') {
        versions = await apm.getLatestWithVersion({name});
    }

    // ######
    // console.log('name', name, 'ver', verReq, 'versions', versions);

    for (let ver of Object.keys(versions)) {
        if (repo[name][ver]) {
            // Already checked, skip
        } else if (!isIpfsHash(versions[ver])) {
            // Ignore corrupted hash. At least in the bind.dnp.dappnode.eth
            // ver 0.1.2-0.1.3 the hash is incorrect.
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
                manifest.hash = hash;
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
                // ######
                    // console.log('DEP name', depName, 'depVerReq', depVerReq);
                await getPkgDeps(depName, depVerReq, repo).catch((e) => {
                    logs.error('Error fetching DEP '+depName+'@'+depVerReq+': '+e);
                });
            }
        }
    }
}


module.exports = getPkgDeps;
