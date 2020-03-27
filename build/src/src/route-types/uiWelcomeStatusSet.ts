import { UiWelcomeStatus } from "../types";

export const route = "uiWelcomeStatusSet.dappmanager.dnp.dappnode.eth";

/**
 * Set a domain alias to a DAppNode package by name
 */

export interface RequestData {
  uiWelcomeStatus: UiWelcomeStatus;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["uiWelcomeStatus"],
  properties: {
    uiWelcomeStatus: { type: "string" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  uiWelcomeStatus: "doing"
};
