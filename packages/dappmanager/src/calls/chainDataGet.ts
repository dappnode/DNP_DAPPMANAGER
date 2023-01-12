import memoize from "memoizee";
import { getChainsData } from "../modules/chains";
import { ChainData } from "@dappnode/common";

// Memoize this call since multiple UIs could be requesting it at once
// and the info doesn't change often and might be expensive to fetch
export const getChainsDataMemo = memoize(getChainsData, {
  // Wait for Promises to resolve. Do not cache rejections
  promise: true,
  // Cache result for 5 seconds
  maxAge: 5 * 1000
});

export async function chainDataGet(): Promise<ChainData[]> {
  return await getChainsDataMemo();
}
