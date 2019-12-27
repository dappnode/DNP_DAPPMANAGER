export const route = "passwordChange.dappmanager.dnp.dappnode.eth";

/**
 * Changes the user `dappnode`'s password in the host machine
 * Only allows it if the current password has the salt `insecur3`
 */

export interface RequestData {
  newPassword: string;
}

export type ReturnData = void;

export const requestDataSchema = {
  type: "object",
  required: ["newPassword"],
  properties: {
    newPassword: { type: "string" }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  newPassword: "secure-pass"
};
