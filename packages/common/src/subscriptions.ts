import {
  AutoUpdateDataView,
  DirectoryItem,
  InstalledPackageData,
  PackageNotification,
  ProgressLog,
  SystemInfo,
  UserActionLog,
  VolumeData,
  VpnDevice,
} from "./types";

export interface SubscriptionsTypes {
  /**
   * Auto-updates data
   */
  autoUpdateData: (autoUpdateData: AutoUpdateDataView) => void;

  /**
   * All VPN devices
   */
  devices: (devices: VpnDevice[]) => void;

  /**
   * Directory updates
   */
  directory: (directory: DirectoryItem[]) => void;

  /**
   * Installed packages updates
   */
  packages: (packages: InstalledPackageData[]) => void;

  /**
   * Installation progress logs
   */
  progressLog: (progressLog: ProgressLog) => void;

  /**
   * Push notification from the DAPPMANAGER
   */
  pushNotification: (notification: PackageNotification) => void;

  /**
   * Triggers a reload on the ADMIN UI client
   * @param data.reason "New client version"
   */
  reloadClient: (data: { reason: string }) => void;

  /**
   * Registry updates
   */
  registry: (registry: DirectoryItem[]) => void;

  /**
   * Relevant system params
   */
  systemInfo: (systemInfo: SystemInfo) => void;

  /**
   * New user action log
   */
  userActionLog: (userActionLog: UserActionLog) => void;

  /**
   * Volume data that's expensive to fetch, from docker system df -v
   */
  volumes: (volumes: VolumeData[]) => void;
}

export type Subscriptions = {
  [K in keyof SubscriptionsTypes]: {
    /**
     * Emit event
     *
     * *Note*: Hover over previous property for info and types
     * ```js
     * subscriptions.packages.emit(...)
     *              ^^^^^^^^
     * ```
     */
    emit: SubscriptionsTypes[K];
    /**
     * Subscribe to event
     *
     * *Note*: Hover over previous property for info and types
     * ```js
     * subscriptions.packages.emit(...)
     *              ^^^^^^^^
     * ```
     */
    on: (handler: SubscriptionsTypes[K]) => void;
  };
};

export const subscriptionsData: { [P in keyof Subscriptions]: {} } = {
  autoUpdateData: {},
  devices: {},
  directory: {},
  packages: {},
  progressLog: {},
  pushNotification: {},
  reloadClient: {},
  registry: {},
  systemInfo: {},
  userActionLog: {},
  volumes: {},
};

// DO NOT REMOVE
// Enforces that each route is a function that returns nothing
export type SubscriptionsArguments = {
  [K in keyof SubscriptionsTypes]: Parameters<SubscriptionsTypes[K]>;
};
