const {hasVersion, setVersion} = require('../utils/dnpUtils');
const sanitizeVersions = require('./sanitizeVersions');
const sanitizeDependencies = require('./sanitizeDependencies');
const logs = require('logs.js')(module);

/**
 * The goal of this function is to recursively aggregate all dependencies
 * of a given request. The structure of the data is:
 * dnps = {
 *   dnp-name-1: {
 *     version-1: { dependency-name-1: semverRange, dependency-name-2: ipfsHash },
 *     version-2: ...,
 *     ...
 *   },
 *   dnp-name-2: ...,
 *   ...
 * }
 *
 * IPFS versions will be treated generically as non-semver.
 * Non-semver versions
 */

async function aggregateDependencies({
    name,
    versionRange,
    dnps,
    recursiveCount,
    fetch,
}) {
    // Control infinite loops
    if (!recursiveCount) recursiveCount = 1;
    else if (recursiveCount++ > 1000) return;

    // Check injected dependency
    if (!fetch) throw Error('injected dependency "fetch" is not defined');

    // 1. Fetch versions of "name" that match this request
    //    versions = [ "0.1.0", "/ipfs/QmFe3..."]
    const versions = await fetch.versions({name, versionRange})
    .then(sanitizeVersions);
    await Promise.all(versions.map(async (version) => {
        // Already checked, skip. Otherwise lock request to prevent duplicate fetches
        if (hasVersion(dnps, name, version)) return;
        else setVersion(dnps, name, version, {});
        // 2. Get dependencies of this specific version
        //    dependencies = { dnp-name-1: "semverRange", dnp-name-2: "/ipfs/Qmf53..."}
        const dependencies = await fetch.dependencies({name, version})
        .then(sanitizeDependencies)
        .catch((e) => {
            logs.warn(`Error fetching ${name}@${version} dependencies (assuming it has none). Error stack: ${e.stack}`);
            return {};
        });
        // 3. Store dependencies
        setVersion(dnps, name, version, dependencies);
        // 4. Fetch sub-dependencies recursively
        await Promise.all(Object.keys(dependencies).map(async (dependencyName) => {
            await aggregateDependencies({
                name: dependencyName,
                versionRange: dependencies[dependencyName],
                dnps,
                recursiveCount,
                fetch,
            });
        }));
    }));
}

module.exports = aggregateDependencies;
