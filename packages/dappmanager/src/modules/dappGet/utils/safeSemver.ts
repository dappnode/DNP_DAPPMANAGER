import { valid, validRange, satisfies, compare, rcompare } from "semver";
import { isIpfsHash } from "../../../utils/validate.js";

/**
 * semver comparision functions semver.compare and semver.rcompare
 * will throw and error if passed invalid versions. This is very dangerous
 * behaviour so this wrap will deal with invalid versions.
 * INPUT:
 *   ['0.1.0', '/ipfs/QmHc33SZmas', 'fake', '0.2.0']
 * OUTPUT:
 *   ['/ipfs/QmHc33SZmas', '0.1.0', '0.2.0', 'fake'], or
 *   ['/ipfs/QmHc33SZmas', '0.2.0', '0.1.0', 'fake']
 * @param sortFunction can be semver.rcompare for example
 * @returns wrapped sort function
 */
function safeSort(
  sortFunction: (a: string, b: string) => number
): (a: string, b: string) => number {
  return (v1: string, v2: string): number => {
    // 1. Put IPFS versions the first
    if (isIpfsHash(v1)) return -1;
    if (isIpfsHash(v2)) return 1;
    // 2. Put invalid versions the latest
    if (!valid(v1)) return 1;
    if (!valid(v2)) return -1;
    // Return 0 if v1 == v2, or 1 if v1 is greater, or -1 if v2 is greater.
    return sortFunction(v1, v2);
  };
}

export const safeSemver = {
  rcompare: safeSort(rcompare),
  compare: safeSort(compare),
  satisfies(ver: string, range: string): boolean {
    // satisfies(ver, range)
    // 1. an IPFS ver satisfies any range
    // 2. an IPFS range only allows that exact ver
    if (isIpfsHash(ver)) return true;
    if (isIpfsHash(range)) return ver === range;
    if (!valid(ver)) return false;
    if (!validRange(range)) return false;
    return satisfies(ver, range);
  }
};
