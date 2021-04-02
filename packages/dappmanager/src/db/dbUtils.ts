/**
 * Convert "0.2.5" to "0-2-5". `MUST` be applied to any key that
 * may contain the dot character "."
 *
 * @deprecated The previous db `"low-db"` required dots to be stripped
 * so lodash didn't understood the key as a JSON path
 */
export function stripDots(string: string): string {
  return string.replace(/\./g, "-");
}
