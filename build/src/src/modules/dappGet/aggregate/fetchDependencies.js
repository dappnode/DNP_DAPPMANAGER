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
    return manifest.dependencies || {};
}

module.exports = fetchDependencies;
