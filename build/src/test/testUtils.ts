import shell from "../src/utils/shell";
import * as path from "path";
import {
  PackageContainer,
  Manifest,
  VolumeMapping,
  DirectoryDnp,
  PortMapping,
  PackageRelease,
  Compose,
  ManifestWithImage
} from "../src/types";
import { DockerApiSystemDfReturn } from "../src/modules/docker/dockerApi";

export const testDir = "./test_files/";

export function ignoreErrors<A, R>(fn: (arg: A) => R) {
  return async function(arg: A): Promise<R | undefined> {
    try {
      return await fn(arg);
    } catch (e) {
      // Ignore
    }
  };
}

export async function cleanTestDir(): Promise<void> {
  await shell(`rm -rf ${testDir}`);
}
export async function createTestDir(): Promise<void> {
  await cleanTestDir();
  await shell(`mkdir -p ${testDir}`);
}

export async function createDirP(filePath: string): Promise<void> {
  await shell(`mkdir -p ${path.parse(filePath).dir}`);
}

/**
 * Mock data
 */

const mockDnpName = "mock-dnp.dnp.dappnode.eth";
const mockDnpVersion = "0.0.0";
export const mockSize = 1111111;
export const mockHash = "/ipfs/QmWkAVYJhpwqApRfK4SZ6e2Xt2Daamc8uBpM1oMLmQ6fw4";

export const mockDnp: PackageContainer = {
  id: "17628371823",
  packageName: mockDnpName,
  version: "0.0.0",
  isDnp: true,
  isCore: false,
  created: 1573712712,
  image: "mock-image",
  name: "mock-name",
  shortName: "mock-shortname",
  state: "running",
  running: true,
  origin: "",
  chain: "",
  dependencies: {},
  envs: {},
  ports: [],
  volumes: [],
  defaultEnvironment: {},
  defaultPorts: [],
  defaultVolumes: []
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

export const mockPort: PortMapping = {
  container: 1111,
  protocol: "TCP"
};

export const mockDockerSystemDfDataSample: DockerApiSystemDfReturn = {
  LayersSize: 101010101,
  Images: [
    {
      Id:
        "sha256:2b8fd9751c4c0f5dd266fcae00707e67a2545ef34f9a29354585f93dac906749",
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
      }
    }
  ],
  Volumes: [
    {
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

export const mockDirectoryDnp: DirectoryDnp = {
  name: mockDnpName,
  status: 1,
  statusName: "Active",
  position: 1000,
  directoryId: 2,
  isFeatured: true,
  featuredIndex: 0
};

export const mockCompose: Compose = {
  version: "3.4",
  services: {
    [mockDnpName]: {
      image: `${mockDnpName}:${mockDnpVersion}`,
      /* eslint-disable-next-line @typescript-eslint/camelcase */
      container_name: `DAppNodePackage-${mockDnpName}`
    }
  }
};

export const mockRelease: PackageRelease = {
  name: mockDnpName,
  version: mockDnpVersion,
  manifestFile: { hash: mockHash, size: mockSize, source: "ipfs" },
  imageFile: { hash: mockHash, size: mockSize, source: "ipfs" },
  avatarFile: { hash: mockHash, size: mockSize, source: "ipfs" },
  metadata: { name: mockDnpName, version: mockDnpVersion },
  compose: mockCompose,
  origin: null,
  isCore: false
};
