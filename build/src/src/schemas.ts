import {
  DirectoryItem,
  PackageContainer,
  AutoUpdateDataView,
  ChainData,
  ProgressLog,
  PackageNotification,
  UserActionLog
} from "./types";

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
    required: [
      "name",
      "description",
      "isInstalled",
      "isUpdated",
      "whitelisted",
      "isFeatured",
      "categories"
    ]
  }
};

export const directoryDnpSample: DirectoryItem = {
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
  required: ["level", "event", "message"]
};

export const userActionLogsSample: UserActionLog = {
  level: "error",
  event: "do.dappmanager.dnp.eth",
  message: "Danger",
  kwargs: { do: "this" },
  result: { data: "content" },
  stack: "Danger\n  at a.ts:152:25"
};
