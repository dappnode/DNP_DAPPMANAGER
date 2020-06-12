import {
  AutoUpdateDataView,
  Diagnose,
  EthClientTarget,
  CoreUpdateData,
  DirectoryItem,
  RequestedDnp,
  HostStats,
  UserSettingsAllDnps,
  PackageContainer,
  MountpointData,
  PackageDetailData,
  SystemInfo,
  VolumeData,
  PortMapping,
  PackageEnvs,
  PackageNotification,
  PackageBackup,
  EthClientFallback,
  NewFeatureId,
  NewFeatureStatus,
  VpnDeviceCredentials,
  VpnDevice,
  PackageNotificationDb,
  UserActionLog
} from "./types";

export interface Routes {
  /**
   * Returns formated auto-update data
   */
  autoUpdateDataGet: () => Promise<AutoUpdateDataView>;

  /**
   * Edits the auto-update settings
   * @param id = "my-packages", "system-packages" or "bitcoin.dnp.dappnode.eth"
   * @param enabled Auto update is enabled for ID
   */
  autoUpdateSettingsEdit: (kwargs: {
    id: string;
    enabled: boolean;
  }) => Promise<void>;

  /**
   * Generates a backup of a package and sends it to the client for download.
   * @param id DNP .eth name
   * @param backup Backup definition
   * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
   */
  backupGet: (kwargs: {
    id: string;
    backup: PackageBackup[];
  }) => Promise<string>;

  /**
   * Restores a backup of a package from the dataUri provided by the user
   * @param id DNP .eth name
   * @param backup Backup definition
   * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
   */
  backupRestore: (kwargs: {
    id: string;
    backup: PackageBackup[];
    fileId: string;
  }) => Promise<void>;

  /**
   * Used to test different IPFS timeout parameters live from the ADMIN UI.
   * @param timeout new IPFS timeout in ms
   */
  changeIpfsTimeout: (kwargs: { timeout: number }) => Promise<void>;

  /**
   * Cleans the cache files of the DAPPMANAGER:
   */
  cleanCache: () => Promise<void>;

  /**
   * Copy file from a DNP and downloaded on the client
   * @param id DNP .eth name
   * @param fromPath path to copy file from
   * - If path = path to a file: "/usr/src/app/config.json".
   *   Downloads and sends that file
   * - If path = path to a directory: "/usr/src/app".
   *   Downloads all directory contents, tar them and send as a .tar.gz
   * - If path = relative path: "config.json".
   *   Path becomes $WORKDIR/config.json, then downloads and sends that file
   *   Same for relative paths to directories.
   * @returns dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
   */
  copyFileFrom: (kwargs: { id: string; fromPath: string }) => Promise<string>;

  /**
   * Copy file to a DNP:
   * @param id DNP .eth name
   * @param dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
   * @param filename name of the uploaded file.
   * - MUST NOT be a path: "/app", "app/", "app/file.txt"
   * @param toPath path to copy a file to
   * - If path = path to a file: "/usr/src/app/config.json".
   *   Copies the contents of dataUri to that file, overwritting it if necessary
   * - If path = path to a directory: "/usr/src/app".
   *   Copies the contents of dataUri to ${dir}/${filename}
   * - If path = relative path: "config.json".
   *   Path becomes $WORKDIR/config.json, then copies the contents of dataUri there
   *   Same for relative paths to directories.
   * - If empty, defaults to $WORKDIR
   */
  copyFileTo: (kwargs: {
    id: string;
    dataUri: string;
    filename: string;
    toPath: string;
  }) => Promise<void>;

  /**
   * Creates a new device with the provided id.
   * Generates certificates and keys needed for OpenVPN.
   * @param id Device id name
   */
  deviceAdd: (kwargs: { id: string }) => Promise<void>;

  /**
   * Creates a new OpenVPN credentials file, encrypted.
   * The filename is the (16 chars short) result of hashing the generated salt in the db,
   * concatenated with the device id.
   * @param id Device id name
   */
  deviceCredentialsGet: (kwargs: {
    id: string;
  }) => Promise<VpnDeviceCredentials>;

  /**
   * Removes the device with the provided id, if exists.
   * @param id Device id name
   */
  deviceRemove: (kwargs: { id: string }) => Promise<void>;

  /**
   * Resets the device credentials with the provided id, if exists.
   * @param id Device id name
   */
  deviceReset: (kwargs: { id: string }) => Promise<void>;

  /**
   * Gives/removes admin rights to the provided device id.
   * @param id Device id name
   */
  deviceAdminToggle: (kwargs: { id: string }) => Promise<void>;

  /**
   * Returns a list of the existing devices, with the admin property
   */
  devicesList: () => Promise<VpnDevice[]>;

  /**
   * Run system diagnose to inform the user
   */
  diagnose: () => Promise<Diagnose>;

  /**
   * Set a domain alias to a DAppNode package by name
   */
  domainAliasSet: (kwargs: { alias: string; dnpName: string }) => Promise<void>;

  /**
   * Sets if a fallback should be used
   */
  ethClientFallbackSet: (kwargs: {
    fallback: EthClientFallback;
  }) => Promise<void>;

  /**
   * Changes the ethereum client used to fetch package data
   */
  ethClientTargetSet: (kwargs: {
    target: EthClientTarget;
    deleteVolumes?: boolean;
  }) => Promise<void>;

  /**
   * Return formated core update data
   */
  fetchCoreUpdateData: (kwarg: { version?: string }) => Promise<CoreUpdateData>;

  /**
   * Fetch directory summary
   */
  fetchDirectory: () => Promise<DirectoryItem[]>;

  /**
   * Fetch extended info about a new DNP
   */
  fetchDnpRequest: (kwargs: { id: string }) => Promise<RequestedDnp>;

  /**
   * Return host machine stats (cpu, memory, etc)
   */
  getStats: () => Promise<HostStats>;

  /**
   * Returns the user action logs. This logs are stored in a different
   * file and format, and are meant to ease user support
   * The list is ordered from newest to oldest. Newest log has index = 0
   * @param first for pagination
   * @param after for pagination
   */
  getUserActionLogs: (kwargs: {
    first?: number;
    after?: number;
  }) => Promise<UserActionLog[]>;

  /**
   * Installs a DAppNode Package.
   * Resolves dependencies, downloads release assets, loads the images to docker,
   * sets userSettings and starts the docker container for each package.
   *
   * The logId is the requested id. It is used for the UI to track the progress
   * of the installation in real time and prevent double installs
   *
   * Options
   * - BYPASS_RESOLVER {bool}: Skips dappGet to only fetche first level dependencies
   * - BYPASS_CORE_RESTRICTION {bool}: Allows unverified core DNPs (from IPFS)
   */
  installPackage: (kwargs: {
    name: string;
    version?: string;
    userSettings?: UserSettingsAllDnps;
    options?: {
      BYPASS_RESOLVER?: boolean;
      BYPASS_CORE_RESTRICTION?: boolean;
    };
  }) => Promise<void>;

  /**
   * Returns the list of current containers associated to packages
   */
  listPackages: () => Promise<PackageContainer[]>;

  /**
   * Returns the logs of the docker container of a package
   * @param id DNP .eth name
   * @param options log options
   * - timestamps: Show timestamps
   * - tail: Number of lines to return from bottom: 200
   * @returns String with escape codes
   */
  logPackage: (kwargs: {
    id: string;
    options?: { timestamps?: boolean; tail?: number };
  }) => Promise<string>;

  /**
   * Returns the list of current mountpoints in the host,
   * by running a pre-written script in the host
   */
  mountpointsGet: () => Promise<MountpointData[]>;

  /**
   * Flag the UI welcome flow as completed
   */
  newFeatureStatusSet: (kwargs: {
    featureId: NewFeatureId;
    status: NewFeatureStatus;
  }) => Promise<void>;

  /**
   * Returns not viewed notifications.
   * Use an array as the keys are not known in advance and the array form
   * is okay for RPC transport, as uniqueness is guaranteed
   */
  notificationsGet: () => Promise<PackageNotificationDb[]>;

  /**
   * Marks notifications as view by deleting them from the db
   * @param ids Array of ids to be marked as read [ "n-id-1", "n-id-2" ]
   */
  notificationsRemove: (kwargs: { ids: string[] }) => Promise<void>;

  /**
   * Adds a notification to be shown the UI.
   * Set the notification param to null for a random notification
   */
  notificationsTest: (kwargs: {
    notification?: PackageNotification;
  }) => Promise<void>;

  /**
   * Get package detail information
   */
  packageDetailDataGet: (kwargs: { id: string }) => Promise<PackageDetailData>;

  /**
   * Toggles the visibility of a getting started block
   * @param show Should be shown on hidden
   */
  packageGettingStartedToggle: (kwargs: {
    id: string;
    show: boolean;
  }) => Promise<void>;

  /**
   * Changes the user `dappnode`'s password in the host machine
   * Only allows it if the current password has the salt `insecur3`
   */
  passwordChange: (kwargs: { newPassword: string }) => Promise<void>;

  /**
   * Checks if the user `dappnode`'s password in the host machine
   * is NOT the insecure default set at installation time.
   * It does so by checking if the current salt is `insecur3`
   *
   * - This check will be run every time this node app is started
   *   - If the password is SECURE it will NOT be run anymore
   *     and this call will return true always
   *   - If the password is INSECURE this check will be run every
   *     time the admin requests it (on page load)
   *
   * @returns true = is secure / false = is not
   */
  passwordIsSecure: () => Promise<boolean>;

  /**
   * Shuts down the host machine via the DBus socket
   */
  poweroffHost: () => Promise<void>;

  /**
   * Reboots the host machine via the DBus socket
   */
  rebootHost: () => Promise<void>;

  /**
   * Remove a package and its data
   * @param id DNP .eth name
   * @param deleteVolumes flag to also clear permanent package data
   */
  removePackage: (kwarg: {
    id: string;
    deleteVolumes?: boolean;
    timeout?: number;
  }) => Promise<void>;

  /**
   * Requests chain data. Also instructs the DAPPMANAGER
   * to keep sending data for a period of time (5 minutes)
   */
  requestChainData: () => Promise<void>;

  /**
   * Calls docker rm and docker up on a package
   */
  restartPackage: (kwargs: { id: string }) => Promise<void>;

  /**
   * Removes a package volumes. The re-ups the package
   */
  restartPackageVolumes: (kwargs: {
    id: string;
    volumeId?: string;
  }) => Promise<void>;

  /**
   * Receives an encrypted message containing the seed phrase of
   * 12 word mnemonic ethereum account. The extra layer of encryption
   * slightly increases the security of the exchange while the WAMP
   * module works over HTTP.
   * @param seedPhraseEncrypted tweetnacl base64 box with nonce
   */
  seedPhraseSet: (kwargs: { seedPhraseEncrypted: string }) => Promise<void>;

  /**
   * Sets the static IP
   * @param staticIp New static IP. To enable: "85.84.83.82", disable: ""
   */
  setStaticIp: (kwargs: { staticIp: string }) => Promise<void>;

  /**
   * Returns the current DAppNode system info
   */
  systemInfoGet: () => Promise<SystemInfo>;

  /**
   * Stops or starts after fetching its status
   * @param id DNP .eth name
   * @param timeout seconds to stop the package
   */
  togglePackage: (kwargs: {
    id: string;
    options?: { timeout?: number };
  }) => Promise<void>;

  /**
   * Updates the .env file of a package. If requested, also re-ups it
   * @param id DNP .eth name
   * @param envs environment variables, envs = { ENV_NAME: ENV_VALUE }
   */
  updatePackageEnv: (kwargs: {
    id: string;
    envs: PackageEnvs;
  }) => Promise<void>;

  /**
   * Updates a package port mappings
   */
  updatePortMappings: (kwargs: {
    id: string;
    portMappings: PortMapping[];
    options?: { merge: boolean };
  }) => Promise<void>;

  /**
   * Removes a docker volume by name
   * @param name Full volume name: "bitcoindnpdappnodeeth_bitcoin_data"
   */
  volumeRemove: (kwargs: { name: string }) => Promise<void>;

  /**
   * Returns volume data
   */
  volumesGet: () => Promise<VolumeData[]>;
}

export const routesData: { [P in keyof Routes]: {} } = {
  autoUpdateDataGet: {},
  autoUpdateSettingsEdit: {},
  backupGet: {},
  backupRestore: {},
  changeIpfsTimeout: {},
  cleanCache: {},
  copyFileFrom: {},
  copyFileTo: {},
  deviceAdd: {},
  deviceAdminToggle: {},
  deviceCredentialsGet: {},
  deviceRemove: {},
  deviceReset: {},
  devicesList: {},
  diagnose: {},
  domainAliasSet: {},
  ethClientFallbackSet: {},
  ethClientTargetSet: {},
  fetchCoreUpdateData: {},
  fetchDirectory: {},
  fetchDnpRequest: {},
  getStats: {},
  getUserActionLogs: {},
  installPackage: {},
  listPackages: {},
  logPackage: {},
  mountpointsGet: {},
  newFeatureStatusSet: {},
  notificationsGet: {},
  notificationsRemove: {},
  notificationsTest: {},
  packageDetailDataGet: {},
  packageGettingStartedToggle: {},
  passwordChange: {},
  passwordIsSecure: {},
  poweroffHost: {},
  rebootHost: {},
  removePackage: {},
  requestChainData: {},
  restartPackage: {},
  restartPackageVolumes: {},
  seedPhraseSet: {},
  setStaticIp: {},
  systemInfoGet: {},
  togglePackage: {},
  updatePackageEnv: {},
  updatePortMappings: {},
  volumeRemove: {},
  volumesGet: {}
};

// DO NOT REMOVE
// Enforces that each route is a function that returns a promise
export type RoutesArguments = { [K in keyof Routes]: Parameters<Routes[K]> };
export type RoutesReturn = {
  [K in keyof Routes]: ReplaceVoidWithNull<ResolvedType<Routes[K]>>
};

/**
 * Returns the return resolved type of a function type
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ResolvedType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never;
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ReplaceVoidWithNull<T> = T extends void ? null : T;
