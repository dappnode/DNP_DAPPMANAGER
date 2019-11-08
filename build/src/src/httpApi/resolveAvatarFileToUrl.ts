import { DistributedFile } from "../types";
import params from "../params";

/**
 * Store an avatar as static asset on an internally reachable API
 * @param avatarFile
 * @return link to fetch avatar "http://some-server/Qm7763518d4"
 */
export default function resolveAvatarFileToUrl(
  avatarFile?: DistributedFile
): string {
  // Fallback
  if (!avatarFile) return "";

  const hash = normalizeHash(avatarFile.hash);
  return `${params.ipfsGateway}${hash}`;
}

/**
 * Normalizes a hash removing it's prefixes
 * - Remove any number of trailing slashes
 * - Split by non alphanumeric character and return the last string
 * "/ipfs/Qm" => "Qm"
 * "ipfs"
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
