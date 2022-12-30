import { ChainDriver, Dependencies, Manifest } from "@dappnode/dappnodesdk";
import {
  ExecutionClientMainnet,
  ReleaseSignatureProtocol
} from "@dappnode/common";

export enum FileFormat {
  JSON = "JSON",
  YAML = "YAML",
  TEXT = "TEXT"
}

export interface ContainerLabelsRaw {
  [labelId: string]: string;
}

export interface IpfsFileResult {
  name: string; // 'avatar.png',
  path: string; // 'QmR7ALYdVQCSfdob9tzE8mvPn3KJk653maMqLeqMo7eeTg/avatar.png',
  size: number; // 9305,
  hash: string; // 'QmRFfqN93JN5hDfqWhxaY6M16dafS6t9qzRCAKzzNT9ved',
}

// From https://nodejs.org/api/os.html#os_os_arch
export type NodeArch =
  | "arm"
  | "arm64"
  | "ia32"
  | "mips"
  | "mipsel"
  | "ppc"
  | "ppc64"
  | "s390"
  | "s390x"
  | "x32"
  | "x64";

export type EthClientSyncedNotificationStatus = {
  execClientTarget: ExecutionClientMainnet;
  status: "AwaitingSynced" | "Synced";
} | null;

export interface RegistryNewRepoEvent {
  txHash: string;
  ensName: string;
  timestamp: number;
}

export interface ComposeServicesSharingPid {
  targetPidServices: string[];
  dependantPidServices: string[];
}

export interface ReleaseSignature {
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

/**
 * Type mapping of a package container labels
 * NOTE: Treat as unsafe input, labels may not exist or have wrong formatting
 */
export interface ContainerLabelTypes {
  "dappnode.dnp.dnpName": string;
  "dappnode.dnp.version": string;
  "dappnode.dnp.serviceName": string;
  "dappnode.dnp.instanceName": string;
  "dappnode.dnp.dependencies": Dependencies;
  "dappnode.dnp.avatar": string;
  "dappnode.dnp.origin": string;
  "dappnode.dnp.chain": ChainDriver;
  "dappnode.dnp.isCore": boolean;
  "dappnode.dnp.isMain": boolean;
  "dappnode.dnp.dockerTimeout": number;
  "dappnode.dnp.default.environment": string[];
  "dappnode.dnp.default.ports": string[];
  "dappnode.dnp.default.volumes": string[];
}

interface ManifestImage {
  hash: string;
  size: number;
  path: string;
  volumes?: string[];
  ports?: string[];
  environment?: string[];
  /** FORBIDDEN FEATURE */
  external_vol?: string[];
  restart?: string;
  privileged?: boolean;
  cap_add?: string[];
  cap_drop?: string[];
  devices?: string[];
  subnet?: string;
  ipv4_address?: string;
  network_mode?: string;
  command?: string;
  labels?: string[];
}

export interface ManifestWithImage extends Manifest {
  image: ManifestImage;
}

export interface PackageRequest {
  name: string;
  ver: string;
  req?: string;
}

export interface ApmVersion {
  version: string;
  contentUri: string;
}

export interface IdentityInterface {
  address: string;
  privateKey: string;
  publicKey: string;
}
