/**
 * Util to format keys to make them subprops at the object level
 * firstKey.secondKey wil become in the db:
 * {
 *   firstKey: {
 *     secondKey: "value"
 *   }
 * }
 */
export function joinWithDot(key1: string, key2: string): string {
  return [key1, key2].join(".");
}

/**
 * Convert "0.2.5" to "0-2-5". `MUST` be applied to any key that
 * may contain the dot character "."
 */
export function stripDots(string: string): string {
  return string.split(".").join("-");
}

/**
 * Format keys to make sure they are consistent
 */
export function formatKey(key: string): string {
  // Check if key exist before calling String.prototype
  if (!key) return key;
  if (key.includes("ipfs/")) return key.split("ipfs/")[1];
  return key;
}
