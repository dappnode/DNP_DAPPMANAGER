import { DistributedFile } from "@dappnode/types";
import { normalizeHash } from "./normalizeHash.js";
import { params } from "@dappnode/params";

export const IPFS_AVATAR_ROUTE = "/avatar/ipfs/";

/**
 * Return a URL for a distributed file.
 *
 * IPFS avatars are resolved by DAppManager so the backend can use the
 * currently configured local or remote gateways instead of pinning the
 * browser to one hard-coded public gateway.
 * @param distributedFile
 * @returns A relative DAppManager URL for IPFS, or an absolute mirror URL.
 */
export function fileToGatewayUrl(distributedFile?: DistributedFile): string {
  // Fallback
  if (!distributedFile || !distributedFile.hash) return "";

  switch (distributedFile.source) {
    case "ipfs":
      return `${IPFS_AVATAR_ROUTE}${normalizeHash(distributedFile.hash)}`;
    case "mirror": {
      if (!distributedFile.filename || !distributedFile.packageHash) return "";
      const base = params.CONTENT_MIRROR_BASE_URL.replace(/\/?$/, "");
      return `${base}/${normalizeHash(distributedFile.packageHash)}/${distributedFile.filename}`;
    }
    default:
      throw Error(`Source not supported: ${distributedFile.source}`);
  }
}
