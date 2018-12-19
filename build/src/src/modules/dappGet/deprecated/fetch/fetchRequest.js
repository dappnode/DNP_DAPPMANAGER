const getPkgDeps = require('./getPkgDeps');
const validate = require('utils/validate');

/**
 * Fetches the dependencies and subdependencies of a single package
 *
 * Modifies the repo in place, appending this package dependencies
 * and the dependencies of the dependencies recursively.
 *
 * @param {object} req packageRequest object
 * req = {
 *   name: 'admin.dnp.dappnode.eth',
 *   ver: '^0.1.7'
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
async function fetchReq(req, repo) {
    validate.packageReq(req);
    await getPkgDeps(req.name, req.ver, repo);
    return repo;
}

module.exports = fetchReq;
