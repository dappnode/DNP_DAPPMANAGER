import { PackageVersionData } from "@dappnode/types";
import { SetupTarget } from "@dappnode/types";

export interface WifiCredentials {
  ssid: string;
  isDefaultPassphrase: boolean;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    call: (event: string, args?: any[], kwargs?: any) => any;
  }
}

export interface SetupTargetAllDnps {
  [dnpName: string]: SetupTarget;
}

export interface ProgressLogs {
  [dnpName: string]: string;
}

export interface ProgressLogsByDnp {
  [dnpName: string]: ProgressLogs;
}

export interface DappnodeParams {
  DNCORE_DIR: string;
  REPO_DIR: string;
}

export type Theme = "light" | "dark";

export interface AppContextIface {
  theme: Theme;
  toggleTheme: () => void;
}

export interface RouteType {
  name: string;
  subPath: string;
  component: React.ComponentType;
  hideSection?: boolean; // Used to hide sections in the navbar
}
