import path from "path";
import fs from "fs";
import shell from "../src/utils/shell";
import { clearCacheDb, clearMainDb } from "../src/db";
import { ManifestWithImage } from "../src/types";
import { DockerApiSystemDfReturn } from "../src/modules/docker/api";
import params from "../src/params";
import { Compose, Manifest } from "@dappnode/dappnodesdk";
import {
  PackageContainer,
  InstalledPackageData,
  VolumeMapping,
  PackageRelease,
  ReleaseSignatureStatusCode,
  InstallPackageData
} from "@dappnode/common";

export const testDir = "./test_files/";
const testMountpoint = "./test_mountpoints";

// Default file names
export const manifestFileName = "dappnode_package.json";
export const composeFileName = "docker-compose.yml";

export const beforeAndAfter = (
  ...args: Parameters<Mocha.HookFunction>
): void => {
  before(...args);
  after(...args);
};

export const getTestMountpoint = (id: string): string => {
  const mountpointPath = path.join(testMountpoint, id);
  fs.mkdirSync(mountpointPath, { recursive: true });
  return mountpointPath;
};

export function clearDbs(): void {
  clearCacheDb();
  clearMainDb();
}

function ignoreErrors<A, R>(fn: (arg: A) => R) {
  return async function (arg: A): Promise<R | undefined> {
    try {
      return await fn(arg);
    } catch (e) {
      // Ignore
    }
  };
}

export const shellSafe = ignoreErrors(shell);

export async function cleanTestDir(): Promise<void> {
  await shell(`rm -rf ${testDir}`);
}
export async function createTestDir(): Promise<void> {
  await cleanTestDir();
  await shell(`mkdir -p ${testDir}`);
}

export async function cleanRepos(): Promise<void> {
  await shell(`rm -rf ${params.REPO_DIR} ${params.DNCORE_DIR}/*.yml`);
}

export async function cleanContainers(
  ...containerIds: string[]
): Promise<void> {
  for (const containerId of containerIds) {
    // Clean containers
    await shellSafe(
      `docker rm -f -v $(docker ps -aq --filter name=${containerId})`
    );
    // Clean associated volumes
    const volumePrefix = containerId;
    await shellSafe(
      `docker volume rm -f $(docker volume ls --filter name=${volumePrefix} -q)`
    );
  }
}

/**
 * Mock data
 */

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
  avatarUrl: ""
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
  containers: [mockContainer]
};

export const mockManifest: Manifest = {
  name: mockDnpName,
  version: "0.0.0",
  description: "Mock description",
  type: "service",
  avatar: mockHash,
  dependencies: {},
  license: "Mock-license"
};

export const mockManifestWithImage: ManifestWithImage = {
  ...mockManifest,
  image: {
    hash: mockHash,
    path: "mock/mock/mock.mock",
    size: mockSize
  }
};

export const mockVolume: VolumeMapping = {
  host: "mock/mock/mock",
  container: "mock/mock/mock"
};

export const mockDockerSystemDfDataSample: DockerApiSystemDfReturn = {
  LayersSize: 101010101,
  Images: [
    {
      Id: "sha256:2b8fd9751c4c0f5dd266fcae00707e67a2545ef34f9a29354585f93dac906749",
      ParentId: "",
      RepoTags: ["busybox:latest"],
      RepoDigests: [
        "busybox@sha256:a59906e33509d14c036c8678d687bd4eec81ed7c4b8ce907b888c607f6a1e0e6"
      ],
      Created: 1466724217,
      Size: 101010101,
      SharedSize: 0,
      VirtualSize: 101010101,
      Labels: {},
      Containers: 1
    }
  ],
  Containers: [
    {
      Id: "e575172ed11dc01bfce087fb27bee502db149e1a0fad7c296ad300bbff178148",
      Names: ["/top"],
      Image: "busybox",
      ImageID:
        "sha256:2b8fd9751c4c0f5dd266fcae00707e67a2545ef34f9a29354585f93dac906749",
      Command: "top",
      Created: 1472592424,
      SizeRootFs: 101010101,
      Labels: {},
      State: "exited",
      Status: "Exited (0) 56 minutes ago",
      HostConfig: {
        NetworkMode: "default"
      },
      NetworkSettings: {
        Networks: {
          bridge: {
            IPAMConfig: null,
            Links: null,
            Aliases: null,
            NetworkID:
              "d687bc59335f0e5c9ee8193e5612e8aee000c8c62ea170cfb99c098f95899d92",
            EndpointID:
              "8ed5115aeaad9abb174f68dcf135b49f11daf597678315231a32ca28441dec6a",
            Gateway: "172.18.0.1",
            IPAddress: "172.18.0.2",
            IPPrefixLen: 16,
            IPv6Gateway: "",
            GlobalIPv6Address: "",
            GlobalIPv6PrefixLen: 0,
            MacAddress: "02:42:ac:12:00:02"
          }
        }
      },
      Mounts: []
    }
  ],
  Volumes: [
    {
      CreatedAt: "2019-12-19T16:24:21+01:00",
      Name: "mock_mockdnpeth_data",
      Driver: "local",
      Mountpoint: "/var/lib/docker/volumes/my-volume/_data",
      Labels: null,
      Scope: "local",
      Options: null,
      UsageData: {
        Size: 1111111111,
        RefCount: 2
      }
    }
  ]
};

export const mockCompose: Compose = {
  version: "3.5",
  services: {
    [mockDnpName]: {
      image: `${mockDnpName}:${mockDnpVersion}`,
      container_name: `DAppNodePackage-${mockDnpName}`
    }
  }
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
  signatureStatus: { status: ReleaseSignatureStatusCode.notSigned }
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
  containersStatus: {}
};

// For copyFileTo and copyFileFrom
export const sampleFile = {
  dataUri:
    "data:application/json;base64,ewogICJuYW1lIjogInRlc3QiLAogICJ2ZXJzaW9uIjogIjEuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiIiwKICAibWFpbiI6ICJpbmRleC5qcyIsCiAgInNjcmlwdHMiOiB7CiAgICAidGVzdCI6ICJlY2hvIFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXCIgJiYgZXhpdCAxIgogIH0sCiAgImtleXdvcmRzIjogW10sCiAgImF1dGhvciI6ICIiLAogICJsaWNlbnNlIjogIklTQyIsCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJldGhlcnMiOiAiXjQuMC4yMyIsCiAgICAibHotc3RyaW5nIjogIl4xLjQuNCIsCiAgICAicXJjb2RlLXRlcm1pbmFsIjogIl4wLjEyLjAiLAogICAgIndlYjMiOiAiXjEuMC4wLWJldGEuMzciCiAgfQp9Cg==",
  filename: "config.json",
  // Use a flat path to make sure it's base directory exists
  containerPath: "/config.json"
};
