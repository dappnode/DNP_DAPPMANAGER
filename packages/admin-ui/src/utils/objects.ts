import { pickBy } from "lodash-es";

/**
 * Safe version of JSON.stringify. On error returns an error string
 * @param obj
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyObjSafe<T extends { [key: string]: any }>(obj: T): string {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanObj<T extends { [key: string]: any }>(obj: T) {
  return pickBy(obj, (value) => typeof value !== "undefined");
}
