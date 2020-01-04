import {
  DirectoryItem,
  PackageContainer,
  AutoUpdateDataView,
  ChainData,
  ProgressLog,
  PackageNotification,
  UserActionLog,
  CoreUpdateData,
  MountpointData,
  PackageDetailData,
  VolumeData
} from "./types";

/**
 * GENERIC TYPES
 *
 * Manifest
 */

export const manifestSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    version: { type: "string" }
  },
  required: ["name", "version"]
};

export const manifestSample = {
  name: "name",
  version: "0.2.0"
};

/**
 * Auto update data
 */

export const autoUpdateDataViewSchema = {
  type: "object",
  properties: {}
};

export const autoUpdateDataViewSample: AutoUpdateDataView = {
  settings: {},
  registry: {},
  pending: {},
  dnpsToShow: []
};

/**
 * Chain data
 */

export const chainsDataSchema = {
  type: "array",
  title: "chainsData",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      syncing: { type: "boolean" },
      error: { type: "boolean" },
      message: { type: "string" },
      progress: { type: "number" }
    },
    required: ["name", "message"]
  }
};

export const chainsDataSample: ChainData[] = [
  {
    name: "chain",
    syncing: true,
    error: false,
    message: "Block 4/8",
    progress: 0.34
  }
];

/**
 * Directory DNPs. Used in UI at /installer
 */

export const directoryDnpsSchema = {
  type: "array",
  title: "directoryDnps",
  items: {
    type: "object",
    properties: {
      status: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      avatarUrl: { type: "string" },
      isInstalled: { type: "boolean" },
      isUpdated: { type: "boolean" },
      whitelisted: { type: "boolean" },
      isFeatured: { type: "boolean" },
      featuredStyle: { type: "object" },
      categories: { type: "array", items: { type: "string" } }
    },
    required: ["status", "name"]
  }
};

export const directoryDnpSample: DirectoryItem = {
  status: "ok",
  name: "name",
  description: "desc",
  avatarUrl: "http://",
  isInstalled: true,
  isUpdated: false,
  whitelisted: true,
  isFeatured: true,
  featuredStyle: {
    featuredBackground: "#fff",
    featuredColor: "#fff",
    featuredAvatarFilter: "invert(1)"
  },
  categories: ["Developer Tools"]
};

export const directoryDnpsSample: DirectoryItem[] = [directoryDnpSample];

/**
 * For fetch core update data
 */

export const coreUpdateDataSchema = {
  title: "coreUpdateData",
  type: "object",
  properties: {
    available: { type: "boolean" },
    type: { type: "string" },
    packages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          from: { type: "string" },
          to: { type: "string" },
          warningOnInstall: { type: "string" }
        },
        required: ["name", "to"]
      }
    },
    changelog: { type: "string" },
    updateAlerts: { type: "array" },
    versionId: { type: "string" }
  },
  required: ["available"]
};

// Samples for testing

export const coreUpdateDataSample: CoreUpdateData = {
  available: true,
  type: "patch",
  packages: [
    {
      name: "admin.dnp.dappnode.eth",
      from: "0.2.0",
      to: "0.2.1",
      warningOnInstall: "Warning!"
    }
  ],
  changelog: "Admin changelog",
  updateAlerts: [],
  versionId: "admin@0.2.1"
};

/**
 * Installed DNPs. Use in UI at /packages, /packages/:id,
 * multiple places in logic to know the status of installed packages
 */
export const installedDnpsSchema = {
  type: "array",
  title: "installedDnp",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      version: { type: "string" }
    },
    required: ["name", "version"]
  }
};

export const installedDnpSample: PackageContainer = {
  id: "83f",
  packageName: "DAppNodePackage-name",
  version: "0.2.0",
  isDnp: true,
  isCore: false,
  created: 1527181273,
  image: "name:0.2.0",
  name: "name",
  shortName: "name",
  state: "running",
  running: true,
  chain: "ethereum",
  dependencies: {},
  envs: {},
  ports: [],
  volumes: [],
  defaultEnvironment: {},
  defaultPorts: [],
  defaultVolumes: [],
  avatarUrl: "http://"
};

export const installedDnpsSample: PackageContainer[] = [installedDnpSample];

export const packageDetailDataSchema = {
  type: "object",
  properties: {
    volumes: { type: "object" }
  },
  required: ["volumes"]
};

export const packageDetailDataSample: PackageDetailData = {
  volumes: {
    data: {
      size: "6371825123", // volumeName: sizeInBytes
      devicePath: "/dev1/data/dappnode-volumes/bitcoin.dnp.dappnode.eth/data",
      mountpoint: "/dev1/data"
    }
  }
};

/**
 * Notifications
 */

export const packageNotificationSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    type: { type: "string" },
    title: { type: "string" },
    body: { type: "string" }
  },
  required: ["id", "type", "title"]
};

export const packageNotificationSample: PackageNotification = {
  id: "notification-id",
  type: "danger",
  title: "Danger!",
  body: "This happened"
};

/**
 * Mountpoints
 */

export const mountpointsDataSchema = {
  type: "array",
  title: "mountpointsData",
  items: {
    type: "object",
    properties: {
      mountpoint: { type: "string" },
      use: { type: "string" },
      used: { type: "number" },
      total: { type: "number" },
      free: { type: "number" },
      vendor: { type: "string" },
      model: { type: "string" }
    },
    required: ["mountpoint"]
  }
};

export const mountpointsDataSample: MountpointData[] = [
  {
    mountpoint: "/media/usb0",
    use: "89%",
    used: 198642520,
    total: 235782040,
    free: 25092776,
    vendor: "ATA",
    model: "CT500MX500SSD4"
  }
];

/**
 * Dangling volumes
 */

export const volumeDataSchema = {
  type: "array",
  title: "volumeData",
  items: {
    type: "object",
    properties: {
      mountpoint: { type: "string" },
      use: { type: "string" },
      total: { type: "string" },
      free: { type: "string" },
      vendor: { type: "string" },
      model: { type: "string" }
    },
    required: ["name"]
  }
};

export const volumesDataSample: VolumeData[] = [
  {
    name: "gethdnpdappnodeeth_data",
    shortName: "data",
    owner: "gethdnpdappnodeeth",
    createdAt: 1569346006000,
    mountpoint: "/dev1/data/",
    size: 161254123,
    refCount: 0,
    isDangling: true
  }
];

/**
 * Progress logs. Use in UI /installer/:id to provide feedback during installation
 */

export const progressLogSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    message: { type: "string" }
  },
  required: ["id"]
};

export const progressLogSample: ProgressLog = {
  id: "dnp.eth",
  name: "dep.eth",
  message: "DLing 34%"
};

/**
 * User action logs. Use in UI /activity
 */

export const userActionLogsSchema = {
  type: "object",
  properties: {
    level: { type: "string" },
    event: { type: "string" },
    message: { type: "string" }
  },
  // VPN still sends logs without message (legacy compatibility)
  required: ["level", "event"]
};

export const userActionLogsSample: UserActionLog = {
  level: "error",
  event: "do.dappmanager.dnp.eth",
  message: "Danger",
  kwargs: { do: "this" },
  result: { data: "content" },
  stack: "Danger\n  at a.ts:152:25"
};
