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

export const requestDataSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string" },
    version: { type: "string" },
    userSetEnvs: { type: "object" },
    userSetVols: { type: "object" },
    userSetPorts: { type: "object" },
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
  name: "name",
  version: "0.0.0",
  userSettings: {
    name: {
      environment: { ENV: "VALUE" },
      portMappings: { "8888/TCP": "" },
      namedVolumePaths: { data: "/dev1" },
      fileUploads: { "/file": "data:text/plain;base64,SGVs" }
    }
  },
  options: {
    BYPASS_RESOLVER: true,
    BYPASS_CORE_RESTRICTION: true
  }
};
