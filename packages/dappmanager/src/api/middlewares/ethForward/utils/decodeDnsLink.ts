import { Content } from "../types.js";
import { isEmpty } from "./isEmpty.js";
import { sanitizeIpfsPath } from "./sanitizeIpfsPath.js";

/**
 * Used in the TEXT_INTERFACE_ID = "0x59d1d43c";
 * @param contenthash
 * @returns content
 */
export function decodeDnsLink(text: string): Content {
  if (isEmpty(text)) throw TypeError(`Empty text dnsLink`);

  return {
    location: "ipfs",
    // Note: `text` may be prefixed by "/ipfs/"
    hash: sanitizeIpfsPath(text)
  };
}
