import { ChainData } from "@dappnode/types";

export type ChainDataResult = Omit<ChainData, "dnpName">;
