/**
 * Joins multiple url parts safely
 * - Does not break the protocol double slash //
 * - Cleans double slashes at any point
 * @param args ("http://ipfs.io", "ipfs", "Qm")
 * @returns "http://ipfs.io/ipfs/Qm"
 */
export function urlJoin(...args: string[]): string {
  return (
    args
      .join("/")
      // Remove duplicated // expect for the protocol
      .replace(/([^:]\/)\/+/g, "$1")
      // Remove duplicated // at the start of the string, "//route" => "/route"
      .replace(/^\/+/, "/")
  );
}
