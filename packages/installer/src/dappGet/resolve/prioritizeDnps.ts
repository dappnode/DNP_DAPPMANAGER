import { DappGetDnps, DappGetDnp } from "../types.js";

interface PrioritizeDnpReturn extends DappGetDnp {
  name: string;
}

/**
 * Converts the dnps object into an array
 * and orders the DNPs according to this rules (from last to first):
 * 1. Request DNP last
 * 2. Then state DNPs
 * 3. Then (first), all other packages
 *
 * This sort is extremely important. It prioritizes the first successful version
 * The sort orders the priority criterias as follows
 *  - The requested package has the highest version
 *  - The already installed packages have the closest version to the current one
 *  - Newly installed packages have the highest versions
 *
 *  If a package is at the end of the array, its first version will be tested
 *  against all possible permutations
 *
 *  Order 1          Order 2
 *  [A, B]           [B, A]
 *  {A: 1, B: 1}     {B: 1, A: 1}
 *  {A: 2, B: 1}     {B: 2, A: 1}
 *  {A: 1, B: 2}     {B: 1, A: 2}
 *  {A: 2, B: 2}     {B: 2, A: 2}
 *
 *  It is more important for A to have a specific version than B,
 *  then order 2 should be followed
 *
 * @param dnps = {
 *   A: {isRequest: true, versions: []},
 *   B: {isInstalled: true, versions: []},
 *   C: {isInstalled: true, versions: []},
 *   D: {versions: []},
 *   E: {versions: []},
 * }
 * @returns dnpsArray = [
 *   {name: 'D', versions: []},
 *   {name: 'E', versions: []},
 *   {name: 'B', isInstalled: true, versions: []},
 *   {name: 'C', isInstalled: true, versions: []},
 *   {name: 'A', isRequest: true, versions: []},
 * ]
 */
export default function prioritizeDnps(dnps: DappGetDnps): PrioritizeDnpReturn[] {
  // Convert the dnps object into an array of objects appending the name
  return (
    Object.keys(dnps)
      .map((name) => ({ ...dnps[name], name }))
      // Sort the package ordening
      .sort((dnpA, dnpB) => {
        if (dnpA.isRequest) return 1;
        else if (dnpB.isRequest) return -1;
        else if (dnpA.isInstalled && !dnpB.isInstalled) return 1;
        else if (!dnpA.isInstalled && dnpB.isInstalled) return -1;
        else return 0;
      })
  );
}
