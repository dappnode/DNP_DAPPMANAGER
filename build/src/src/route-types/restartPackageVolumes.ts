export const route = "restartPackageVolumes.dappmanager.dnp.dappnode.eth";

export interface RequestData {
  id: string;
  volumeId?: string;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string" },
    volumeId: { type: "string" }
  }
};

export const returnDataSchema = {};

// Samples for testing

export const requestDataSample: RequestData = {
  id: "geth.dnp.dappnode.eth",
  volumeId: "gethdnpdappnodeeth_geth"
};
