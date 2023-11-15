import { PackageContainer, InstalledPackageData } from "@dappnode/common";

export const mockDnpName = "mock-dnp.dnp.dappnode.eth";
export const mockDnpVersion = "0.0.0";
export const mockSize = 1111111;
export const mockHash = "/ipfs/QmWkAVYJhpwqApRfK4SZ6e2Xt2Daamc8uBpM1oMLmQ6fw4";

export const mockContainer: PackageContainer = {
  containerId: "17628371823",
  containerName: `DAppNodePackage-${mockDnpName}`,
  dnpName: mockDnpName,
  serviceName: mockDnpName,
  instanceName: "",
  version: "0.0.0",
  isDnp: true,
  isCore: false,
  created: 1573712712,
  image: "mock-image",
  state: "running",
  running: true,
  exitCode: null,
  ports: [],
  volumes: [],
  networks: [],
  defaultEnvironment: {},
  defaultPorts: [],
  defaultVolumes: [],
  dependencies: {},
  origin: "",
  avatarUrl: "",
};

export const mockDnp: InstalledPackageData = {
  dnpName: mockDnpName,
  instanceName: "",
  version: "0.0.0",
  isDnp: true,
  isCore: false,
  dependencies: {},
  origin: "",
  avatarUrl: "",
  containers: [mockContainer],
};
