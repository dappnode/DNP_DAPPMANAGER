import { RequestedDnp } from "../types";

export const route = "fetchDnpRequest.dappmanager.dnp.dappnode.eth";

export interface RequestData {
  id: string;
}

export type ReturnData = RequestedDnp;

export const requestDataSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string" }
  }
};

export const returnDataSchema = {
  type: "object",
  properties: {}
};

// Samples for testing

export const requestDataSample: RequestData = {
  id: "name"
};
