import { difference } from "lodash";

/**
 * Checks if `a2` includes all elements of `a1`
 * @param {array} a1
 * @param {array} a2
 */
export function includesArray<T>(subset: T[], superset: T[]): boolean {
  return difference(subset, superset).length === 0;
}
