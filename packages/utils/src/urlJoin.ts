/**
 * Joins multiple url parts safely
 * - Does not break the protocol double slash //
 * - Cleans double slashes at any point
 * - Removes any asterisks *  primarily from rootPaths
 * @param args ("http://ipfs.io", "ipfs", "Qm")
 * @returns "http://ipfs.io/ipfs/Qm"
 */
export function urlJoin(...args: string[]): string {
  return args.join("/").replace(/(?<!:)\/{2,}|\*/g, "$1");
}
