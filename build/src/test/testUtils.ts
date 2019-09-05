import shell from "../src/utils/shell";
import * as path from "path";
import {
  PackageContainer,
  Manifest,
  VolumeInterface
} from "../src/types";

export const testDir = "./test_files/";

export function ignoreErrors(fn: (...args: any[]) => any) {
  return async function(...args: any[]) {
    try {
      return await fn(...args);
    } catch (e) {
      // Ignore
    }
  };
}

export async function cleanTestDir() {
  await shell(`rm -rf ${testDir}`);
}
export async function createTestDir() {
  await cleanTestDir();
  await shell(`mkdir -p ${testDir}`);
}

export async function createDirP(filePath: string) {
  await shell(`mkdir -p ${path.parse(filePath).dir}`);
}

/**
 * Helper types
 */

export type CallbackFunction = (err: Error | null, res: any | null) => void;

/**
 * Mock data
 */

export const mockDnp: PackageContainer = {
  id: "17628371823",
  packageName: "mock-dnp.dnp.dappnode.eth",
  version: "0.0.0",
  isDnp: true,
  isCore: false,
  created: 1573712712,
  image: "mock-image",
  name: "mock-name",
  shortName: "mock-shortname",
  ports: [],
  volumes: [],
  state: "running",
  running: true,
  origin: "",
  chain: "",
  dependencies: {}
};

export const mockManifest: Manifest = {
  name: "mock-dnp.dnp.dappnode.eth",
  version: "0.0.0",
  type: "service",
  avatar: "/ipfs/QmMOCKMOCKMOCKMOCK",
  image: {
    hash: "/ipfs/QmMOCKMOCKMOCKMOCK",
    path: "mock/mock/mock.mock",
    size: 111111111
  },
  dependencies: {}
};

export const mockVolume: VolumeInterface = {
  path: "mock/mock/mock",
  dest: "mock/mock/mock"
};
