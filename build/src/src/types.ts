export type PortProtocol = "UDP" | "TCP";

export interface PortMapping {
  host?: number;
  container: number;
  protocol: PortProtocol;
  ephemeral?: boolean;
  ip?: string;
}

export interface PackagePort {
  portNumber: number;
  protocol: PortProtocol;
}

export interface VolumeInterface {
  path: string;
  dest: string;
  name?: string;
  users?: string[];
  owner?: string;
  isOwner?: boolean;
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
  ports: PortMapping[];
  volumes: VolumeInterface[];
  state: ContainerStatus;
  running: boolean;
  origin?: string;
  chain?: string;
  dependencies: Dependencies;
  envs?: PackageEnvs;
  manifest?: Manifest;
}

export interface PackageEnvs {
  [envName: string]: string;
}

export interface ManifestUpdateAlert {
  from: string;
  to: string;
  message: string;
}

export interface Manifest {
  name: string;
  version: string;
  isCore?: boolean;
  type: string;
  avatar: string;
  image: {
    hash: string;
    path: string;
    size: number;
    environment?: string[];
    volumes?: string[];
    ports?: string[];
  };
  dependencies: Dependencies;
  updateAlerts?: ManifestUpdateAlert[];
  warnings?: {
    onInstall: string;
    onUpdate: string;
    onReset: string;
    onRemove: string;
  };
  changelog?: string;
  // Aditional property written by DAPPMANAGER
  origin?: string | null;
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
 * Installer types
 */

export interface UserSetPackageEnvs {
  [dnpName: string]: PackageEnvs;
}

export interface UserSetPackageVols {
  [dnpName: string]: {
    [originalVolumeMapping: string]: string;
  };
}

export interface UserSetPackagePorts {
  [dnpName: string]: {
    [originalPortMapping: string]: string;
  };
}

export interface InstallerPkg {
  name: string;
  ver: string;
  manifest: Manifest;
  isCore: boolean;
}

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

/**
 * Releases types
 */

export type FetchLatestVersion = (
  dnpName: string
) => Promise<{
  version: string;
  contentUri: string;
}>;

export interface PackageVersionData {
  version?: string;
  branch?: string;
  commit?: string;
}

/**
 * RPC methods
 */

export interface RpcHandlerReturn {
  message: string;
  result?: any;
  logMessage?: boolean;
  userAction?: boolean;
  privateKwargs?: boolean;
}
