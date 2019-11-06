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

// Demo for testing

// export const requestData: RequestData = {
//   email: "as@gmail.com",
//   phone: "9939393",
//   age: 12
// };
