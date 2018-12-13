const setRepo = require('../utils/setRepo');
const getRepo = require('../utils/getRepo');
const getPkgsToInstall = require('../resolver/getPkgsToInstall');
const getRelevantInstalledPackages = require('./getRelevantInstalledPackages');
const dockerList = require('modules/dockerList');
const getPkgDeps = require('./getPkgDeps');
const validate = require('utils/validate');
const semver = require('semver');
const logs = require('logs.js')(module);
const isIpfs = require('../utils/isIpfs');
// const apm = require('modules/apm');

async function fetch(req) {
    const repo = await getRepo();

    // First fetch the request
    validate.packageReq(req);
    await getPkgDeps(req.name, req.ver, repo);

    // Then fetch the state packages of interest
    const requestedPackages = Object.keys(getPkgsToInstall(req.name, req.ver, repo));
    // requestedPackages = ["A", "B", "C"]
    const dnpList = await dockerList.listContainers();
    const installedPackages = dnpList
        // Only consider valid versions, ignore:
        // - pkg.dnp.dappnode.eth:dev
        // - pkg.dnp.dappnode.eth:c5ashf61
        .filter((pkg) => semver.valid(pkg.version));

    const relevantInstalledPackages = getRelevantInstalledPackages(
        requestedPackages,
        installedPackages
    );

    await Promise.all(relevantInstalledPackages.map(async (pkg) => {
        try {
            if (isIpfs(pkg.origin)) {
                // If the package came from IPFS, fetch that version
                await getPkgDeps(pkg.name, pkg.origin, repo);
            } else {
                // Otherwise asume it came from ENS
                // First check if the repo exists
                // await apm.repoExists(pkg.name).catch(() => false);
                await getPkgDeps(pkg.name, '>='+pkg.version, repo);
            }
        } catch (e) {
            logs.warn(`Error fetching state package ${pkg.name}: ${e.stack || e.message}`);
        }
    }));

    await setRepo(repo);
}

module.exports = fetch;
