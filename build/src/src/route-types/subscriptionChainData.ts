import { ChainData } from "../types";
import { chainsDataSchema, chainsDataSample } from "../schemas";

export const route = "chainData.dappmanager.dnp.dappnode.eth";

export type ReturnData = ChainData[];

export const returnDataSchema = chainsDataSchema;

// Samples for testing

export const returnDataSample: ReturnData = chainsDataSample;
