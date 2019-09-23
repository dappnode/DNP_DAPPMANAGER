import { promisify } from "util";
const dns = require("dns");
const lookupAsync = promisify(dns.lookup);

/**
 * Does a dns.lookup to resolve a hostname
 * Usage:
 *   `await lookup("ipfs.io")` > "209.94.90.1"
 *
 * @param {string} hostname = "ipfs.io"
 * @param {object} options, available options:
 * - ignoreErrors: {bool}. If true, on error doesn't log anything
 *   and returns null
 * @returns {string} address = "209.94.90.1"
 *
 *  Error: getaddrinfo EAI_AGAIN
 */
export default async function lookup(
  hostname: string,
  ignoreErrors?: boolean
): Promise<string | null> {
  try {
    const { address } = await lookupAsync(hostname);
    return address;
  } catch (e) {
    if (ignoreErrors) return null;
    else throw e;
  }
}
