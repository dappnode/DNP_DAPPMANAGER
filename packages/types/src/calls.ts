import { ContainerState } from "./pkg.js";
import { ComposeNetworks, ComposeServiceNetworks, PackageEnvs } from "./compose.js";
import { Manifest, Dependencies, ChainDriver, PackageBackup, ManifestUpdateAlert } from "./manifest.js";
import { SetupWizard } from "./setupWizard.js";

/**
 * Take into account the following tags to document the new types inside this file
 * @see https://tsdoc.org/pages/tags/deprecated/
 */

/**
 * =====================
 * HTTPS portal mappings
 * =====================
 */

export interface HttpsPortalMapping {
  fromSubdomain: string;
  dnpName: string;
  serviceName: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

export interface ExposableServiceInfo extends HttpsPortalMapping {
  /** Example: `"Geth JSON RPC"` */
  name: string;
  /** Example: `"JSON RPC endpoint for Geth mainnet"` */
  description: string;
}

export interface ExposableServiceManifestInfo {
  name: string;
  description?: string;
  serviceName?: string;
  fromSubdomain?: string;
  port: number;
  exposeByDefault?: boolean;
}

export interface ExposableServiceMapping extends ExposableServiceInfo {
  exposed: boolean;
}

/**
 * ===============
 * Ethical Metrics
 * ===============
 */

export interface EthicalMetricsConfig {
  enabled: boolean;
  mail: string | null;
  tgChannelId: string | null;
}

/**
 * ============
 * AUTH session
 * ============
 */
export interface LoginStatusReturn {
  username: string;
  isAdmin: boolean;
}

/**
 * ====
 * WIFI
 * ====
 */

export interface WifiReport {
  info: string;
  report?: {
    lastLog: string;
    exitCode: number | null;
  };
}

export interface CurrentWifiCredentials {
  ssid: string;
  password: string;
}

/**
 * =========
 * WIREGUARD
 * =========
 */

export interface WireguardDeviceCredentials {
  /**
   * Raw config file in plaintext
   * ```txt
   * [Interface]
   * Address = 172.34.1.2
   * PrivateKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
   * ListenPort = 51820
   * DNS = 172.33.1.2
   *
   * [Peer]
   * PublicKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
   * Endpoint = aaaabbbbaaaabbbb.dyndns.dappnode.io:51820
   * AllowedIPs = 172.33.0.0/16
   * ```
   */
  configRemote: string;
  configLocal: string;
}

/**
 * ===
 * SSH
 * ===
 */

export type ShhStatus = "enabled" | "disabled";

/**
 * =======
 * DEVICES
 * =======
 */

export type VpnDeviceAdminPassword = { hasChangedPassword: true } | { hasChangedPassword: false; password: string };

export type VpnDevice = { id: string; admin: false } | ({ id: string; admin: true } & VpnDeviceAdminPassword);

export type VpnDeviceCredentials = VpnDevice & {
  url: string;
};

/**
 * ==========================
 * SMART CONTRACT - DIRECTORY
 * ==========================
 * [NOTE] Items MUST be ordered by the directory order
 * - featured #0
 * - featured #1
 * - whitelisted #0
 * - whitelisted #1
 * - whitelisted #2
 * - other #0
 * - other #1
 *
 * [NOTE] Search result will never show up in the directory listing,
 * they will appear in a future dropdown under the searchbar
 */

/**
 * Information immediatelly available in the directory smart contract
 */
interface DirectoryItemBasic {
  index: number;
  name: string;
  whitelisted: boolean;
  isFeatured: boolean;
}
export interface DirectoryItemOk extends DirectoryItemBasic {
  status: "ok";
  description: string; // = metadata.shortDescription || metadata.description
  avatarUrl: string; // Must be URL to a resource in a DAPPMANAGER API
  isInstalled: boolean; // Show "UPDATE"
  isUpdated: boolean; // Show "UPDATED"
  featuredStyle?: {
    featuredBackground?: string;
    featuredColor?: string;
    featuredAvatarFilter?: string;
  };
  categories: string[];
}

export interface DirectoryItemError extends DirectoryItemBasic {
  status: "error";
  message: string;
}

export type DirectoryItem = DirectoryItemOk | DirectoryItemError;

export interface RequestStatus {
  loading?: boolean;
  error?: string;
  success?: boolean;
}

/**
 * ================
 * DOCKER - COMPOSE
 * ================
 */

/**
 * User settings in compose file
 */
export interface UserSettings {
  environment?: {
    [serviceName: string]: {
      /**
       * ```js
       * { MODE: "VALUE_SET_BEFORE" }
       * ```
       */
      [envName: string]: string; // Env value
    };
  };
  portMappings?: {
    [serviceName: string]: {
      /**
       * ```js
       * { "8443": "8443", "8443/udp": "8443" },
       * ```
       */
      [containerPortAndType: string]: string; // Host port
    };
  };
  namedVolumeMountpoints?: {
    /**
     * ```js
     * { data: "/media/usb0" }
     * ```
     */
    [volumeName: string]: string; // Host absolute path to mountpoint
  };
  allNamedVolumeMountpoint?: string; // mountpoint
  fileUploads?: {
    [serviceName: string]: {
      /**
       * ```js
       * { "/usr/src/app/config.json": "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D" }
       * ```
       */
      [containerPath: string]: string; // dataURL
    };
  };

  // For keeping staker network in case client is selected
  networks?: {
    rootNetworks: ComposeNetworks;
    serviceNetworks: { [serviceName: string]: ComposeServiceNetworks };
  };

  domainAlias?: string[]; // ["fullnode", "my-custom-name"]
  // ### DEPRECATED Kept for legacy compatibility
  legacyBindVolumes?: {
    [serviceName: string]: {
      [volumeName: string]: string; // Host vol name to host bind absolute path
    };
  };
}

/**
 * =========
 * INSTALLER
 * =========
 */

/**
 * CompatibleDnps is a map of DNP names to the versions that are compatible
 */
export interface CompatibleDnps {
  [dnpName: string]: { from?: string; to: string };
  // "bitcoin.dnp.dappnode.eth": { from: "0.2.5"; to: "0.2.6" };
  // "ln.dnp.dappnode.eth": { from: null; to: "0.2.2" };
}

export interface RequestedDnp {
  dnpName: string; // "bitcoin.dnp.dappnode.eth"
  reqVersion: string; // origin or semver: "/ipfs/Qm611" | "0.2.3"
  semVersion: string; // Always a semver: "0.2.3"
  origin?: string; // "/ipfs/Qm"
  avatarUrl: string; // "http://dappmanager.dappnode/avatar/Qm7763518d4";
  // Setup
  setupWizard?: SetupWizardAllDnps;
  settings: UserSettingsAllDnps; // MUST include the previous user settings
  // Additional data
  imageSize: number;
  isUpdated: boolean;
  isInstalled: boolean;
  installedVersion?: string;
  // Decoupled metadata
  manifest: Manifest;
  specialPermissions: SpecialPermissionAllDnps;
  // Request status and dependencies
  compatible: {
    requiresCoreUpdate: boolean;
    requiresDockerUpdate: boolean;
    packagesToBeUninstalled: string[];
    resolving: boolean;
    isCompatible: boolean; // false;
    error: string; // "LN requires incompatible dependency";
    dnps: CompatibleDnps;
  };
  available: {
    isAvailable: boolean; // false;
    message: string; // "LN image not available";
  };

  /** SignedSafe = signed or from a safe origin */
  signedSafe: Record<DnpName, { safe: boolean; message: string }>;
  /** Requested DNP plus all their dependencies are either signed or from a safe origin */
  signedSafeAll: boolean;
}

export interface UserSettingsAllDnps {
  [dnpName: string]: UserSettings;
}

export type DnpName = string;

export interface SetupWizardAllDnps {
  [dnpName: string]: SetupWizard;
}

/**
 * =====
 * PORTS
 * =====
 */

export enum PortProtocol {
  UDP = "UDP",
  TCP = "TCP"
}

export interface UpnpPortMapping {
  protocol: PortProtocol;
  exPort: string;
  inPort: string;
  ip: string;
}

interface BasicPortMapping {
  host?: number;
  container: number;
  protocol: PortProtocol;
}

export interface PortMapping extends BasicPortMapping {
  ephemeral?: boolean;
  ip?: string;
  deletable?: boolean;
}

export interface PackagePort {
  portNumber: number;
  protocol: PortProtocol;
}

export interface UpnpPortMapping {
  protocol: PortProtocol;
  exPort: string;
  inPort: string;
  ip: string;
}

export interface TablePortsStatus {
  port: number;
  protocol: PortProtocol;
  serviceName: string;
  dnpName: string;
  message?: string;
}

export interface ApiTablePortStatus extends TablePortsStatus {
  status: ApiStatus;
}

export interface UpnpTablePortStatus extends TablePortsStatus {
  status: UpnpStatus;
}

// ApiStatus data structure is different than UpnpStatus because we want to attach an error message
export type ApiStatus =
  | "open"
  | "closed"
  | "unknown" // port not found or protocol UDP
  | "error"; // error from/fetching the API

// unknown => port not found. not-available => UPnP disabled or not recognized
export type UpnpStatus = "open" | "closed";

/**
 * =======
 * VOLUMES
 * =======
 */

export interface VolumeMapping {
  host: string; // path
  container: string; // dest
  name?: string;
}

// An array of mountpoints MUST include one with the host (mountpoint = "")
export interface MountpointData {
  mountpoint: string; // "/media/usb0", mountpoint = "" means host (default)
  use: string; // "89%"
  used: number; // 198642520
  total: number; // 235782040
  free: number; // 25092776
  vendor: string; // "ATA", "SanDisk"
  model: string; // "CT500MX500SSD4", "Ultra_USB_3.0"
}

export interface HostVolumeGroupReport {
  report: {
    vg: HostVolumeGroup[];
  }[];
}

export interface HostVolumeGroup {
  vg_name: string;
  vg_size: string;
}

export interface HostLogicalVolumeReport {
  report: {
    lv: HostLogicalVolume[];
  }[];
}

export interface HostLogicalVolume {
  lv_name: string;
  vg_name: string;
  lv_size: string;
}

export interface VolumeOwnershipData {
  name: string; // "gethdnpdappnodeeth_geth", Actual name to call delete on
  owner?: string; // "geth.dnp.dappnode.eth", Actual name of the owner
}

export interface VolumeData extends VolumeOwnershipData {
  internalName?: string; // "data", Volume name as referenced inside the compose
  createdAt: number; // 1569346006000,
  size?: number; // 161254123,
  refCount?: number; // 2
  isOrphan: boolean; // if no container is using it
  mountpoint: string; // "/dev1/data",
  // Mountpoint extended data
  fileSystem?: MountpointData;
}

/**
 * ========
 * PACKAGES
 * ========
 */

export interface PackageContainer {
  /**
   * Docker container ID
   * ```
   * "3edc051920c61e02ff9c42cf35caf4f48f693d65f44d6652de29e9024f051405"
   * ```
   */
  containerId: string;
  /**
   * Docker container name
   * ```
   * "DAppNodeCore-mypackage.dnp.dappnode.eth"
   * ```
   */
  containerName: string;
  /**
   * ENS domain name of this container's package
   * ```
   * "mypackage.dnp.dappnode.eth"
   * ```
   */
  dnpName: string;
  /**
   * Docker compose service name of this container, as declared in its package docker-compose
   * ```
   * "frontend"
   * ```
   */
  serviceName: string;
  /**
   * Name given by the user when installing an instance of a package
   * ```
   * "my-package-test-instance"
   * ```
   */
  instanceName: string;
  /**
   * Semantic version of this container's package
   * ```
   * "0.1.0"
   * ```
   */
  version: string;

  // Docker data
  created: number;
  image: string;
  ip?: string; // IP of the DNP in the dappnode network
  state: ContainerState;
  running: boolean;
  exitCode: number | null;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  networks: { name: string; ip: string }[];

  // DAppNode package data
  isDnp: boolean;
  isCore: boolean;
  defaultEnvironment?: PackageEnvs;
  defaultPorts?: PortMapping[];
  defaultVolumes?: VolumeMapping[];
  dependencies: Dependencies;
  avatarUrl: string;
  origin?: string;
  chain?: ChainDriver;
  domainAlias?: string[];
  canBeFullnode?: boolean;
  isMain?: boolean;
  dockerTimeout?: number;
  // Note: environment is only accessible doing a container inspect or reading the compose
  // envs?: PackageEnvs;
}

export interface InstalledPackageDataApiReturn extends InstalledPackageData {
  updateAvailable: UpdateAvailable | null;
}

export type InstalledPackageData = Pick<
  PackageContainer,
  | "dnpName"
  | "instanceName"
  | "version"
  | "isDnp"
  | "isCore"
  | "dependencies"
  | "avatarUrl"
  | "origin"
  | "chain"
  | "domainAlias"
  | "canBeFullnode"
> & {
  containers: PackageContainer[];
};

export interface UpdateAvailable {
  newVersion: string;
  upstreamVersion?: string | string[];
}

export interface InstalledPackageDetailData extends InstalledPackageData {
  setupWizard?: SetupWizard;
  userSettings?: UserSettings;
  gettingStarted?: string;
  gettingStartedShow?: boolean;
  backup?: PackageBackup[];
  /** Checks if there are volumes to be removed on this DNP */
  areThereVolumesToRemove: boolean;
  dependantsOf: string[];
  updateAvailable: UpdateAvailable | null;
  notRemovable: boolean;
  // Non-indexed data
  manifest?: Manifest;
  /** Arbitrary data sent by the package */
  packageSentData: Record<string, string>;
}
export interface PackagePort {
  portNumber: number;
  protocol: PortProtocol;
}

export interface PortToOpen extends PackagePort {
  serviceName: string;
  dnpName: string;
}

/**
 * =============
 * NOTIFICATIONS
 * =============
 */

export type NotificationType = "danger" | "warning" | "success" | "info";
export interface PackageNotification {
  id: string; // "notification-id"
  type: NotificationType;
  title: string; // "Some notification"
  body: string; // "Some text about notification"
}
export interface PackageNotificationDb extends PackageNotification {
  timestamp: number;
  viewed: boolean;
}

export type UpdateType = "major" | "minor" | "patch" | null;

export interface ChainData {
  dnpName: string; // "geth.dnp.dappnode.eth"
  name?: string; // Optional pretty name: "Geth"
  syncing: boolean; // if chain is syncing
  error: boolean; // If there was an error retrieving state
  message: string; // "Blocks synced: 543000 / 654000"
  help?: string; // External link to show as help if needed: "http://geth.help"
  progress?: number; // 0.83027522935
  peers?: number; // 10
}

/**
 * UI Welcome flow status. Persists the info of which page the UI should show
 */
export type NewFeatureStatus = "pending" | "seen" | "skipped";

/**
 * ====
 * LOGS
 * ====
 */

export interface ProgressLog {
  id: string; // "ln.dnp.dappnode.eth@/ipfs/Qmabcdf", overall log id(to bundle multiple logs)
  dnpName: string; // "bitcoin.dnp.dappnode.eth", dnpName the log is referring to
  message: string; // "Downloading 75%", log message
  clear?: boolean; // to trigger the UI to clear the all logs of this id
}

export interface UserActionLog {
  level: "info" | "error";
  timestamp: number; // 1591095463341
  event: string; // "packageInstall.dnp.dappnode.eth"
  message: string; // "Successfully install DNP", { string } Returned message from the call function*
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[]; // { id: "dnpName" }, { object }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any; // If success: { data: "contents" }, {*} Returned result from the call function
  stack?: string; // If error: e.stack { string }
  // Additional properties to compress repeated logs (mainly errors)
  count?: number;
}

/**
 * ===========
 * AUTO UPDATE
 * ===========
 */

/**
 * Sample:
 * ```
 * settings = {
 *   "system-packages": { enabled: true }
 *   "my-packages": { enabled: true }
 *   "bitcoin.dnp.dappnode.eth": { enabled: false }
 * }
 * ```
 */
export interface AutoUpdateSettings {
  [dnpNameOrGroupId: string]: { enabled: boolean };
}

export interface AutoUpdateRegistryEntry {
  updated?: number;
  successful?: boolean;
}
export interface AutoUpdateRegistryDnp {
  [version: string]: AutoUpdateRegistryEntry;
}

/**
 * Sample:
 * ```
 * registry = {
 *   "core.dnp.dappnode.eth": {
 *     "0.2.4": { updated: 1563304834738, successful: true },
 *     "0.2.5": { updated: 1563304834738, successful: false }
 *   }, ...
 * }
 * ```
 */
export interface AutoUpdateRegistry {
  [dnpName: string]: AutoUpdateRegistryDnp;
}

export interface AutoUpdatePendingEntry {
  version?: string;
  firstSeen?: number;
  scheduledUpdate?: number;
  completedDelay?: boolean;
  errorMessage?: string;
}

/**
 * Sample:
 * ```
 * pending = {
 *   "core.dnp.dappnode.eth": {
 *     version: "0.2.4",
 *     firstSeen: 1563218436285,
 *     scheduledUpdate: 1563304834738,
 *     completedDelay: true
 *   },
 * ... },
 * ```
 */
export interface AutoUpdatePending {
  [dnpName: string]: AutoUpdatePendingEntry;
}

export interface AutoUpdateFeedback {
  inQueue?: boolean;
  manuallyUpdated?: boolean;
  scheduled?: number;
  updated?: number;
  errorMessage?: string;
}

/**
 * Sample:
 * ```
 * dnpsToShow = [{
 *   id: "system-packages",
 *   displayName: "System packages",
 *   enabled: true,
 *   feedback: {
 *     updated: 15363818244,
 *     manuallyUpdated: true,
 *     inQueue: true,
 *     scheduled: 15363818244
 *   }
 * }, ... ]
 * ```
 */
export interface AutoUpdateDataDnpView {
  id: string;
  displayName: string;
  enabled: boolean;
  feedback: AutoUpdateFeedback;
}

/**
 * Full auto-update data:
 * - settings: If auto-updates are enabled for a specific DNP or DNPs
 * - registry: List of executed auto-updates
 * - pending: Pending auto-update per DNP, can be already executed
 * - dnpsToShow: Parsed data to be shown in the UI
 */
export interface AutoUpdateDataView {
  settings: AutoUpdateSettings;
  registry: AutoUpdateRegistry;
  pending: AutoUpdatePending;
  dnpsToShow: AutoUpdateDataDnpView[];
}

/**
 * ===========
 * CORE UPDATE
 * ===========
 */

export interface DependencyListItem {
  name: string;
  from?: string;
  to: string;
  warningOnInstall?: string;
}

export interface CoreUpdateDataNotAvailable {
  available: false;
}
export interface CoreUpdateDataAvailable {
  available: true;
  type?: string;
  packages: DependencyListItem[];
  changelog: string;
  updateAlerts: ManifestUpdateAlert[];
  versionId: string;
  coreVersion: string;
}
export type CoreUpdateData = CoreUpdateDataNotAvailable | CoreUpdateDataAvailable;

/**
 * Releases types
 */

export interface PackageVersionData {
  version?: string;
  branch?: string;
  commit?: string;
}

/**
 * =============
 * HOST - DOCKER
 * =============
 */

export interface DockerUpgradeRequirements {
  isDockerInstalledThroughApt: boolean;
  isDockerInUnattendedUpgrades: boolean;
  dockerHostVersion: string;
  dockerLatestVersion?: string;
}

/**
 * ===========
 * HOST - DATA
 * ===========
 */

export interface HostDiagnoseItem {
  name: string;
  data: string;
}

export interface HostHardDisksReport {
  blockdevices: HostHardDisk[];
}

export interface HostHardDisk {
  name: string;
  size: string;
}

export interface RebootRequiredScript {
  rebootRequired: boolean;
  pkgs: string;
}

export interface HostInfoScript {
  dockerComposeVersion: string;
  dockerServerVersion: string;
  dockerCliVersion: string;
  os: string;
  versionCodename: string;
  architecture: string;
  kernel: string;
}

export interface AvahiDaemonStatus {
  isAvahiRunning: boolean;
  isAvahiEnabled: boolean;
  avahiResolves: boolean;
}

export type LocalProxyingStatus = "running" | "stopped" | "crashed" | "https missing";

/**
 * Aggregated DAppNode system info
 */
export interface SystemInfo {
  // Git version data
  versionData: PackageVersionData;
  versionDataVpn: PackageVersionData;
  // Network params
  ip: string; // "85.84.83.82",
  name: string; // hostname
  dappnodeWebName: string; // It's a front-end value
  staticIp: string; // "85.84.83.82" | null,
  domain: string; // "1234acbd.dyndns.io",
  upnpAvailable: boolean;
  noNatLoopback: boolean;
  alertToOpenPorts: boolean;
  internalIp: string; // "192.168.0.1",
  // publicIp is used to check for internet connection after installation
  publicIp: string;
  // Eth multi-client configuration
  eth2ClientTarget: Eth2ClientTarget;
  ethClientFallback: EthClientFallback;
  // Eth multi-client status (cached, may be a small delay with real status)
  // - EthClientStatus = status of the current target
  // - undefined = status of current target has not been defined yet
  // - null = current target is remote and has no status
  ethClientStatus: EthClientStatus | undefined | null;
  ethRemoteRpc: string;
  // Domain maps
  fullnodeDomainTarget: string;
  // UI stats
  newFeatureIds: NewFeatureId[];
}

/**
 * Host machine Memory stats: filesystem, used, available, etc
 */
export interface HostStatMemory {
  total: number;
  used: number;
  free: number;
  usedPercentage: number;
}

/**
 * Host machine Disk stats: filesystem, used, available, etc
 */
export interface HostStatDisk {
  total: number;
  used: number;
  free: number;
  usedPercentage: number;
}

/**
 * Host machine CPU used
 */
export interface HostStatCpu {
  usedPercentage: number;
  numberOfCores: number;
  temperatureAverage: number;
}

export interface PublicIpResponse {
  publicIp: string;
}

export interface LocalIpResponse {
  localIp: string;
}

/**
 * ====
 * IPFS
 * ====
 */

export type DistributedFileSource = "ipfs" | "swarm";
export interface DistributedFile {
  hash: string;
  source: DistributedFileSource;
  size: number;
}

export interface IpfsRepository {
  ipfsClientTarget: IpfsClientTarget;
  ipfsGateway: string;
}

export enum IpfsClientTarget {
  local = "local",
  remote = "remote"
}

/**
 * ========
 * PACKAGES
 * ========
 */

// From https://nodejs.org/api/os.html#os_os_arch
export type NodeArch =
  | "arm"
  | "arm64"
  | "ia32"
  | "mips"
  | "mipsel"
  | "ppc"
  | "ppc64"
  | "s390"
  | "s390x"
  | "x32"
  | "x64";

interface ManifestImage {
  hash: string;
  size: number;
  path: string;
  volumes?: string[];
  ports?: string[];
  environment?: string[];
  /** FORBIDDEN FEATURE */
  external_vol?: string[];
  restart?: string;
  privileged?: boolean;
  cap_add?: string[];
  cap_drop?: string[];
  devices?: string[];
  subnet?: string;
  ipv4_address?: string;
  network_mode?: string;
  command?: string;
  labels?: string[];
}

// TODO: completely remove this interface and its usage
export interface ManifestWithImage extends Manifest {
  image: ManifestImage;
}

export interface SpecialPermission {
  name: string; // "Short description",
  details: string; // "Long description of the capabilitites"
  serviceName?: string; // Extra data
}

export interface SpecialPermissionAllDnps {
  [dnpName: string]: SpecialPermission[];
}

/**
 * ===================
 * REPOSITORY ETHEREUM
 * ===================
 */

/**
 * DB types
 */

export type EthClientInstallStatus =
  | { status: "TO_INSTALL" }
  | { status: "INSTALLING" }
  | { status: "INSTALLING_ERROR"; error: ErrorSerialized }
  | { status: "INSTALLED" }
  | { status: "UNINSTALLED" };

export type EthClientSyncedNotificationStatus = {
  execClientTarget: string;
  status: "AwaitingSynced" | "Synced";
} | null;

export type Eth2ClientTarget =
  | {
      execClient: string;
      consClient: string;
    }
  | "remote";

/**
 * If the DAPPMANAGER should use a eth remote node in cases of error syncing
 */
export type EthClientFallback = "on" | "off";

export enum EthClientRemote {
  on = "on",
  off = "off"
}

export type EthClientStatus = EthClientStatusOk | EthClientStatusError;

export type EthClientStatusOk =
  // All okay, client is functional
  { ok: true; url: string; dnpName: string };

export type EthClientStatusError =
  // Unexpected error
  | { ok: false; code: "UNKNOWN_ERROR"; error: ErrorSerialized }
  // State is not correct, node is not synced but eth_syncing did not picked it up
  | { ok: false; code: "STATE_NOT_SYNCED" }
  // APM state call failed, syncing call succeeded and is not working
  // = Likely an error related to fetching state content
  | { ok: false; code: "STATE_CALL_ERROR"; error: ErrorSerialized }
  // State call failed and eth_syncing returned true
  | { ok: false; code: "IS_SYNCING" }
  // syncing call failed, but the client is running
  // ???, a connection error?
  | { ok: false; code: "NOT_AVAILABLE"; error: ErrorSerialized }
  // NOT Expected: Package's container is not running
  | { ok: false; code: "NOT_RUNNING" }
  // Package's container does not exist in docker ps -a, and there's no clear reason why
  | { ok: false; code: "NOT_INSTALLED" }
  // Expected: Package is installing or pending to be installed
  | { ok: false; code: "INSTALLING" }
  // Expected: Package is installing but an error happened
  | { ok: false; code: "INSTALLING_ERROR"; error: ErrorSerialized }
  // NOT Expected: Package should be installed but it is not
  | { ok: false; code: "UNINSTALLED" };

/**
 * Serialized errors so the can be persisted in the db, a JSON to disk
 */
export interface ErrorSerialized {
  message: string;
  stack?: string;
}

/**
 * Welcome wizard / setup flow
 * Available routes / views in the UI
 */
export type NewFeatureId =
  | "repository"
  | "repository-fallback"
  | "system-auto-updates"
  | "enable-ethical-metrics"
  | "change-host-password"
  | "enable-notifications";

/**
 * =======
 * HANDLER
 * =======
 */

export interface RpcPayload {
  method: string;
  params: Args;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Args = any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Result = any | void;
export interface LoggerMiddleware {
  onCall?: (route: string, args?: Args) => void;
  onSuccess?: (route: string, result: Result, args?: Args) => void;
  onError?: (route: string, error: Error, args?: Args) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface RpcResponse<R = any> {
  result?: R;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: { code: number; message: string; data?: any };
}

/**
 * ==
 * DB
 * ==
 */

export interface IdentityInterface {
  address: string;
  privateKey: string;
  publicKey: string;
}

/**
 * =====
 * UTILS
 * =====
 */

export type ContainerNames = { serviceName: string; dnpName: string };
