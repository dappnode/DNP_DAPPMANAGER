const dockerList = require('modules/dockerList');
const semver = require('semver');
const apm = require('modules/apm');

/**
 * Get the current state from the list of containers.
 * It also checks that their versions are valid and that they are linked
 * to a valid repo
 *
 * @return {object} state object with current installed package and their versions
 * state = {
 *    'bind.dnp.dappnode.eth': '0.1.1',
 *    'ipfs.dnp.dappnode.eth': '/ipfs/Qm7s3bh2hvf...',
 *    ...
 * }
 */
async function getState() {
    let state = {};
    let dnpList = await dockerList.listContainers();
    await Promise.all(dnpList.map(async (pkg) => {
        // Only consider pkgs with a valid version
        // It should ignore:
        // - pkg.dnp.dappnode.eth:dev
        // - pkg.dnp.dappnode.eth:c5ashf61
        if (
            // Only valid semver
            semver.valid(pkg.version)
            // Only packages with a valid repo. In case of error, ignore package
            && await apm.repoExists(pkg.name).catch(() => false)
        ) {
            state[pkg.name] = pkg.origin || pkg.version;
        }
    }));
    return state;
}

module.exports = getState;
