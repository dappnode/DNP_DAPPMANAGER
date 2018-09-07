const apm = require('modules/apm');
const semver = require('semver');

/**
 * Modifies the repo in place, appending this package dependencies
 * and the dependencies of the dependencies recursively.
 *
 * @param {string} name requested package name / ID
 * @param {string} verReq version requested, can be a semver range.
 * @return {object} Filtered versions object according to the verReq
 * {
 *   '1.0.0': '/ipfs/QmZvasj33j2k...',
 *   '1.0.1': '/ipfs/QmW6xca3n3Jb...',
 *   ...
 * }
 */
async function getVersions(name, verReq) {
    // Case 1. The version is a valid semver version. Fetch only that version
    if (semver.valid(verReq)) {
        const hash = await apm.getRepoHash({name, ver: verReq});
        return {
            [verReq]: hash,
        };
    }

    // Case 2. The version is a semver range: apply semver logic to filter
    if (semver.validRange(verReq)) {
        const versions = await apm.getRepoVersions({name});
        // Return versions that satisfy the version requested (verReq)
        const validVersions = {};
        Object.keys(versions)
        .filter((ver) => semver.satisfies(ver, verReq))
        .forEach((ver) => {
            validVersions[ver] = versions[ver];
        });
        return validVersions;
    }

    // Case 3. The version is an IPFS hash. The version is already the hash.
    else if (verReq.startsWith('/ipfs/')) {
        return {
            [verReq]: verReq,
        };
    }

    // Case 4. The version is 'latest'. Pick the latest version.
    else if (verReq === 'latest') {
        const versions = await apm.getLatestWithVersion({name});
        return versions;
    }

    // Unknown version, throw an error. This is a fetching stage of the
    // installation process. If versions are not fetched correctly it can
    // generate problems in the resolver part of the module
    else {
        // Unknown version type
        throw Error('Uknown version request for '+name+': '+verReq);
    }
}

module.exports = getVersions;
