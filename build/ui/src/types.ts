import { PackageVersionData, DiagnoseItem } from "common/types";

export * from "./common/types";

export interface DiagnoseObj {
  [diagnoseId: string]: DiagnoseItem;
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
