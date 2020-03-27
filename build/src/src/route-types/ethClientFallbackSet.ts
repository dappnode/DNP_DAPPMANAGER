export const route = "ethClientFallbackSet.dappmanager.dnp.dappnode.eth";

/**
 * Sets if a fallback should be used
 */

export interface RequestData {
  fallbackOn: boolean;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["fallbackOn"],
  properties: {
    fallbackOn: { type: "boolean" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  fallbackOn: true
};
