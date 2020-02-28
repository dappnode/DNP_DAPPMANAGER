import { EthClientTarget } from "../types";

export const route = "ethClientTargetSet.dappmanager.dnp.dappnode.eth";

/**
 * Changes the ethereum client used to fetch package data
 */

export interface RequestData {
  target: EthClientTarget;
  deleteVolumes?: boolean;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["target"],
  properties: {
    target: { type: "string" },
    deleteVolumes: { type: "boolean" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  target: "geth-fast",
  deleteVolumes: true
};
