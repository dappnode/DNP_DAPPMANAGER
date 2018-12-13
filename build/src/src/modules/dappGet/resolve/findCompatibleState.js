const verifyState = require('./verifyState');
const permutations = require('./permutations');
const {filterObj} = require('../utils/objUtils');
const generateErrorMessage = require('./generateErrorMessage');

/**
 * Resolves a request given a repository of package dependencies and a state
 * It will try to find a compatible combination of versions
 *
 * If it succeeds, and there are various results it will return the one where
 * - The requested package has the highest version
 * - The already installed packages have the closest version to the current one
 * - Newly installed packages have the highest versions
 * This three conditions are prioritized as this list's order.
 *
 * If it does not find a valid combination it will return a list of packages
 * which caused incompatibilities ordered by number of a times they caused
 * an incompatibility
 */

const timeoutMs = 10 * 1000; // ms

/**
 *
 * @param {Object} dnps = {
 *  "dependency.dnp.dappnode.eth": {
 *    isNotInstalled: true,
 *    versions: {
 *      "0.1.1": {},
 *      "0.1.2": {}
 *    }
 *  },
 *  "letsencrypt-nginx.dnp.dappnode.eth": {
 *    isState: true,
 *    versions: {
 *      "0.0.4": { "web.dnp.dappnode.eth": "latest" }
 *    }
 *  },
 *};
 * @return {Object} success or error result = {
 *   success: {}
 *   error: ''
 * }
 */
function findCompatibleState(dnps) {
    const errors = {};

    const permutationsTable = permutations.getPermutationsTable(dnps);
    const totalCases = permutations.getTotalPermutations(permutationsTable);

    const startTime = Date.now();
    let hasTimedOut = false;
    let caseId;
    for (caseId=0; caseId<totalCases; caseId++) {
        // Creates a states from all the possible permutations
        // { A: '2.0.0', B: '1.0.0', C: '2.0.0' }
        const state = permutations.getPermutation(permutationsTable, caseId);
        // Check if this combination of versions is valid
        const result = verifyState(state, dnps);
        if (result.valid) {
            // If success => Filter out packages that will not be installed
            return {
                success: filterObj(state, ((ver) => ver)),
                message: `Found compatible state with case ${caseId+1}/${totalCases}`,
            };
        } else {
            // Keep track of how many incompatibilities are due to a specific reason
            const {req, dep, range} = result.reason;
            const key = `${req}#${dep}#${range}`;
            key in errors ? errors[key]++ : errors[key] = 1;
        }
        // Prevent the loop to run for too long
        if (Date.now() - startTime > timeoutMs) {
            hasTimedOut = true;
            break;
        }
    }

    return {
        success: false,
        message: generateErrorMessage({hasTimedOut, timeoutMs, caseId, totalCases, errors}),
    };
}

module.exports = findCompatibleState;
