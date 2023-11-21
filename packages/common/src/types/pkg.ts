import { Compose } from "./compose.js";
import { GrafanaDashboard, Manifest, PrometheusTarget } from "./manifest.js";

/**
 * IPFS
 */

export interface IpfsDagGetDirectory {
  Name: string;
  Size: number;
  Hash: string;
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

export interface ReleasePkgAssets extends DirectoryFiles {
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
}

export type DirectoryFiles = {
  manifest: Manifest;
  compose: Compose;
  signature?: ReleaseSignatureWithData;
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

type ReleaseSignatureWithData = {
  signature: ReleaseSignature;
  signedData: string;
};

type DistributedFileSource = "ipfs" | "swarm";

interface DistributedFile {
  hash: string;
  source: DistributedFileSource;
  size: number;
}

/**
 * APM version
 */

export interface PackageRequest {
  name: string;
  ver: string;
  req?: string;
}

export interface DappGetState {
  [dnpName: string]: string; // version
}
