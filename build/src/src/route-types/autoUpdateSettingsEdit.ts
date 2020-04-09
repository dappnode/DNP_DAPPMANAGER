export const route = "autoUpdateSettingsEdit.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {
  id: string;
  enabled: boolean;
};

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    enabled: { type: "boolean" }
  },
  required: ["id", "enabled"]
};
// Samples for testing

export const requestDataSample: RequestData = {
  id: "my-packages",
  enabled: true
};
