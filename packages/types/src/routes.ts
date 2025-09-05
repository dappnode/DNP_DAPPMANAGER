import {
  AutoUpdateDataView,
  ChainData,
  VpnDeviceCredentials,
  VpnDevice,
  HostDiagnoseItem,
  EthClientFallback,
  Eth2ClientTarget,
  EthicalMetricsConfig,
  CoreUpdateData,
  DirectoryItem,
  RequestedDnp,
  UserActionLog,
  HttpsPortalMapping,
  ExposableServiceMapping,
  IpfsRepository,
  LocalProxyingStatus,
  HostHardDisk,
  HostVolumeGroup,
  HostLogicalVolume,
  MountpointData,
  NewFeatureId,
  NewFeatureStatus,
  PackageNotificationDb,
  PackageNotification,
  UserSettingsAllDnps,
  InstalledPackageDetailData,
  InstalledPackageDataApiReturn,
  PortMapping,
  PortToOpen,
  UpnpTablePortStatus,
  ApiTablePortStatus,
  HostStatCpu,
  HostStatMemory,
  HostStatDisk,
  ShhStatus,
  SystemInfo,
  VolumeData,
  PublicIpResponse,
  CurrentWifiCredentials,
  WifiReport,
  WireguardDeviceCredentials,
  DockerUpgradeRequirements,
  InstalledPackageData
} from "./calls.js";
import { PackageEnvs } from "./compose.js";
import { PackageBackup } from "./manifest.js";
import {
  CustomEndpoint,
  GatusEndpoint,
  Notification,
  NotificationPayload,
  NotificationsConfig,
  NotificationsSettingsAllDnps,
  NotifierSubscription
} from "./notifications.js";
import { TrustedReleaseKey } from "./pkg.js";
import { OptimismConfigSet, OptimismConfigGet } from "./rollups.js";
import { Network, StakerConfigGet, StakerConfigSet } from "./stakers.js";

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
  autoUpdateSettingsEdit: (kwargs: { id: string; enabled: boolean }) => Promise<void>;

  /**
   * Generates a backup of a package and sends it to the client for download.
   * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
   */
  backupGet: (kwargs: { dnpName: string; backup: PackageBackup[] }) => Promise<string>;

  /**
   * Restores a backup of a package from the dataUri provided by the user
   * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
   */
  backupRestore: (kwargs: { dnpName: string; backup: PackageBackup[]; fileId: string }) => Promise<void>;

  /**
   * Returns chain data for all installed packages declared as chains
   * Result is cached for 5 seconds across all consumers
   */
  chainDataGet(): Promise<ChainData[]>;

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
   * Cleans the main database of the DAPPMANAGER:
   */
  cleanDb: () => Promise<void>;

  /**
   * Copy file to a DNP:
   * @param containerName Name of a docker container
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
  copyFileToDockerContainer: (kwargs: {
    containerName: string;
    dataUri: string;
    filename: string;
    toPath: string;
  }) => Promise<void>;

  /** Gets the staker configuration for a given network */
  stakerConfigGet: (kwargs: { network: Network }) => Promise<StakerConfigGet>;

  /** Sets the staker configuration for a given network */
  stakerConfigSet: (kwargs: { stakerConfig: StakerConfigSet }) => Promise<void>;

  /**
   * Returns the consensus client for a given network
   * @param network Network to get the consensus client for
   */
  consensusClientsGetByNetworks: (kwargs: {
    networks: Network[];
  }) => Promise<Partial<Record<Network, string | null | undefined>>>;

  /** Set the dappnodeWebNameSet */
  dappnodeWebNameSet: (kwargs: { dappnodeWebName: string }) => Promise<void>;

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
  deviceCredentialsGet: (kwargs: { id: string }) => Promise<VpnDeviceCredentials>;

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
   * @param isAdmin new admin status
   */
  deviceAdminToggle: (kwargs: { id: string; isAdmin: boolean }) => Promise<void>;

  /**
   * Returns true if a password has been created for this device
   * @param id Device id name
   */
  devicePasswordHas: (kwargs: { id: string }) => Promise<boolean>;

  /**
   * Returns the login token of this device, creating it if necessary
   * If the password has been changed and is no longer a login token, throws
   * @param id Device id name
   */
  devicePasswordGet: (kwargs: { id: string }) => Promise<string>;

  /**
   * Returns a list of the existing devices, with the admin property
   */
  devicesList: () => Promise<VpnDevice[]>;

  /**
   * Collect host info for support
   */
  diagnose: () => Promise<HostDiagnoseItem[]>;

  /**
   * Updates docker engine
   */
  dockerUpgrade: () => Promise<void>;

  /**
   * Checks requirements to update docker
   */
  dockerUpgradeCheck: () => Promise<DockerUpgradeRequirements>;

  /**
   * Sets if a fallback should be used
   */
  ethClientFallbackSet: (kwargs: { fallback: EthClientFallback }) => Promise<void>;

  /**
   * Changes the ethereum client used to fetch package data
   */
  ethClientTargetSet: (kwargs: {
    target: Eth2ClientTarget;
    ethRemoteRpc: string;
    sync?: boolean;
    deletePrevExecClient?: boolean;
    deletePrevExecClientVolumes?: boolean;
    deletePrevConsClient?: boolean;
    deletePrevConsClientVolumes?: boolean;
  }) => Promise<void>;

  /**
   * Enables ethical metrics notifications
   * @param mail
   * @param tgChannelId
   * @param sync
   */
  enableEthicalMetrics: (kwargs: { mail: string | null; tgChannelId: string | null; sync: boolean }) => Promise<void>;

  /**
   * Disables ethical metrics notifications
   */
  disableEthicalMetrics: () => Promise<void>;

  /**
   * Returns current core version in string if core was installed, else returns empty string
   */
  getCoreVersion: () => Promise<string>;

  /**
   * Returns the current ethical metrics config
   */
  getEthicalMetricsConfig: () => Promise<EthicalMetricsConfig | null>;

  /**
   * Return formated core update data
   */
  fetchCoreUpdateData: (kwarg: { version?: string }) => Promise<CoreUpdateData>;

  /**
   * Fetch directory summary
   */
  fetchDirectory: () => Promise<DirectoryItem[]>;

  /**
   * Fetch registry summary
   */
  fetchRegistry: () => Promise<DirectoryItem[]>;

  /**
   * Fetch extended info about a new DNP
   */
  fetchDnpRequest: (kwargs: { id: string; version?: string }) => Promise<RequestedDnp>;

  /**
   * Sends custom notification to notifier service
   */
  notificationsSendCustom(kwargs: {
    notificationPayload: NotificationPayload;
    subscriptionEndpoint?: string;
  }): Promise<void>;

  /**
   * Get all the notifications
   */
  notificationsGetAll(): Promise<Notification[]>;

  /**
   * Get banner notifications that should be displayed within the given timestamp range
   */
  notificationsGetBanner(kwargs: { timestamp: number }): Promise<Notification[]>;

  /**
   * Get unseen notifications count
   */
  notificationsGetUnseenCount(): Promise<number>;

  /**
   * Gatus get endpoints
   */
  notificationsGetAllEndpoints(): Promise<{
    [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[]; isCore: boolean };
  }>;

  /**
   * Set all non-banner notifications as seen
   */
  notificationsSetAllSeen(): Promise<void>;

  /**
   * Set a notification as seen by providing its correlationId
   */
  notificationSetSeenByCorrelationID(kwargs: { correlationId: string }): Promise<void>;

  /**
   * Gatus update endpoint
   */
  notificationsUpdateEndpoints: (kwargs: {
    dnpName: string;
    isCore: boolean;
    notificationsConfig: NotificationsConfig;
  }) => Promise<void>;

  /**
   * Applies the previous endpoints configuration to the new ones if their names match
   */
  notificationsApplyPreviousEndpoints: (kwargs: {
    dnpName: string;
    isCore: boolean;
    newNotificationsConfig: NotificationsConfig;
  }) => Promise<NotificationsConfig>;

  /**
   * Returns notifications package status
   */
  notificationsPackageStatus: () => Promise<{
    notificationsDnp: InstalledPackageData | null;
    isInstalled: boolean;
    isRunning: boolean;
    isNotifierRunning: boolean;
    servicesNotRunning: string[];
  }>;

  /**
   * Returns notifications package status
   */
  notificationsGetVapidKey: () => Promise<string | null>;

  /**
   * Returns all subs from notifier
   */
  notificationsGetSubscriptions(): Promise<NotifierSubscription[] | null>;

  /**
   * Updates a subscription alias from notifier by its endpoint
   */
  notificationsUpdateSubAlias(kwargs: { endpoint: string; alias: string }): Promise<void>;

  /**
   * Deletes a subscription from notifier by its endpoint
   */
  notificationsDeleteSubscription(kwargs: { endpoint: string }): Promise<void>;

  /**
   * Posts a new subscription to notifier
   */
  notificationsPostSubscription(kwargs: { subscription: NotifierSubscription }): Promise<void>;

  /**
   * Sends a test notification to all subscriptions / specific subscription
   */
  notificationsSendSubTest(kwargs: { endpoint?: string }): Promise<void>;

  /**
   * Returns the user action logs. This logs are stored in a different
   * file and format, and are meant to ease user support
   * The list is ordered from newest to oldest. Newest log has index = 0
   * @param first for pagination
   * @param after for pagination
   */
  getUserActionLogs: (kwargs: { first?: number; after?: number }) => Promise<UserActionLog[]>;

  /**
   * Returns the host uptime
   * in format: up 3 weeks, 2 days, 8 hours, 40 minutes
   * Use the command "uptime --pretty"
   */
  getHostUptime: () => Promise<string>;

  /** HTTPs Portal: add the PWA mapping */
  httpsPortalPwaMappingAdd(): Promise<void>;
  /** HTTPs Portal: map a subdomain */
  httpsPortalMappingAdd(kwargs: { mapping: HttpsPortalMapping }): Promise<void>;
  /** HTTPs Portal: remove an existing mapping */
  httpsPortalMappingRemove(kwargs: { mapping: HttpsPortalMapping }): Promise<void>;
  /** HTTPs Portal: get all mappings */
  httpsPortalMappingsGet(): Promise<HttpsPortalMapping[]>;
  /** HTTPs Portal: get exposable services with metadata */
  httpsPortalExposableServicesGet(): Promise<ExposableServiceMapping[]>;
  /** HTTPs Portal: recreate mappings */
  httpsPortalMappingsRecreate(): Promise<void>;

  /**
   * Attempts to cat a common IPFS hash. resolves if all OK, throws otherwise
   */
  ipfsTest(): Promise<void>;

  /**
   * Sets the ipfs client target: local | remote
   */
  ipfsClientTargetSet(kwargs: { ipfsRepository: IpfsRepository }): Promise<void>;

  /**
   * Gets the Ipfs client target
   */
  ipfsClientTargetGet(): Promise<IpfsRepository>;

  /**
   * Returns the keystores imported for the given networks.
   */
  keystoresGetByNetwork(kwargs: {
    networks: Network[];
  }): Promise<Partial<Record<Network, Record<string, string[]> | null>>>;

  /**
   * Local proxying allows to access the admin UI through dappnode.local.
   * When disabling this feature:
   * - Remove NGINX logic in HTTPs Portal to route .local domains
   * - Stop exposing the port 80 to the local network
   * - Stop broadcasting .local domains to mDNS
   */
  localProxyingEnableDisable: (enable: boolean) => Promise<void>;

  /**
   * Local proxying allows to access the admin UI through dappnode.local.
   * Return current status of:
   * - NGINX is routing .local domains
   * - Port 80 is exposed
   * - Is broadcasting to mDNS
   */
  localProxyingStatusGet: () => Promise<LocalProxyingStatus>;

  /** LVM: get hard disks */
  lvmhardDisksGet: () => Promise<HostHardDisk[]>;

  /** LVM: get Volume Groups */
  lvmVolumeGroupsGet: () => Promise<HostVolumeGroup[]>;

  /** LVM: get Logical Volumes */
  lvmLogicalVolumesGet: () => Promise<HostLogicalVolume[]>;

  /** LVM: extend host disk space */
  lvmDiskSpaceExtend: (kwargs: { disk: string; volumeGroup: string; logicalVolume: string }) => Promise<string>;

  /**
   * Returns the list of current mountpoints in the host,
   * by running a pre-written script in the host
   */
  mountpointsGet: () => Promise<MountpointData[]>;

  /**
   * Flag the UI welcome flow as completed
   */
  newFeatureStatusSet: (kwargs: { featureId: NewFeatureId; status: NewFeatureStatus }) => Promise<void>;

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
  notificationsTest: (kwargs: { notification?: PackageNotification }) => Promise<void>;

  /**
   * Enables Optimism with the given config
   */
  optimismConfigSet: (kwargs: OptimismConfigSet) => Promise<void>;

  /**
   * Returns the current Optimism configuration
   */
  optimismConfigGet: () => Promise<OptimismConfigGet>;

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
  packageInstall: (kwargs: {
    name: string;
    version?: string;
    userSettings?: UserSettingsAllDnps;
    notificationsSettings?: NotificationsSettingsAllDnps;
    options?: {
      /**
       * Forwarded option to dappGet
       * If true, uses the dappGetBasic, which only fetches first level deps
       */
      BYPASS_RESOLVER?: boolean;
      BYPASS_CORE_RESTRICTION?: boolean;
      BYPASS_SIGNED_RESTRICTION?: boolean;
    };
  }) => Promise<void>;

  /**
   * Get package detail information
   */
  packageGet: (kwargs: { dnpName: string }) => Promise<InstalledPackageDetailData>;

  /**
   * Returns the list of current containers associated to packages
   */
  packagesGet: () => Promise<InstalledPackageDataApiReturn[]>;

  /**
   * Toggles the visibility of a getting started block
   * @param show Should be shown on hidden
   */
  packageGettingStartedToggle: (kwargs: { dnpName: string; show: boolean }) => Promise<void>;

  /**
   * Returns the logs of the docker container of a package
   * @param containerName Name of a docker container
   * @param options log options
   * - timestamps: Show timestamps
   * - tail: Number of lines to return from bottom: 200
   * @returns String with escape codes
   */
  packageLog: (kwargs: { containerName: string; options?: { timestamps?: boolean; tail?: number } }) => Promise<string>;

  /**
   * Remove a package and its data
   * @param id DNP .eth name
   * @param deleteVolumes flag to also clear permanent package data
   */
  packageRemove: (kwarg: { dnpName: string; deleteVolumes?: boolean; timeout?: number }) => Promise<void>;

  /**
   * Recreates a package containers
   */
  packageRestart: (kwargs: { dnpName: string; serviceNames?: string[] }) => Promise<void>;

  /**
   * Removes a package volumes. The re-ups the package
   */
  packageRestartVolumes: (kwargs: { dnpName: string; volumeId?: string }) => Promise<void>;

  /** Delete package sent data key */
  packageSentDataDelete: (kwargs: { dnpName: string; key?: string }) => Promise<void>;

  /**
   * Updates the .env file of a package. If requested, also re-ups it
   */
  packageSetEnvironment: (kwargs: {
    dnpName: string;
    environmentByService: { [serviceName: string]: PackageEnvs };
  }) => Promise<void>;

  /**
   * Updates a package port mappings
   */
  packageSetPortMappings: (kwargs: {
    dnpName: string;
    portMappingsByService: { [serviceName: string]: PortMapping[] };
    options?: { merge: boolean };
  }) => Promise<void>;

  /**
   * Stops or starts a package containers
   * @param timeout seconds to stop the package
   */
  packageStartStop: (kwargs: {
    dnpName: string;
    serviceNames?: string[];
    options?: { timeout?: number };
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
   * Returns ports to open
   */
  portsToOpenGet: () => Promise<PortToOpen[]>;

  /**
   * Returns ports status from upnp scanning
   */
  portsUpnpStatusGet: (kwargs: { portsToOpen: PortToOpen[] }) => Promise<UpnpTablePortStatus[]>;

  /**
   * Returns ports status from API scanning
   */
  portsApiStatusGet: (kwargs: { portsToOpen: PortToOpen[] }) => Promise<ApiTablePortStatus[]>;

  /**
   * Returns the Premium package status
   */
  premiumPkgStatus: () => Promise<{
    premiumDnpInstalled: boolean;
    premiumDnpRunning: boolean;
  }>;

  /**
   * Sets current license key
   * @param licenseKey License key to set
   */
  premiumSetLicenseKey: (licenseKey: string) => Promise<void>;

  /**
   * Returns your current license key and hash
   */
  premiumGetLicenseKey: () => Promise<{
    key: string;
    hash: string;
  }>;

  /**
   * Activates premium license key
   */
  premiumActivateLicense: () => Promise<void>;

  /**
   * Deactivates premium license key
   */
  premiumDeactivateLicense: () => Promise<void>;

  /**
   * Checks if the premium license is active
   */
  premiumIsLicenseActive: () => Promise<boolean>;

  /**
   * Activates the beacon node backup
   * @param id the hashed license
   */
  premiumBeaconBackupActivate: (id: string) => Promise<void>;

  /**
   * Deactivates the beacon node backup
   * @param id the hashed license
   */
  premiumBeaconBackupDeactivate: (id: string) => Promise<void>;

  /**
   * Checks the activation and validity status of the beacon node backup associated with the given hashed license.
   *
   * - Determines if the backup is activable.
   * - Determines if the backup is currently active.
   * - Returns time remaining until activation becomes possible in seconds (if not activable).
   * - Returns time remaining until deactivation in seconds (if currently active).
   *
   * @param hashedLicense The hashed license string used to identify the key.
   */
  premiumBeaconBackupStatus: (hashedLicense: string) => Promise<{
    validatorLimit: number; // The maximum number of validators that can be backed up
    isActivable: boolean;
    isActive: boolean;
    secondsUntilActivable?: number;
    secondsUntilDeactivation?: number;
  }>;

  /**
   * Returns the PWA mapping URL if it exists, otherwise returns undefined.
   */
  pwaUrlGet: () => Promise<string | undefined>;

  /**
   * Returns the HTTPS package status and PWA mapping url if it exists, otherwise adds the mapping.
   */
  pwaRequirementsGet: (kwargs: { host: string }) => Promise<{
    httpsDnpInstalled: boolean;
    isHttpsRunning: boolean;
    pwaMappingUrl: string | undefined;
    privateIp?: boolean | undefined;
    pwaDnsResolves?: boolean | undefined;
    containersInExternalNetwork?: { dappmanager: boolean; httpsDnp: boolean } | undefined;
    externalPointToDappmanager: boolean;
  }>;

  /**
   * Reboots the host machine via the DBus socket
   */
  rebootHost: () => Promise<void>;

  /** Add a release key to trusted keys db */
  releaseTrustedKeyAdd(newTrustedKey: TrustedReleaseKey): Promise<void>;
  /** List all keys from trusted keys db */
  releaseTrustedKeyList(): Promise<TrustedReleaseKey[]>;
  /** Remove a release key from trusted keys db, by name */
  releaseTrustedKeyRemove(keyName: string): Promise<void>;

  /**
   * Returns weather or not should show the smooth modal
   */
  getShouldShowSmooth: () => Promise<boolean>;

  /**
   * Sets the status of the smooth modal
   */
  setShouldShownSmooth: (kwargs: { isShown: boolean }) => Promise<void>;

  /**
   * Sets the static IP
   * @param staticIp New static IP. To enable: "85.84.83.82", disable: ""
   */
  setStaticIp: (kwargs: { staticIp: string }) => Promise<void>;

  statsCpuGet: () => Promise<HostStatCpu>;

  statsMemoryGet: () => Promise<HostStatMemory>;

  statsDiskGet: () => Promise<HostStatDisk>;

  /**
   * Gets bot telegram status
   */
  telegramStatusGet: () => Promise<boolean>;

  /**
   * Sets the status of the telegram bot
   * @param telegramStatus new status of the bot
   */
  telegramStatusSet: (kwarg: { telegramStatus: boolean }) => Promise<void>;

  /**
   * Get telegram configuration: token and user ID
   */
  telegramConfigGet: () => Promise<{
    token: string | null;
    userId: string | null;
  }>;

  /**
   * Set telegram configuration: token and user ID
   */
  telegramConfigSet: (kwargs: { token: string; userId: string }) => Promise<void>;

  /**
   * Updates and upgrades the host machine
   */
  updateUpgrade: () => Promise<string>;

  /**
   * Return the current SSH port from sshd
   */
  sshPortGet: () => Promise<number>;
  /**
   * Change the SHH port on the DAppNode host
   */
  sshPortSet: (kwargs: { port: number }) => Promise<void>;
  /**
   * Disable or enable SSH on the DAppNode host
   */
  sshStatusSet: (kwargs: { status: ShhStatus }) => Promise<void>;
  /**
   * Check if SSH is enabled of disabled in the DAppNode host
   */
  sshStatusGet: () => Promise<ShhStatus>;

  /**
   * Returns the current DAppNode system info
   */
  systemInfoGet: () => Promise<SystemInfo>;

  /**
   * Attemps to open ports using UPnP
   */
  natRenewalEnable: (kwargs: { enableNatRenewal: boolean }) => Promise<void>;

  /** Returns nat renewal status */
  natRenewalIsEnabled: () => Promise<boolean>;

  /**
   * Returns the active validators by network
   * @param networks Array of networks to retrieve its active validators
   */
  validatorsFilterActiveByNetwork(kwargs: {
    networks: Network[];
  }): Promise<Partial<Record<Network, { validators: string[]; beaconError?: Error } | null>>>;

  /**
   * Removes a docker volume by name
   * @param name Full volume name: "bitcoindnpdappnodeeth_bitcoin_data"
   */
  volumeRemove: (kwargs: { name: string }) => Promise<void>;

  /**
   * Returns volume data
   */
  volumesGet: () => Promise<VolumeData[]>;

  /**
   * Returns public Ip in real time
   */
  ipPublicGet: () => Promise<PublicIpResponse>;

  /**Get wifi credentials */
  wifiCredentialsGet(): Promise<CurrentWifiCredentials>;

  /** Get wifi report */
  wifiReportGet(): Promise<WifiReport>;

  /** Add a device to Wireguard DNP ENVs */
  wireguardDeviceAdd(device: string): Promise<void>;

  /** Remove a device from Wireguard DNP ENVs */
  wireguardDeviceRemove(device: string): Promise<void>;

  /** Get credentials for a single Wireguard device */
  wireguardDeviceGet(device: string): Promise<WireguardDeviceCredentials>;

  /** Get URLs to a single Wireguard credentials */
  wireguardDevicesGet(): Promise<string[]>;
}

interface RouteData {
  /**
   * If true, all actions will be registered as userActionLogs
   * Also, each action will be logged at an INFO level
   */
  log?: boolean;
}

export const routesData: { [P in keyof Routes]: RouteData } = {
  autoUpdateDataGet: {},
  autoUpdateSettingsEdit: {},
  backupGet: {},
  backupRestore: {},
  chainDataGet: {},
  changeIpfsTimeout: {},
  cleanCache: {},
  cleanDb: {},
  copyFileToDockerContainer: { log: true },
  stakerConfigGet: {},
  stakerConfigSet: { log: true },
  consensusClientsGetByNetworks: {},
  dappnodeWebNameSet: { log: true },
  deviceAdd: { log: true },
  deviceAdminToggle: { log: true },
  deviceCredentialsGet: {},
  deviceRemove: { log: true },
  deviceReset: { log: true },
  devicePasswordGet: {},
  devicePasswordHas: {},
  devicesList: {},
  diagnose: {},
  dockerUpgrade: { log: true },
  dockerUpgradeCheck: { log: true },
  ethClientFallbackSet: {},
  ethClientTargetSet: { log: true },
  enableEthicalMetrics: { log: true },
  getCoreVersion: {},
  getEthicalMetricsConfig: { log: true },
  disableEthicalMetrics: { log: true },
  fetchCoreUpdateData: {},
  fetchDirectory: {},
  fetchRegistry: {},
  fetchDnpRequest: {},
  notificationsSendCustom: {},
  notificationsGetAll: {},
  notificationsGetBanner: {},
  notificationsGetUnseenCount: {},
  notificationsGetAllEndpoints: {},
  notificationsSetAllSeen: {},
  notificationSetSeenByCorrelationID: {},
  notificationsUpdateEndpoints: {},
  notificationsApplyPreviousEndpoints: {},
  notificationsPackageStatus: {},
  notificationsGetVapidKey: {},
  notificationsGetSubscriptions: {},
  notificationsUpdateSubAlias: {},
  notificationsDeleteSubscription: {},
  notificationsPostSubscription: {},
  notificationsSendSubTest: {},
  getUserActionLogs: {},
  getHostUptime: {},
  httpsPortalPwaMappingAdd: { log: true },
  httpsPortalMappingAdd: { log: true },
  httpsPortalMappingRemove: { log: true },
  httpsPortalMappingsGet: {},
  httpsPortalMappingsRecreate: {},
  httpsPortalExposableServicesGet: {},
  ipfsTest: {},
  ipfsClientTargetSet: {},
  ipfsClientTargetGet: {},
  keystoresGetByNetwork: { log: true },
  localProxyingEnableDisable: { log: true },
  localProxyingStatusGet: {},
  lvmhardDisksGet: {},
  lvmVolumeGroupsGet: {},
  lvmLogicalVolumesGet: {},
  lvmDiskSpaceExtend: { log: true },
  mountpointsGet: {},
  newFeatureStatusSet: {},
  notificationsGet: {},
  notificationsRemove: {},
  notificationsTest: {},
  optimismConfigGet: {},
  optimismConfigSet: { log: true },
  packageInstall: { log: true },
  packageGet: {},
  packagesGet: {},
  packageGettingStartedToggle: {},
  packageLog: {},
  packageRemove: { log: true },
  packageRestart: { log: true },
  packageRestartVolumes: {},
  packageSentDataDelete: {},
  packageSetEnvironment: { log: true },
  packageSetPortMappings: { log: true },
  packageStartStop: { log: true },
  passwordChange: { log: true },
  passwordIsSecure: {},
  poweroffHost: { log: true },
  portsToOpenGet: {},
  portsUpnpStatusGet: {},
  portsApiStatusGet: {},
  premiumPkgStatus: {},
  premiumSetLicenseKey: { log: true },
  premiumGetLicenseKey: { log: true },
  premiumActivateLicense: { log: true },
  premiumDeactivateLicense: { log: true },
  premiumIsLicenseActive: { log: true },
  premiumBeaconBackupActivate: { log: true },
  premiumBeaconBackupDeactivate: { log: true },
  premiumBeaconBackupStatus: { log: true },
  pwaUrlGet: {},
  pwaRequirementsGet: {},
  rebootHost: { log: true },
  releaseTrustedKeyAdd: { log: true },
  releaseTrustedKeyList: {},
  releaseTrustedKeyRemove: { log: true },
  setShouldShownSmooth: {},
  getShouldShowSmooth: {},
  setStaticIp: { log: true },
  statsCpuGet: {},
  statsDiskGet: {},
  statsMemoryGet: {},
  sshPortGet: {},
  sshPortSet: { log: true },
  sshStatusGet: {},
  sshStatusSet: { log: true },
  systemInfoGet: {},
  telegramStatusGet: {},
  telegramStatusSet: { log: true },
  telegramConfigGet: {},
  telegramConfigSet: { log: true },
  updateUpgrade: { log: true },
  natRenewalEnable: {},
  natRenewalIsEnabled: {},
  validatorsFilterActiveByNetwork: { log: true },
  volumeRemove: { log: true },
  volumesGet: {},
  ipPublicGet: {},
  wifiCredentialsGet: {},
  wifiReportGet: {},
  wireguardDeviceAdd: { log: true },
  wireguardDeviceRemove: { log: true },
  wireguardDeviceGet: {},
  wireguardDevicesGet: {}
};

// DO NOT REMOVE
// Enforces that each route is a function that returns a promise
export type RoutesArguments = { [K in keyof Routes]: Parameters<Routes[K]> };
export type RoutesReturn = {
  [K in keyof Routes]: ReplaceVoidWithNull<ResolvedType<Routes[K]>>;
};

/**
 * Returns the return resolved type of a function type
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ResolvedType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R>
  ? R
  : never;

export type ReplaceVoidWithNull<T> = T extends void ? null : T;
