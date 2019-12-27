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

export const returnDataSample: ReturnData = {
  name: "",
  reqVersion: "",
  semVersion: "",
  avatarUrl: "",
  settings: {},
  imageSize: 0,
  isUpdated: false,
  isInstalled: false,
  metadata: {
    name: "",
    version: ""
  },
  specialPermissions: [],
  request: {
    compatible: {
      requiresCoreUpdate: false,
      resolving: false,
      isCompatible: false,
      error: "",
      dnps: {}
    },
    available: {
      isAvailable: true,
      message: ""
    }
  }
};
