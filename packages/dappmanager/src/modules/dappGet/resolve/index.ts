import verifyState from "./verifyState";
import {
  getPermutationsTable,
  getTotalPermutations,
  getPermutation
} from "./permutations";
import { pickBy, mapValues } from "lodash-es";
import generateErrorMessage from "./generateErrorMessage";
import { DappGetDnps, DappGetErrors } from "../types";
import { logs } from "../../../logs";

const timeoutMs = 10 * 1000; // ms

/**
 * Resolves a combination of DNPs.
 * It returns success when finds the first compatible combination of versions.
 * Otherwise it will return an error formated object
 *
 * The criteria to qualify the "first" found combination is:
 * - The requested package has the highest version
 * - The already installed packages have the closest version to the current one
 * - Not installed packages have the highest versions
 * This three conditions are prioritized as this list's order.
 *
 * @param dnps = {
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
 * @returns Result object = {
 *   success: true,
 *   message: 'Found compatible state at case 1/256',
 *   state: {
 *     'bind.dnp.dappnode.eth': '0.1.4',
 *     'ipfs.dnp.dappnode.eth': '0.1.3',
 *     'ethforward.dnp.dappnode.eth': '0.1.1',
 *     'vpn.dnp.dappnode.eth': '0.1.11',
 *     'wamp.dnp.dappnode.eth': '0.1.0',
 *     'admin.dnp.dappnode.eth': '0.1.6',
 *     'dappmanager.dnp.dappnode.eth': '0.1.10',
 *     'core.dnp.dappnode.eth': '/ipfs/Qmabuy2rTUEWA5jKyUKJmUDCH375e75tpUnAAwyi1PbLq1'
 *   },
 * }
 *
 * <or in case of error>
 *
 * Result object = {
 *   success: false,
 *   message: 'Packages x.dnp.dappnode.eth request incompatible
 *     versions of y.dnp.dappnode.eth. Checked 256/256 possible states.'
 * }
 */
export default function resolver(dnps: DappGetDnps): {
  success: boolean;
  message: string;
  state: { [dnpName: string]: string };
} {
  const errors: DappGetErrors = {};

  const permutationsTable = getPermutationsTable(dnps);
  const totalCases = getTotalPermutations(permutationsTable);
  logs.debug(`dappGet found ${totalCases} possible cases`);
  logs.debug(permutationsTable, dnps);

  if (!totalCases) throw Error("Aggregation error, total cases must be > 0");

  // Keep track of start time to abort if the loop runs for too long
  const startTime = Date.now();
  let hasTimedOut = false;
  let caseId;
  for (caseId = 0; caseId < totalCases; caseId++) {
    // Creates a states from all the possible permutations
    // { A: '2.0.0', B: '1.0.0', C: '2.0.0' }
    const state = getPermutation(permutationsTable, caseId);
    // Check if this combination of versions is valid
    const result = verifyState(state, dnps);
    if (result.valid) {
      logs.debug(`case ${caseId} valid`, state);
      return {
        success: true,
        message: `Found compatible state at case ${caseId + 1}/${totalCases}`,
        // If success => Filter out packages that will not be installed
        state: mapValues(pickBy(state, Boolean), String)
      };
    } else if (result.reason) {
      // Keep track of how many incompatibilities are due to a specific reason
      const { req, dep, range } = result.reason;
      const key = `${req}#${dep}#${range}`;
      key in errors ? errors[key]++ : (errors[key] = 1);
    }
    // Prevent the loop to run for too long
    if (Date.now() - startTime > timeoutMs) {
      hasTimedOut = true;
      break;
    }
  }

  /**
   * This point will be reached if no compatible state was found.
   * Then, throw and Error with a message with this format:
   *  `Packages x.dnp.dappnode.eth request incompatible versions of y.dnp.dappnode.eth.
   *   Checked 256/256 possible states.`
   * }
   */
  const errorMessage = generateErrorMessage({
    hasTimedOut,
    timeoutMs,
    caseId,
    totalCases,
    errors
  });
  return {
    success: false,
    message: errorMessage,
    state: {}
  };
}
