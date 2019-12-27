export const route = "volumeRemove.dappmanager.dnp.dappnode.eth";

// No request arguments
export interface RequestData {
  name: string;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string" }
  }
};

export const returnDataSchema = {};

// Samples for testing

export const requestDataSample: RequestData = {
  name: "gethdnpdappnodeeth_data"
};
