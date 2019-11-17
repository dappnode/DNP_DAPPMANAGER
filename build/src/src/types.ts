import { SetupSchema, SetupUiJson } from "./types-own";

// Do not re-export variables since it will conflict with DNP_ADMIN's rule of 'isolatedModules'

/**
 * ==============
 * ==============
 * ADMIN
 * ==============
 * ==============
 */

/**
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
export interface DirectoryItem {
  name: string;
  description: string; // = metadata.shortDescription || metadata.description
  avatarUrl: string; // Must be URL to a resource in a DAPPMANAGER API
  isInstalled: boolean; // Show "UPDATE"
  isUpdated: boolean; // Show "UPDATED"
  whitelisted: boolean;
  isFeatured: boolean;
  featuredStyle?: {
    featuredBackground?: string;
    featuredColor?: string;
    featuredAvatarFilter?: string;
  };
  categories: string[];
}

export interface RequestStatus {
  loading?: boolean;
  error?: string;
  success?: boolean;
}

export interface SetupSchemaAllDnps {
  [dnpName: string]: SetupSchema;
}

export interface SetupSchemaAllDnpsFormated {
  type: "object";
  properties: { [dnpName: string]: SetupSchema };
}

export interface SetupUiJsonAllDnps {
  [dnpName: string]: SetupUiJson;
}

export type UserSettingTarget =
  | { type: "environment"; name: string }
  | { type: "portMapping"; containerPort: string }
  | { type: "namedVolumePath"; volumeName: string }
  | { type: "fileUpload"; path: string };

// Settings must include the previous user settings

export interface UserSettings {
  environment?: { [envName: string]: string }; // Env value
  portMappings?: { [containerPortAndType: string]: string }; // Host port
  namedVolumePaths?: { [volumeName: string]: string }; // Host absolute path
  fileUploads?: { [containerPath: string]: string }; // dataURL
}
// "bitcoin.dnp.dappnode.eth": {
//   environment: { MODE: "VALUE_SET_BEFORE" }
//   portMappings: { "8443": "8443"; "8443/udp": "8443" },
//   namedVolumePaths: { data: "" }
//   fileUploads: { "/usr/src/app/config.json": "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D" }
// };
export interface UserSettingsAllDnps {
  [dnpName: string]: UserSettings;
}

export interface DisclaimerAllDnps {
  [dnpName: string]: string;
}

export interface CompatibleDnps {
  [dnpName: string]: { from?: string; to: string };
  // "bitcoin.dnp.dappnode.eth": { from: "0.2.5"; to: "0.2.6" };
  // "ln.dnp.dappnode.eth": { from: null; to: "0.2.2" };
}

export interface RequestedDnp {
  name: string; // "bitcoin.dnp.dappnode.eth"
  reqVersion: string; // origin or semver: "/ipfs/Qm611" | "0.2.3"
  semVersion: string; // Always a semver: "0.2.3"
  origin?: string; // "/ipfs/Qm"
  avatarUrl: string; // "http://dappmanager.dappnode/avatar/Qm7763518d4";
  // Setup
  setupSchema?: SetupSchemaAllDnps;
  setupUiJson?: SetupUiJsonAllDnps;
  settings: UserSettingsAllDnps; // MUST include the previous user settings
  // Additional data
  imageSize: number;
  isUpdated: boolean;
  isInstalled: boolean;
  // Decoupled metadata
  metadata: PackageReleaseMetadata;
  specialPermissions: SpecialPermission[];
  // Request status and dependencies
  request: {
    compatible: {
      requiresCoreUpdate: boolean;
      resolving: boolean;
      isCompatible: boolean; // false;
      error: string; // "LN requires incompatible dependency";
      dnps: CompatibleDnps;
    };
    available: {
      isAvailable: boolean; // false;
      message: string; // "LN image not available";
    };
  };
}

// Installing types

export interface ProgressLogs {
  [dnpName: string]: string;
}

export interface ProgressLogsByDnp {
  [dnpName: string]: ProgressLogs;
}

/**
 * ==============
 * ==============
 * DAPPMANAGER
 * ==============
 * ==============
 */

export type PortProtocol = "UDP" | "TCP";

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

interface BasicVolumeMapping {
  host: string; // path
  container: string; // dest
  name?: string;
}

export interface VolumeMapping extends BasicVolumeMapping {
  users?: string[];
  owner?: string;
  isOwner?: boolean;
  size?: number;
}

export interface Dependencies {
  [dependencyName: string]: string;
}

export type ContainerStatus =
  | "created" // created A container that has been created(e.g.with docker create) but not started
  | "restarting" // restarting A container that is in the process of being restarted
  | "running" // running A currently running container
  | "paused" // paused A container whose processes have been paused
  | "exited" // exited A container that ran and completed("stopped" in other contexts, although a created container is technically also "stopped")
  | "dead"; // dead A container that the daemon tried and failed to stop(usually due to a busy device or resource used by the container)

export interface PackageContainer {
  id: string;
  packageName: string;
  version: string;
  isDnp: boolean;
  isCore: boolean;
  created: number;
  image: string;
  name: string;
  shortName: string;
  state: ContainerStatus;
  running: boolean;
  manifest?: Manifest;
  envs?: PackageEnvs;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  defaultEnvironment: PackageEnvs;
  defaultPorts: PortMapping[];
  defaultVolumes: VolumeMapping[];
  dependencies: Dependencies;
  avatarUrl: string;
  origin?: string;
  chain?: string;
}

export interface PackageEnvs {
  [envName: string]: string;
}

export interface ManifestUpdateAlert {
  from: string;
  to: string;
  message: string;
}

interface ManifestImage {
  hash: string;
  size: number;
  path: string;
  volumes?: string[];
  external_vol?: string[];
  ports?: string[];
  environment?: string[];
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
export interface Manifest extends PackageReleaseMetadata {
  name: string;
  version: string;
  avatar?: string;
}

export interface ManifestWithImage extends Manifest {
  image: ManifestImage;
}

export interface ComposeVolumes {
  // volumeName: "dncore_ethchaindnpdappnodeeth_data"
  [volumeName: string]: {
    external?: {
      name: string; // "dncore_ethchaindnpdappnodeeth_data"
    };
  };
}

interface ComposeServiceBase {
  container_name?: string; // "DAppNodeCore-dappmanager.dnp.dappnode.eth";
  image?: string; // "dappmanager.dnp.dappnode.eth:0.2.6";
  volumes?: string[]; // ["dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo/"];
  ports?: string[];
  environment?: string[];
  labels?: { [labelName: string]: string };
  // env_file: string; IGNORED, Use environment
  // ipv4_address: "172.33.1.7";
  networks?: string[] | { network: { ipv4_address: string } };
  dns?: string; // "172.33.1.2";
  restart?: string; // "always";
  privileged?: boolean;
  cap_add?: string[];
  cap_drop?: string[];
  devices?: string[];
  network_mode?: string;
  command?: string;
}

export interface ComposeServiceUnsafe extends ComposeServiceBase {
  build?:
    | {
        context: string; // ".";
        dockerfile: string; // "./build/Dockerfile";
      }
    | string;
  container_name?: string; // "DAppNodeCore-dappmanager.dnp.dappnode.eth";
  image?: string; // "dappmanager.dnp.dappnode.eth:0.2.6";
}

export interface ComposeService extends ComposeServiceBase {
  container_name: string; // "DAppNodeCore-dappmanager.dnp.dappnode.eth";
  image: string; // "dappmanager.dnp.dappnode.eth:0.2.6";
  env_file?: string[];
  logging: {
    options: {
      "max-size": string; // "10m",
      "max-file": string; // "3"
    };
  };
}

interface ComposeBase {
  version: string; // "3.4"
  networks?: {
    [networkName: string]: {
      external?: boolean;
      driver?: string; // "bridge";
      ipam?: { config: { subnet: string }[] }; // { subnet: "172.33.0.0/16" }
    };
  };
  volumes?: ComposeVolumes; // { dappmanagerdnpdappnodeeth_data: {} };
}

export interface ComposeUnsafe extends ComposeBase {
  // dnpName: "dappmanager.dnp.dappnode.eth"
  services: {
    [dnpName: string]: ComposeServiceUnsafe;
  };
}

export interface Compose extends ComposeBase {
  // dnpName: "dappmanager.dnp.dappnode.eth"
  services: {
    [dnpName: string]: ComposeService;
  };
}

export interface PackagePort {
  portNumber: number;
  protocol: PortProtocol;
}

export interface PackageRequest {
  name: string;
  ver: string;
  req?: string;
}

export interface DappnodeParams {
  DNCORE_DIR: string;
  REPO_DIR: string;
}

export interface PackageBackup {
  name: string;
  path: string;
}

export type NotificationType = "danger" | "warning" | "success";
export interface PackageNotification {
  id: string; // "notification-id"
  type: NotificationType;
  title: string; // "Some notification"
  body: string; // "Some text about notification"
}

export type UpdateType = "major" | "minor" | "patch" | null;

export type DirectoryDnpStatus = "Deleted" | "Active" | "Developing";
export interface DirectoryDnp {
  name: string;
  status: number;
  statusName: DirectoryDnpStatus;
  position: number;
  directoryId: number;
  isFeatured: boolean;
  featuredIndex: number;
  manifest?: Manifest;
  avatar?: string;
}

export interface ChainData {
  name: string; // Ethereum
  syncing: boolean; // if chain is syncing
  error: boolean; // If there was an error retrieving state
  message: string; // "Blocks synced: 543000 / 654000"
  progress?: number; // 0.83027522935
}

export interface ProgressLog {
  id: string; // "ln.dnp.dappnode.eth@/ipfs/Qmabcdf", overall log id(to bundle multiple logs)
  name: string; // "bitcoin.dnp.dappnode.eth", dnpName the log is referring to
  message: string; // "Downloading 75%", log message
  clear?: boolean; // to trigger the UI to clear the all logs of this id
}

export interface UserActionLog {
  level: "info" | "error";
  event: string; // "installPackage.dnp.dappnode.eth"
  message: string; // "Successfully install DNP", { string } Returned message from the call function*
  kwargs: any; // { id: "dnpName" }, { object } RPC key - word arguments
  result?: any; // If success: { data: "contents" }, {*} Returned result from the call function
  stack?: string; // If error: e.stack { string }
}

/**
 * Docker
 */

export interface DockerOptionsInterface {
  timeout?: number;
  timestamps?: boolean;
  volumes?: boolean;
  v?: boolean;
  core?: string;
}

/**
 * Auto-update helper types
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

export interface AutoUpdateDataDnpView {
  id: string;
  displayName: string;
  enabled: boolean;
  feedback: AutoUpdateFeedback;
}

export interface AutoUpdateDataView {
  settings: AutoUpdateSettings;
  registry: AutoUpdateRegistry;
  pending: AutoUpdatePending;
  dnpsToShow: AutoUpdateDataDnpView[];
}

/**
 * Releases types
 */

export interface ApmVersion {
  version: string;
  contentUri: string;
}

export interface PackageVersionData {
  version?: string;
  branch?: string;
  commit?: string;
}

export type DistributedFileSource = "ipfs" | "swarm";
export interface DistributedFile {
  hash: string;
  source: DistributedFileSource;
  size: number;
}

export interface ReleaseWarnings {
  unverifiedCore?: boolean;
}

export interface SpecialPermission {
  name: string; // "Short description",
  details: string; // "Long description of the capabilitites"
}

export interface PackageRelease {
  name: string;
  reqVersion: string; // origin or semver: "/ipfs/Qm611" | "0.2.3"
  semVersion: string; // Always a semver: "0.2.3"
  // File info for downloads
  manifestFile: DistributedFile;
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  // Data for release processing
  metadata: PackageReleaseMetadata;
  compose: Compose;
  // Aditional
  warnings: ReleaseWarnings;
  origin?: string;
  isCore: boolean;
}

export interface InstallPackageData extends PackageRelease {
  // Paths
  imagePath: string;
  composePath: string;
  composeNextPath: string;
  manifestPath: string;
  // Data to write
  compose: Compose;
  // User settings to be applied after running
  fileUploads?: { [containerPath: string]: string };
}

export interface PackageReleaseMetadata {
  name: string;
  version: string;
  upstreamVersion?: string;
  shortDescription?: string;
  description?: string;
  type?: string;
  chain?: string;
  dependencies?: Dependencies;
  runOrder?: string[];
  requirements?: {
    minimumDappnodeVersion: string;
  };
  globalEnvs?: {
    all?: boolean;
  };
  backup?: PackageBackup[];
  changelog?: string;
  warnings?: {
    onInstall?: string;
    onUpdate?: string;
    onReset?: string;
    onRemove?: string;
  };
  updateAlerts?: ManifestUpdateAlert[];
  disclaimer?: {
    message: string;
  };
  style?: {
    featuredBackground?: string;
    featuredColor?: string;
    featuredAvatarFilter?: string;
  };
  setupSchema?: SetupSchema;
  setupUiJson?: SetupUiJson;
  author?: string;
  contributors?: string[];
  categories?: string[];
  keywords?: string[];
  links?: {
    homepage?: string;
    ui?: string;
    api?: string;
    gateway?: string;
  };
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  };
  bugs?: {
    url: string;
  };
  license?: string;
}

export interface PackageReleaseImageData {
  // Mergable properties (editable)
  volumes?: string[];
  ports?: string[];
  environment?: string[];
  // Non-mergable properties
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

/**
 * RPC methods
 * - Generic inteface with metadata types
 * - `WithResult` to type the return value
 * - `Generic` for higher order functions
 * [NOTE]: All are wrapped in a promise before exporting
 */

interface RpcHandlerReturnInterface {
  message: string;
  logMessage?: boolean;
  userAction?: boolean;
}
interface RpcHandlerReturnWithResultInterface<R>
  extends RpcHandlerReturnInterface {
  result: R;
}
interface RpcHandlerReturnGenericInterface extends RpcHandlerReturnInterface {
  result?: any;
}
export type RpcHandlerReturn = Promise<RpcHandlerReturnInterface>;
export type RpcHandlerReturnWithResult<R> = Promise<
  RpcHandlerReturnWithResultInterface<R>
>;
export type RpcHandlerReturnGeneric = Promise<RpcHandlerReturnGenericInterface>;

/**
 * HTTP Response
 */

export interface HttpResponseInterface {
  data: any;
  statusCode: number;
}

export interface IdentityInterface {
  address: string;
  privateKey: string;
  publicKey: string;
}
