import {
  AutoUpdateDataView,
  ChainData,
  DirectoryItem,
  PackageContainer,
  ProgressLog,
  PackageNotification,
  SystemInfo,
  UserActionLog,
  VolumeData,
  VpnDevice
} from "./types";

export interface SubscriptionsTypes {
  /**
   * Auto-updates data
   * @param autoUpdateData
   */
  autoUpdateData: (autoUpdateData: AutoUpdateDataView) => void;

  /**
   * All running chains status
   * @param chainData
   */
  chainData: (chainData: ChainData[]) => void;

  /**
   * All VPN devices
   * @param devices
   */
  devices: (devices: VpnDevice[]) => void;

  /**
   * Directory updates
   * @param directory
   */
  directory: (directory: DirectoryItem[]) => void;

  /**
   * Installed packages updates
   * @param packages
   */
  packages: (packages: PackageContainer[]) => void;

  /**
   * Installation progress logs
   * @param progressLog
   */
  progressLog: (progressLog: ProgressLog) => void;

  /**
   * Push notification from the DAPPMANAGER
   * @param notification
   */
  pushNotification: (notification: PackageNotification) => void;

  /**
   * Triggers a reload on the ADMIN UI client
   * @param data
   * @param data.reason "New client version"
   */
  reloadClient: (data: { reason: string }) => void;

  /**
   * Relevant system params
   * @param systemInfo
   */
  systemInfo: (systemInfo: SystemInfo) => void;

  /**
   * New user action log
   * @param userActionLog
   */
  userActionLog: (userActionLog: UserActionLog) => void;

  /**
   * Volume data that's expensive to fetch, from docker system df -v
   * @param volumes
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
  }
};

export const subscriptionsData: { [P in keyof Subscriptions]: {} } = {
  autoUpdateData: {},
  chainData: {},
  devices: {},
  directory: {},
  packages: {},
  progressLog: {},
  pushNotification: {},
  reloadClient: {},
  systemInfo: {},
  userActionLog: {},
  volumes: {}
};

// DO NOT REMOVE
// Enforces that each route is a function that returns nothing
export type SubscriptionsArguments = {
  [K in keyof SubscriptionsTypes]: Parameters<SubscriptionsTypes[K]>
};
