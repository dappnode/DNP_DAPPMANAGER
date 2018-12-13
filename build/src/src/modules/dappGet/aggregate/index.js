const dockerList = require('modules/dockerList');
const validate = require('utils/validate');
const semver = require('semver');
const logs = require('logs.js')(module);
const aggregateDependencies = require('./aggregateDependencies');
const getRelevantInstalledDnps = require('./getRelevantInstalledDnps');

/**
 * Aggregates all relevant packages and their info given a specific request.
 * The resulting "repo" (dnps) can be run directly through a brute force resolver
 * as it only includes DNPs of interest to that specific user request
 *
 * @param {Object} req: The package request:
 * req = {
 *   name: 'nginx-proxy.dnp.dappnode.eth',
 *   ver: '^0.1.0',
 * }
 *
 * @return {Object} dnps: Local repo of packages of interest that may be installed
 * They include the name of the package, their versions and dependencies and a tag:
 *   - isRequest
 *   - isState
 *   - isNotInstalled
 * The tags are used latter to order the packages in order to
 * minimize the number of attempts to find a valid solutions
 * dnps = {
 *   'dependency.dnp.dappnode.eth': {
 *     isNotInstalled: true,
 *     versions: {
 *       '0.1.1': {},
 *       '0.1.2': {},
 *     },
 *   },
 *   'letsencrypt-nginx.dnp.dappnode.eth': {
 *     isState: true,
 *     versions: {
 *       '0.0.4': { 'web.dnp.dappnode.eth': 'latest' },
 *     },
 *   },
 *   'nginx-proxy.dnp.dappnode.eth': {
 *     isRequest: true,
 *     versions: {
 *       '0.0.3': { 'nginx-proxy.dnp.dappnode.eth': 'latest' },
 *     },
 *   },
 *   'web.dnp.dappnode.eth': {
 *     isState: true,
 *     versions: {
 *       '0.0.0': { 'letsencrypt-nginx.dnp.dappnode.eth': 'latest' },
 *     },
 *   },
 * };
 */
async function aggregate(req) {
    const dnps = {};

    // First fetch the request
    validate.packageReq(req);
    await aggregateDependencies({name: req.name, versionRange: req.ver, dnps});

    // Get the list of relevant installed dnps
    const dnpList = await dockerList.listContainers();
    const relevantInstalledDnps = getRelevantInstalledDnps({
        // requestedDnps = ["A", "B", "C"]
        requestedDnps: Object.keys(dnps),
        // Ignore invalid versions as: dnp.dnp.dappnode.eth:dev, :c5ashf61
        installedDnps: dnpList.filter((dnp) => semver.valid(dnp.version)),
    });
    // Add relevant installed dnps and their dependencies to the dnps object
    await Promise.all(relevantInstalledDnps.map(async (dnp) => {
        try {
            // Fetch exact version if doesn't came from ENS. Otherwise fetch all newer versions
            await aggregateDependencies({
                name: dnp.name,
                versionRange: dnp.origin || `>=${dnp.version}`,
                dnps,
            });
        } catch (e) {
            logs.warn(`Error fetching installed dnp ${dnp.name}: ${e.stack || e.message}`);
        }
    }));

    // Label dnps. They are used to order versions
    const stateDnpNames = relevantInstalledDnps.map((dnp) => dnp.name);
    const installedDnpNames = dnpList.map((dnp) => dnp.name);
    Object.keys(dnps).forEach((dnpName) => {
        // > Label isRequest
        if (dnpName === req.name) dnps[dnpName].isRequest = true;
        // > Label isState
        else if (stateDnpNames.includes(dnpName)) dnps[dnpName].isState = true;
        // > Label isNotInstalled
        else if (!installedDnpNames.includes(dnpName)) dnps[dnpName].isNotInstalled = true;
    });

    return dnps;
}

module.exports = aggregate;
