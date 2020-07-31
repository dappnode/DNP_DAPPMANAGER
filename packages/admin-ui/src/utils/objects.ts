import { pickBy } from "lodash";

/**
 * Safe version of JSON.stringify. On error returns an error string
 * @param obj
 */
export function stringifyObjSafe<T extends { [key: string]: any }>(
  obj: T
): string {
  if (!obj) return "";
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return `Error stringifying: ${e.message}`;
  }
}

/**
 * Immutable clean of empty values
 * @param obj
 * @returns
 */
export function cleanObj<T extends { [key: string]: any }>(obj: T) {
  return pickBy(obj, value => typeof value !== "undefined");
}
