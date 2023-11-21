import {
  PackageContainer,
  InstalledPackageData,
  InstallPackageData,
  PackageRelease,
  Compose,
  ReleaseSignatureStatusCode,
} from "@dappnode/common";

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

export const mockCompose: Compose = {
  version: "3.5",
  services: {
    [mockDnpName]: {
      image: `${mockDnpName}:${mockDnpVersion}`,
      container_name: `DAppNodePackage-${mockDnpName}`,
    },
  },
};

export const mockRelease: PackageRelease = {
  dnpName: mockDnpName,
  reqVersion: mockDnpVersion,
  semVersion: mockDnpVersion,
  imageFile: { hash: mockHash, size: mockSize, source: "ipfs" },
  avatarFile: { hash: mockHash, size: mockSize, source: "ipfs" },
  metadata: { name: mockDnpName, version: mockDnpVersion },
  compose: mockCompose,
  warnings: {},
  isCore: false,
  signedSafe: true,
  signatureStatus: { status: ReleaseSignatureStatusCode.notSigned },
};

export const mockPackageData: InstallPackageData = {
  ...mockRelease,
  isUpdate: true,
  imagePath: "mock/path/image",
  composePath: "mock/path/compose",
  composeBackupPath: "mock/path/compose.backup.yml",
  manifestPath: "mock/path/manifest.json",
  manifestBackupPath: "mock/path/manifest.backup.json",
  dockerTimeout: undefined,
  containersStatus: {},
};
