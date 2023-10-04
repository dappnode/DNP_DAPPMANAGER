/**
 * Normalizes a hash removing it's prefixes
 * - Remove any number of trailing slashes
 * - Split by non alphanumeric character and return the last string
 * "/ipfs/Qm" => "Qm"
 * "ipfs"
 * @param hash "/ipfs/Qm" | "ipfs:Qm" | "Qm"
 * @returns "Qm"
 */
export function normalizeHash(hash: string): string {
  return (
    hash
      // remove any number of trailing slashes
      .replace(/\/+$/, "")
      .trim()
      //
      .split(/[^a-zA-Z\d]/)
      .slice(-1)[0]
  );
}
