import { NewFeatureStatus, NewFeatureId } from "../types";

export const route = "newFeatureStatusSet.dappmanager.dnp.dappnode.eth";

/**
 * Set a domain alias to a DAppNode package by name
 */

export interface RequestData {
  featureId: NewFeatureId;
  status: NewFeatureStatus;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["featureId", "status"],
  properties: {
    featureId: { type: "string" },
    status: { type: "string" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  featureId: "auto-updates",
  status: "seen"
};
