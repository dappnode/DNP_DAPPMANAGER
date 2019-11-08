import { DirectoryItem } from "../types";

export const route = "fetchDnpRequest.dappmanager.dnp.dappnode.eth";

// No request arguments

export type ReturnData = DirectoryItem[];

export const returnDataSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      loc: {
        type: "string"
      }
    },
    required: ["loc"]
  }
};
