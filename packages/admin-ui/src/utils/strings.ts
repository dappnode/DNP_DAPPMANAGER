/**
 * Safe version of String.toLowerCase
 * @param s
 * @returns
 */
export const toLowercase = (s: string): string => {
  if (!s || typeof s !== "string") return "";
  return s.toLowerCase();
};

/**
 * Capitalizes a string
 * @param string = "hello world"
 * @returns "Hello world"
 */
export const capitalize = (s: string): string => {
  if (!s || typeof s !== "string") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Checks if string includes content.
 * - If string or content are undefined, returns false
 * - Does the check in lowerCase
 * @param s = "HeLLo"
 * @param content = "lo"
 * @returns = true
 */
export const stringIncludes = (s: string, content: string): boolean => {
  if (!s || typeof s !== "string") return false;
  if (!content || typeof content !== "string") return false;
  return s.toLowerCase().includes(content.toLowerCase());
};

/**
 * Checks if string endsWith content.
 * - If string or content are undefined, returns false
 * - Does the check in lowerCase
 * @param s = "HeLLo"
 * @param content = "lo"
 * @returns = true
 */
export const stringEndsWith = (s: string, content: string): boolean => {
  if (!s || typeof s !== "string") return false;
  if (!content || typeof content !== "string") return false;
  return s.toLowerCase().endsWith(content.toLowerCase());
};

/**
 * Split string by separator.
 * - If string or separator are undefined, returns an empty array
 * @param s = "vpn.eth"
 * @param separator = ".", /\.(.+)/
 * @returns ["vpn", "eth"]
 */
export const stringSplit = (s: string, separator: string | RegExp): string[] => {
  if (!s || typeof s !== "string") return [""];
  if (!separator) return [""];
  return s.split(separator);
};
