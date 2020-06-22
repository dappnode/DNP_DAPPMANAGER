import { Content } from "../types";
import { isEmpty } from "./isEmpty";

/**
 * Used in the CONTENT_INTERFACE_ID = "0xd8389dc5";
 * @param contenthash
 * @returns content
 */
export function decodeContent(contentEncoded: string): Content {
  if (isEmpty(contentEncoded)) throw TypeError(`Empty content hash`);

  // It is assumed that all the pages that use content instead of contenthash are from swarm
  return {
    location: "swarm",
    hash: contentEncoded.substring(2)
  };
}
