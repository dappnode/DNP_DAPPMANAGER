import {
  Compose,
  GrafanaDashboard,
  Manifest,
  PrometheusTarget,
  ReleaseSignatureStatus,
  ReleaseWarnings,
  SetupWizard,
} from "@dappnode/common";
import { CID } from "kubo-rpc-client";

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
  mtime?: any;
  size: number;
}

/**
 * PKG release assets
 */

export interface FileConfig {
  regex: RegExp;
  format: FileFormat;
  maxSize: number;
  required: boolean;
  multiple: boolean;
}

export interface PkgRelease extends DirectoryFiles {
  dnpName: string;
  reqVersion: string;
  semVersion: string;
  isCore: boolean;
  origin?: string;
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  warnings: ReleaseWarnings;
  /** Release is from safe origin OR has trusted signature */
  signedSafe: boolean;
  signatureStatus: ReleaseSignatureStatus;
}

export type DirectoryFiles = {
  manifest: Manifest;
  compose: Compose;
  setupWizard?: SetupWizard;
  signature?: ReleaseSignature;
  disclaimer?: string;
  gettingStarted?: string;
  prometheusTargets?: PrometheusTarget[];
  grafanaDashboards?: GrafanaDashboard[];
};

export enum FileFormat {
  JSON = "JSON",
  YAML = "YAML",
  TEXT = "TEXT",
}

/** TODO: Add RSA_2048, OpenPGP */
type ReleaseSignatureProtocol = "ECDSA_256";

interface ReleaseSignature {
  /** Version of the ReleaseSignature format */
  version: 1;
  /** Specs of the signed CIDs */
  cid: {
    version: 0 | 1;
    base: "base58btc" | "base32" | "base64" | "base64url";
  };
  signature_protocol: ReleaseSignatureProtocol;
  /**
   * Signature of the serialized files in the directory
   * ```
   * 0x71b61418808a85c495f52bc9c781cbfeb0154c86aec8528c6cf7a83a26a0365f7ac4dea4eea7eea5e4ec14a10e01d8b8708d8c0c7c12420d152a272b69092b851b
   * ```
   */
  signature: string;
}

type DistributedFileSource = "ipfs" | "swarm";

export interface DistributedFile {
  hash: string;
  source: DistributedFileSource;
  size: number;
}

/**
 * APM version
 */

export interface ApmVersionRaw {
  version: string;
  contentUri: string;
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

export interface DappGetState {
  [dnpName: string]: string; // version
}
