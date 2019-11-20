import { CoreUpdateData } from "../types";
import { coreUpdateDataSchema, coreUpdateDataSample } from "../schemas";

export const route = "fetchCoreUpdateData.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {
  version?: string;
};

export type ReturnData = CoreUpdateData;

export const requestDataSchema = {
  type: "object",
  properties: {
    version: { type: "string" }
  }
};

export const returnDataSchema = coreUpdateDataSchema;

// Samples for testing

export const requestDataSample: RequestData = {};

export const returnDataSample: ReturnData = coreUpdateDataSample;
