import { getChainsData } from "@dappnode/chains";
import { ChainData } from "@dappnode/types";

export async function chainDataGet(): Promise<ChainData[]> {
  return await getChainsData();
}
