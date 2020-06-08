import isIpfsHash from "utils/isIpfsHash";
import { stringSplit } from "utils/strings";

// Utils

export function correctPackageName(query: string) {
  if (!query || typeof query !== "string") return query;
  // First determine if it contains an ipfs hash
  const hash = stringSplit(query, "ipfs/")[1] || query;
  if (isIpfsHash(query)) return "/ipfs/" + hash;
  else return query;
}
