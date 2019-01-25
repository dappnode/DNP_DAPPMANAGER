const verifyState = require('./verifyState');
const permutations = require('./permutations');
const {filterObj} = require('../utils/objUtils');
const generateErrorMessage = require('./generateErrorMessage');
const logs = require('logs.js')(module);

/**
 * Resolves a combination of DNPs.
 * It returns success when finds the first compatible combination of versions.
 * Otherwise it will return an error formated object
 *
 * The criteria to qualify the "first" found combination is:
 * - The requested package has the highest version
 * - The already installed packages have the closest version to the current one
 * - Newly installed packages have the highest versions
 * This three conditions are prioritized as this list's order.
 */

const timeoutMs = 10 * 1000; // ms

/**
 * Resolves a combination of DNPs.
 *
 * @param {Object} dnps = {
 *  "dependency.dnp.dappnode.eth": {
 *    versions: {
 *      "0.1.1": {},
 *      "0.1.2": {}
 *    }
 *  },
 *  "letsencrypt-nginx.dnp.dappnode.eth": {
 *    isInstalled: true,
 *    versions: {
 *      "0.0.4": { "web.dnp.dappnode.eth": "latest" }
 *    }
 *  },
 *};
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
        logs.debug(`CASE-ID ${caseId}: ${JSON.stringify(state)}`);
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
