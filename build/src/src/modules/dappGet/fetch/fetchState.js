
const getPkgDeps = require('./getPkgDeps');
const isIpfs = require('../utils/isIpfs');

/**
 * Fetches the dependencies and subdependencies of all packages
 * currently installed in a DAppnode.
 * Modifies the repo in place, appending this package dependencies
 * and the dependencies of the dependencies recursively.
 *
 * @param {object} state Object with current installed package and their versions
 * state = {
 *    'bind.dnp.dappnode.eth': '0.1.1',
 *    'ipfs.dnp.dappnode.eth': '0.1.3',
 *    ...
 * }
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
async function fetchState(state, repo) {
    const checked = {};
    await Promise.all(Object.keys(state).map((name) =>
        getPkgDeps(
            name,
            isIpfs(state[name]) ? state[name] : '>='+state[name],
            repo,
            checked)
    ));
}

module.exports = fetchState;
