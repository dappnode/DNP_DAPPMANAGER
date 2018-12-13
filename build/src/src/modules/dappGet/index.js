const resolve = require('./resolve');
const aggregate = require('./aggregate');

/**
 * Aggregates all relevant packages and their info given a specific request.
 * The resulting "repo" (dnps) is run through a brute force resolver.
 * It returns success when finds the first compatible combination of versions.
 * Otherwise it will return an error formated object
 *
 * The criteria to qualify the "first" found combination is:
 * - The requested package has the highest version
 * - The already installed packages have the closest version to the current one
 * - Newly installed packages have the highest versions
 * This three conditions are prioritized as this list's order.
 *
 * @param {Object} req: The package request:
 * req = {
 *   name: 'nginx-proxy.dnp.dappnode.eth',
 *   ver: '^0.1.0',
 * }
 *
 * @return {Object} Result object = {
 *   success: {
 *     'bind.dnp.dappnode.eth': '0.1.4',
 *     'ipfs.dnp.dappnode.eth': '0.1.3',
 *     'ethchain.dnp.dappnode.eth': '0.1.4',
 *     'ethforward.dnp.dappnode.eth': '0.1.1',
 *     'vpn.dnp.dappnode.eth': '0.1.11',
 *     'wamp.dnp.dappnode.eth': '0.1.0',
 *     'admin.dnp.dappnode.eth': '0.1.6',
 *     'dappmanager.dnp.dappnode.eth': '0.1.10',
 *     'core.dnp.dappnode.eth': '/ipfs/Qmabuy2rTUEWA5jKyUKJmUDCH375e75tpUnAAwyi1PbLq1'
 *   },
 *   message: 'Found compatible state with case 1/256',
 * }
 *
 * <or in case of error>
 *
 * Result object = {
 *   success: false,
 *   message: 'Could not find a compatible state.
 *     Packages x.dnp.dappnode.eth request incompatible versions of y.dnp.dappnode.eth.
 *     Checked 256/256 possible states.'
 * }
 */
async function dappGet(req) {
    const dnps = await aggregate(req);
    return resolve(dnps);
}

module.exports = dappGet;
