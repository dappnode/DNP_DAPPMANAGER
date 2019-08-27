/**
 * Capitalizes a string
 * @param {string} string = "hello world"
 * @returns {string} "Hello world"
 */
export function capitalize(s: string) {
  if (!s || typeof s !== "string") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shortName(ens: string) {
  if (!ens || typeof ens !== "string") return ens;
  if (!ens.includes(".")) return ens;
  return ens.split(".")[0];
}

export function shortNameCapitalized(name: string) {
  if (!name || typeof name !== "string") return name;
  const _name = shortName(name);
  return _name.charAt(0).toUpperCase() + _name.slice(1);
}

/**
 * Checks if string 1 includes string 2.
 * - If string 1 or string 2 are undefined, returns false
 * - Does the check in lowerCase
 * @param {string} s1 = "HeLLo"
 * @param {string} s2 = "lo"
 * @returns {bool} = true
 */
export function stringIncludes(s1: string, s2: string) {
  if (!s1 || typeof s1 !== "string") return false;
  if (!s2 || typeof s2 !== "string") return false;
  return s1.toLowerCase().includes(s2.toLowerCase());
}

/**
 * Strips any number of trailing slashs "/"
 * @param {string} s
 */
export function stripTrailingSlash(s: string) {
  if (!s || typeof s !== "string") return s;
  return s.replace(/^(.+?)\/*?$/, "$1");
}
