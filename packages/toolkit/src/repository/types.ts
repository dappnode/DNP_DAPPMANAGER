import type { CID } from "kubo-rpc-client";

/**
 * IPFS
 */

/**
 * TODO: the interface IPFSEntry is not properly exported by library ipfs-core-types. If importing it directly then the compiler throws an error. Version: 0.14.0
 */
export interface IPFSEntry {
  readonly type: "dir" | "file";
  readonly cid: CID;
  readonly name: string;
  readonly path: string;
  mode?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mtime?: any;
  size: number;
}

/**
 * APM version
 */

export interface ApmVersionRaw {
  version: string;
  contentUri: string;
}

/**
 * Data fetch from blockchain state. Must exists
 */
export interface ApmVersionState extends ApmVersionRaw {
  version: string;
  versionId: number;
}

export interface ApmVersionRawAndOrigin extends ApmVersionRaw {
  origin?: string;
}

export interface ApmRepoVersionReturn {
  semanticVersion: number[]; // uint16[3]
  contractAddress: string; // address
  contentURI: string; // bytes
}

export interface PackageRequest {
  name: string;
  ver: string;
  req?: string;
}
