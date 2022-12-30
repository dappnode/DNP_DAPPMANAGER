import { ExecutionClientMainnet, ReleaseSignatureProtocol } from "./common";
export * from "./common";

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
