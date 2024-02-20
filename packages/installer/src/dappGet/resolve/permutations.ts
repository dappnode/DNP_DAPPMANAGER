import prioritizeVersions from "./prioritizeVersions.js";
import prioritizeDnps from "./prioritizeDnps.js";
import {
  DappGetDnps,
  PermutationsTableInterface,
  PermutationInterface
} from "../types.js";

/**
 * Computes key parameters to construct all version permutations
 *
 * @param dnps An object with the list of DNPs to install
 * dnps = {
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
 * @returns Array of length = # of DNPs with key parameters
 * to compute their permutation. The ordering of the versions is done careful
 * to test first the states with higher priority. 'm' is the total # of permutations
 * permutationsTable = [
 *   { name: 'A', versions: [ '2.2.0', '2.1.0', '2.0.0' ], n: 3, m: 1 },
 *   { name: 'C', versions: [ '2.0.0', '1.0.0' ], n: 2, m: 3 },
 *   { name: 'D', versions: [ '1.1.0', '1.0.0' ], n: 2, m: 6 }
 * ]
 */
export function getPermutationsTable(
  dnps: DappGetDnps
): PermutationsTableInterface {
  let m = 1;
  // This sort is extremely important. It prioritizes the first successful version
  // The sort orders the priority criterias as follows
  // - The requested DNP has the highest version
  // - The already installed DNPs have the closest version to the current one
  // - Newly installed DNPs have the highest versions
  //
  // If a DNP is at the end of the array, its first version will be tested
  // against all possible permutations
  //
  // Order 1          Order 2
  // [A, B]           [B, A]
  // {A: 1, B: 1}     {B: 1, A: 1}
  // {A: 2, B: 1}     {B: 2, A: 1}
  // {A: 1, B: 2}     {B: 1, A: 2}
  // {A: 2, B: 2}     {B: 2, A: 2}
  //
  // It is more important for A to have a specific version than B,
  // then order 2 should be followed
  return prioritizeDnps(dnps).map(dnp => {
    const versions = prioritizeVersions(dnp);
    const n = versions.length;
    const _m = m;
    m = m * n;
    return { name: dnp.name, versions, n, m: _m };
  });
}

/**
 * Computes the total number of possible permutations
 *
 * @param permutationsTable = [
 *   { name: 'A', versions: [ '2.2.0', '2.1.0', '2.0.0' ], n: 3, m: 1 },
 *   { name: 'C', versions: [ '2.0.0', '1.0.0' ], n: 2, m: 3 },
 *   { name: 'D', versions: [ '1.1.0', '1.0.0' ], n: 2, m: 6 }
 * ]
 * @returns total number of possible permutations
 */
export function getTotalPermutations(
  permutationsTable: PermutationsTableInterface
): number {
  return Object.values(permutationsTable).reduce(
    (num, dnp) => num * dnp.versions.length,
    1
  );
}

/**
 * Computes the # i permutation of DNP versions of the set defined by x.
 * First permutation => i = 0
 * Last permutation ==> i = permutationsNumber - 1
 *
 * @param permutationsTable Array of length = # of DNPs with key parameters
 * to compute their permutation. The ordering of the versions is done careful
 * to test first the states with higher priority. 'm' is the total # of permutations
 * [ { name: 'A', versions: [ '2.2.0', '2.1.0', '2.0.0' ], n: 3, m: 1 },
 *   { name: 'C', versions: [ '2.0.0', '1.0.0' ], n: 2, m: 3 },
 *   { name: 'D', versions: [ '1.1.0', '1.0.0' ], n: 2, m: 6 }
 * ]
 * @param i #th permutation
 * @returns A state with a specific set of versions
 * { A: '2.2.0', C: '2.0.0', D: '1.1.0' }
 */
export function getPermutation(
  permutationsTable: PermutationsTableInterface,
  i: number
): PermutationInterface {
  const permutation: PermutationInterface = {};
  for (const dnp of permutationsTable) {
    permutation[dnp.name] = dnp.versions[Math.floor(i / dnp.m) % dnp.n];
  }
  return permutation;
}
