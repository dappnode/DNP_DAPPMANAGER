const dockerList = require('modules/dockerList');
const validate = require('utils/validate');
const semver = require('semver');
const safeSemver = require('../utils/safeSemver');
const logs = require('logs.js')(module);
const _aggregateDependencies = require('./aggregateDependencies');
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
 *   - isInstalled
 * The tags are used latter to order the packages in order to
 * minimize the number of attempts to find a valid solutions
 * dnps = {
 *   'dependency.dnp.dappnode.eth': {
 *     versions: {
 *       '0.1.1': {},
 *       '0.1.2': {},
 *     },
 *   },
 *   'letsencrypt-nginx.dnp.dappnode.eth': {
 *     isInstalled: true,
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
 *     isInstalled: true,
 *     versions: {
 *       '0.0.0': { 'letsencrypt-nginx.dnp.dappnode.eth': 'latest' },
 *     },
 *   },
 * };
 */
async function aggregate({req, dnpList, fetch}) {
    // Minimal dependency injection (fetch). Proxyquire does not support subdependencies
    const aggregateDependencies = (kwargs) => _aggregateDependencies({...kwargs, fetch});
    const dnps = {};

    // WARNING: req is a user external input, must verify
    validate.packageReq(req);
    if (!req.ver || req.ver.toLowerCase().includes('latest')) req.ver = '*';

    await aggregateDependencies({name: req.name, versionRange: req.ver, dnps});

    // Get the list of relevant installed dnps
    if (!dnpList) dnpList = await dockerList.listContainers();
    const relevantInstalledDnps = getRelevantInstalledDnps({
        // requestedDnps = ["A", "B", "C"]
        requestedDnps: Object.keys(dnps),
        // Ignore invalid versions as: dnp.dnp.dappnode.eth:dev, :c5ashf61
        // Ignore 'core.dnp.dappnode.eth': it's dependencies are not real and its compatibility doesn't need to be guaranteed
        installedDnps: dnpList.filter((dnp) => semver.valid(dnp.version) && dnp.name !== 'core.dnp.dappnode.eth'),
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
    Object.keys(dnps).forEach((dnpName) => {
        const dnp = dnpList.find((dnp) => dnp.name === dnpName);

        // > Label isRequest + Enfore conditions:
        //   - requested DNP versions must match the provided versionRange
        if (dnpName === req.name) {
            dnps[dnpName].isRequest = true;
            Object.keys(dnps[dnpName].versions).forEach((version) => {
                if (!safeSemver.satisfies(version, req.ver)) {
                    delete dnps[dnpName].versions[version];
                }
            });
        }
        // > Label isInstalled + Enfore conditions:
        //   - installed DNPs cannot be downgraded (don't apply this condition to the request)
        else if (dnp) {
            dnps[dnpName].isInstalled = true;
            Object.keys(dnps[dnpName].versions).forEach((version) => {
                if (
                    // Exclusively apply this condition to semver versions.
                    semver.valid(version) &&
                    semver.valid(dnp.version) &&
                    // If the new version = "version" is strictly less than the current version "dnp.version", ignore
                    semver.lt(version, dnp.version)
                ) {
                    delete dnps[dnpName].versions[version];
                }
            });
        }
    });

    // Validate aggregated dnps
    // - dnps must contain at least one version of the requested package
    if (!Object.keys((dnps[req.name] || {}).versions || {}).length) {
        throw Error(`Aggregated dnps must contain at least one version of the requested DNP ${req.name} @ ${req.ver}`);
    }

    return dnps;
}

module.exports = aggregate;
