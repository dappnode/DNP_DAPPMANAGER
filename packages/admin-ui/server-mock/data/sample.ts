import {
  DirectoryItem,
  RequestedDnp,
  InstalledPackageDetailData
} from "../../src/common";

export const sampleRequestState: RequestedDnp = {
  name: "demo-name",
  semVersion: "0.0.0",
  reqVersion: "0.0.0",
  avatarUrl: "",
  metadata: { name: "demo-name", version: "0.0.0", description: "demo" },
  specialPermissions: {},
  imageSize: 10000000,
  isUpdated: false,
  isInstalled: true,
  settings: {},
  setupWizard: {},

  request: {
    compatible: {
      requiresCoreUpdate: false,
      resolving: false,
      isCompatible: true,
      error: "",
      dnps: { "demo-name": { to: "0.0.0" } }
    },
    available: { isAvailable: true, message: "" }
  }
};

export const sampleDirectoryState: DirectoryItem = {
  status: "ok",
  name: "demo-name",
  description: "Demo description",
  avatarUrl: "",
  isInstalled: false,
  isUpdated: false,
  whitelisted: true,
  isFeatured: false,
  categories: ["Blockchain"]
};

export const samplePackageContainer: InstalledPackageDetailData = {
  id: "7s51a",
  packageName: "demo-name",
  version: "0.0.0",
  isDnp: true,
  isCore: false,
  created: 12316723123,
  image: "demo-name:0.0.0",
  name: "demo-name",
  shortName: "demo-name",
  state: "running",
  running: true,
  ip: "172.10.0.1",
  dependencies: {},
  ports: [],
  volumes: [],
  avatarUrl: "http://ipfs.dappnode:8080/ipfs/Qm",
  origin: undefined,
  gettingStarted: "",
  gettingStartedShow: true,
  areThereVolumesToRemove: false,
  volumeUsersToRemove: [],
  dependantsOf: [],
  namedExternalVols: []
};
