export const route = "packageGettingStartedToggle.dappmanager.dnp.dappnode.eth";

export interface RequestData {
  id: string;
  show: boolean;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["id", "show"],
  properties: {
    id: { type: "string" },
    show: { type: "boolean" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  id: "name",
  show: false
};
