export const route = "domainAliasSet.dappmanager.dnp.dappnode.eth";

/**
 * Set a domain alias to a DAppNode package by name
 */

export interface RequestData {
  alias: string;
  dnpName: string;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["alias", "dnpName"],
  properties: {
    alias: { type: "string" },
    dnpName: { type: "string" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  alias: "fullnode",
  dnpName: "openethereum.dnp.dappnode.eth"
};
