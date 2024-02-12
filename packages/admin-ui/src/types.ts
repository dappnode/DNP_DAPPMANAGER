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

export type UiModuleStatus = "enabled" | "disabled";

export interface AppContextIface {
  theme: Theme;
  stakersModuleStatus: UiModuleStatus;
  rollupsModuleStatus: UiModuleStatus;
  toggleTheme: () => void;
  toggleStakersModuleStatus: () => void;
  toggleRollupsModuleStatus: () => void;
}

export type ModulesContext = Pick<
  AppContextIface,
  | "stakersModuleStatus"
  | "rollupsModuleStatus"
  | "toggleStakersModuleStatus"
  | "toggleRollupsModuleStatus"
>;
