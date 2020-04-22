import { EthClientFallback } from "../types";

export const route = "ethClientFallbackSet.dappmanager.dnp.dappnode.eth";

/**
 * Sets if a fallback should be used
 */

export interface RequestData {
  fallback: EthClientFallback;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["fallback"],
  properties: {
    fallback: { type: "string" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  fallback: "off"
};
