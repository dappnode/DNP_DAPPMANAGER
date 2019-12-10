import { UserSettingsAllDnps } from "../types";

export const route = "installPackage.dappmanager.dnp.dappnode.eth";

export interface RequestData {
  name: string;
  version?: string;
  userSettings?: UserSettingsAllDnps;
  options?: {
    BYPASS_RESOLVER?: boolean;
    BYPASS_CORE_RESTRICTION?: boolean;
  };
}

export type ReturnData = void;

const objOfStringsSchema = {
  type: "object",
  patternProperties: { "^.*$": { type: "string" } }
};
export const requestDataSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string" },
    version: { type: "string" },
    userSettings: {
      type: "object",
      patternProperties: {
        "^.*$": {
          environment: objOfStringsSchema,
          portMappings: objOfStringsSchema,
          namedVolumeMountpoints: objOfStringsSchema,
          fileUploads: objOfStringsSchema
        }
      }
    },
    options: {
      type: "object",
      properties: {
        BYPASS_RESOLVER: { type: "boolean" },
        BYPASS_CORE_RESTRICTION: { type: "boolean" }
      }
    }
  }
};

// Samples for testing

export const requestDataSample: RequestData = {
  name: "dnp.name.eth",
  version: "0.0.0",
  userSettings: {
    "dnp.name.eth": {
      environment: { ENV: "VALUE" },
      portMappings: { "8888/TCP": "" },
      namedVolumeMountpoints: { data: "/dev1" },
      fileUploads: { "/file": "data:text/plain;base64,SGVs" }
    }
  },
  options: {
    BYPASS_RESOLVER: true,
    BYPASS_CORE_RESTRICTION: true
  }
};
