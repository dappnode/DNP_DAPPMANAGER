const getManifest = require('modules/getManifest2');

/**
 * Fetches the dependencies of a given DNP name and version
 *
 * @param {Object} kwargs: {
 *   name: Name of package i.e. "kovan.dnp.dappnode.eth"
 *   version: version requested i.e. "0.1.0" or "/ipfs/Qmre4..."
 * }
 * @return {Object} dependencies:
 *   { dnp-name-1: "semverRange", dnp-name-2: "/ipfs/Qmf53..."}
 */
async function fetchDependencies({name, version}) {
    const manifest = await getManifest({name, version});

    // WARNING: a manifest is an external uncontrolled input, verify
    const dependencies = manifest.dependencies || {};
    Object.keys(dependencies).forEach((name) => {
        const ver = dependencies[name];
        if (!ver || ver.toLowerCase().includes('latest')) dependencies[name] = '*';
    });

    return dependencies;
}

module.exports = fetchDependencies;
