import { getChainsData } from "@dappnode/chains";
import { ChainData } from "@dappnode/common";

export async function chainDataGet(): Promise<ChainData[]> {
  return await getChainsData();
}
