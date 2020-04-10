export const route = "reload-client.dappmanager.dnp.dappnode.eth";

export type ReturnData = { reason: string };

export const returnDataSchema = {
  type: "object",
  properties: { reason: { type: "string" } },
  required: []
};

// Samples for testing

export const returnDataSample: ReturnData = { reason: "New version v0.2.6" };
