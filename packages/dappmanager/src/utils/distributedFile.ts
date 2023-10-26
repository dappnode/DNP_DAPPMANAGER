import { DistributedFile } from "@dappnode/common";

/**
 * Stringifies a distributed file type into a single multiaddress string
 * @param distributedFile
 * @returns multiaddress "/ipfs/Qm"
 */
export function fileToMultiaddress(distributedFile?: DistributedFile): string {
  if (!distributedFile || !distributedFile.hash) return "";

  if (distributedFile.source === "ipfs")
    return `/ipfs/${normalizeHash(distributedFile.hash)}`;
  else return "";
}

/**
 * Normalizes a hash removing it's prefixes
 * - Remove any number of trailing slashes
 * - Split by non alphanumeric character and return the last string
 * "/ipfs/Qm" => "Qm"
 * "ipfs"
 * @param hash "/ipfs/Qm" | "ipfs:Qm" | "Qm"
 * @returns "Qm"
 */
function normalizeHash(hash: string): string {
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
