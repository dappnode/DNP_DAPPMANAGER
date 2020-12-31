import { PackageVersionData, DiagnoseItem } from "common/types";

export * from "./common/types";

export interface DiagnoseObj {
  [diagnoseId: string]: DiagnoseItem;
}

export interface WifiStatus {
  running: boolean;
  ssid: string;
  isDefault: boolean;
}

export interface ReqStatus<T = true, P = boolean> {
  loading?: P;
  error?: Error | string;
  result?: T;
}

// Window extension

declare global {
  interface Window {
    /**
     * Git version data injected at build time
     */
    versionData?: PackageVersionData;
    /**
     * Autobahn session.call
     */
    call: (event: string, args?: any[], kwargs?: any) => any;
  }
}
