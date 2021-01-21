/**
 * Util to format keys to make them subprops at the object level
 * firstKey.secondKey wil become in the db:
 * {
 *   firstKey: {
 *     secondKey: "value"
 *   }
 * }
 *
 * Runs `stripDots()` on all keys
 */
export function joinWithDot(...keys: string[]): string {
  return keys.map(stripDots).join(".");
}

/**
 * Convert "0.2.5" to "0-2-5". `MUST` be applied to any key that
 * may contain the dot character "."
 */
function stripDots(string: string): string {
  return string.replace(/\./g, "-");
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
