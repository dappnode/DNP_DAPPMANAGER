const getDirectory = require('../../../modules/getDirectory');
const getPkgDeps = require('./getPkgDeps');

/**
 * Fetches the dependencies and subdependencies of the packages
 * in the DAppNode's directory.
 * Modifies the repo in place, appending this package dependencies
 * and the dependencies of the dependencies recursively.
 *
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
async function fetchDirectory(repo) {
    const directoryPackages = await getDirectory();
    //   directoryPackages = [
    //     { name: 'rinkeby.dnp.dappnode.eth', status: 'Preparing' },
    //     { name: 'monero.dnp.dappnode.eth', status: 'Preparing' },
    //     ...
    //   ]

    // Declare checked outside to avoid double checks and speed up this call
    const checked = {};
    await Promise.all(directoryPackages.map((pkg) =>
        getPkgDeps(pkg.name, '*', repo, checked)
    ));
}

module.exports = fetchDirectory;


