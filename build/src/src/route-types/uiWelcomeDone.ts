export const route = "uiWelcomeDone.dappmanager.dnp.dappnode.eth";

/**
 * Set a domain alias to a DAppNode package by name
 */

export interface RequestData {
  isDone?: boolean;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  properties: {
    isDone: { type: "boolean" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {};
