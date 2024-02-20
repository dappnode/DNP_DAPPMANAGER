import {
  PackageContainer,
  InstalledPackageData,
  InstallPackageData,
  PackageRelease,
  Compose,
  ReleaseSignatureStatusCode,
} from "@dappnode/types";
import { DappnodeInstaller } from "../src/dappnodeInstaller.js";
import { params } from "@dappnode/params";
import { shell } from "@dappnode/utils";
import { create } from "kubo-rpc-client";
import all from "it-all";
import { AddResult } from "ipfs-core-types/src/root";
import fs from "fs";
import path from "path";

// TODO setup a local ipfs node for these tests

export const ipfs = create({
  url: "https://api.ipfs.dappnode.io",
});

/**
 * Upload multiple files to a directory
 * dir is the first result: https://github.com/ipfs/js-ipfs/blob/master/docs/core-api/FILES.md#ipfsaddallsource-options
 * @param path
 * @returns
 */
export async function ipfsAddAll(dirPath: string): Promise<AddResult[]> {
  if (!fs.existsSync(dirPath))
    throw Error(`ipfsAddAll error: no file found at: ${dirPath}`);
  const files = fs.readdirSync(dirPath).map((file) => {
    return {
      path: path.join(dirPath, file),
      content: fs.readFileSync(path.join(dirPath, file)),
    };
  });
  return all(ipfs.addAll(files));
}

export const dappnodeInstaller = new DappnodeInstaller(
  "https://api.ipfs.dappnode.io",
  `https://mainnet.infura.io/v3/${process.env.INFURA_MAINNET_KEY}`
);

export const testDir = "./test_files/";

// Default file names
export const manifestFileName = "dappnode_package.json";
export const composeFileName = "docker-compose.yml";

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
  manifest: { name: mockDnpName, version: mockDnpVersion },
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

export async function cleanRepos(): Promise<void> {
  await shell(`rm -rf ${params.REPO_DIR} ${params.DNCORE_DIR}/*.yml`);
}
