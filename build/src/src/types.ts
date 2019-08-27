export type PortProtocol = "UDP" | "TCP";

export interface PortMapping {
  host?: number;
  container: number;
  protocol: PortProtocol;
  ephemeral?: boolean;
  ip?: string;
}

export interface PortInterface {
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

export interface DependenciesInterface {
  [dependencyName: string]: string;
}

export type ContainerStatus =
  | "created" // created A container that has been created(e.g.with docker create) but not started
  | "restarting" // restarting A container that is in the process of being restarted
  | "running" // running A currently running container
  | "paused" // paused A container whose processes have been paused
  | "exited" // exited A container that ran and completed("stopped" in other contexts, although a created container is technically also "stopped")
  | "dead"; // dead A container that the daemon tried and failed to stop(usually due to a busy device or resource used by the container)

export interface ContainerInterface {
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
  origin: string | null;
  chain: string | null;
  dependencies: DependenciesInterface;
  envs?: EnvsInterface;
  manifest?: ManifestInterface;
}

export interface EnvsInterface {
  [envName: string]: string;
}

export interface ManifestInterface {
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
  dependencies: DependenciesInterface;
  updateAlerts?: {
    from: string;
    to: string;
    message: string;
  }[];
  warnings?: {
    onInstall: string;
    onUpdate: string;
    onReset: string;
    onRemove: string;
  };
  changelog?: string;
}

export interface PortInterface {
  portNumber: number;
  protocol: PortProtocol;
}

export interface RequestInterface {
  name: string;
  ver: string;
}

export interface ParamsInterface {
  DNCORE_DIR: string;
  REPO_DIR: string;
}

export interface BackupInterface {
  name: string;
  path: string;
}

export type NotificationType = "danger" | "warning" | "success";
export interface NotificationInterface {
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
  manifest?: ManifestInterface;
  avatar?: string;
}

export interface ChainDataInterface {
  name: string; // Ethereum
  syncing: boolean; // if chain is syncing
  error: boolean; // If there was an error retrieving state
  message: string; // "Blocks synced: 543000 / 654000"
  progress?: number; // 0.83027522935
}

export interface ProgressLogInterface {
  id: string; // "ln.dnp.dappnode.eth@/ipfs/Qmabcdf", overall log id(to bundle multiple logs)
  name: string; // "bitcoin.dnp.dappnode.eth", dnpName the log is referring to
  message: string; // "Downloading 75%", log message
  clear?: boolean; // to trigger the UI to clear the all logs of this id
}

export interface UserActionLogInterface {
  level: "info" | "error";
  event: string; // "installPackage.dnp.dappnode.eth"
  message: string; // "Successfully install DNP", { string } Returned message from the call function*
  kwargs: any; // { id: "dnpName" }, { object } RPC key - word arguments
  result?: any; // If success: { data: "contents" }, {*} Returned result from the call function
  stack?: string; // If error: e.stack { string }
}

export type CrossbarHandler = () => {
  result?: any;
};

/**
 * Installer types
 */

export interface UserSetEnvsInterface {
  [dnpName: string]: EnvsInterface;
}

export interface UserSetVolsInterface {
  [dnpName: string]: {
    [originalVolumeMapping: string]: string;
  };
}

export interface UserSetPortsInterface {
  [dnpName: string]: {
    [originalPortMapping: string]: string;
  };
}

export interface InstallerPkgInterface {
  name: string;
  ver: string;
  manifest: ManifestInterface;
  isCore: boolean;
}

/**
 * Auto-update helper types
 */

export interface SettingsInterface {
  [dnpNameOrGroupId: string]: { enabled: boolean };
}

export interface RegistryEntryInterface {
  updated?: number;
  successful?: boolean;
}
export interface RegistryDnpInterface {
  [version: string]: RegistryEntryInterface;
}
export interface RegistryInterface {
  [dnpName: string]: RegistryDnpInterface;
}

export interface PendingEntryInterface {
  version?: string;
  firstSeen?: number;
  scheduledUpdate?: number;
  completedDelay?: boolean;
  errorMessage?: string;
}
export interface PendingInterface {
  [dnpName: string]: PendingEntryInterface;
}
