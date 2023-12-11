import { Compose } from "./compose.js";
import { GrafanaDashboard, Manifest, PrometheusTarget } from "./manifest.js";
import { SetupWizard } from "./setupWizard.js";

/**
 * IPFS
 */

export interface IpfsDagGetDirectory {
  Name: string;
  Size: number;
  Hash: string;
}

/**
 * =========
 * CONTAINER
 * =========
 */

export type ContainerState =
  | "created" // created A container that has been created(e.g.with docker create) but not started
  | "restarting" // restarting A container that is in the process of being restarted
  | "running" // running A currently running container
  | "paused" // paused A container whose processes have been paused
  | "exited" // exited A container that ran and completed("stopped" in other contexts, although a created container is technically also "stopped")
  | "dead" // dead A container that the daemon tried and failed to stop(usually due to a busy device or resource used by the container)
  | "removing"; // removing A container that is in the process of being removed

export interface ContainerStatus {
  targetStatus: "stopped" | "running";
  dockerTimeout: number | undefined;
}

export interface ContainersStatus {
  [serviceName: string]: ContainerStatus;
}

/**
 * PKG release assets
 */

export type InstallPackageDataPaths = Pick<
  InstallPackageData,
  | "dnpName"
  | "semVersion"
  | "composePath"
  | "composeBackupPath"
  | "manifestPath"
  | "manifestBackupPath"
  | "imagePath"
  | "isUpdate"
  | "dockerTimeout"
  | "containersStatus"
>;

export interface InstallPackageData extends PackageRelease {
  isUpdate: boolean;
  // Paths
  imagePath: string;
  composePath: string;
  composeBackupPath: string;
  manifestPath: string;
  manifestBackupPath: string;
  // Data to write
  compose: Compose;
  // User settings to be applied after running
  fileUploads?: { [serviceName: string]: { [containerPath: string]: string } };
  dockerTimeout: number | undefined;
  containersStatus: ContainersStatus;
}

export interface ReleaseWarnings {
  /**
   * If a core package does not come from the DAppNode Package APM registry
   */
  coreFromForeignRegistry?: boolean;
  /**
   * If the requested name does not match the manifest name
   */
  requestNameMismatch?: boolean;
}

export interface PackageRelease extends DirectoryFiles {
  dnpName: string;
  reqVersion: string; // origin or semver: "/ipfs/Qm611" | "0.2.3"
  semVersion: string; // Always a semver: "0.2.3"
  // File info for downloads
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  // Data for release processing extracted from DirectoryFiles
  // Aditional
  warnings: ReleaseWarnings;
  isCore: boolean;
  origin?: string;
  /** Release is from safe origin OR has trusted signature */
  signedSafe: boolean;
  signatureStatus: ReleaseSignatureStatus;
}

export type DirectoryFiles = {
  manifest: Manifest;
  compose: Compose;
  signature?: ReleaseSignature;
  setupWizard?: SetupWizard;
  disclaimer?: string;
  gettingStarted?: string;
  prometheusTargets?: PrometheusTarget[];
  grafanaDashboards?: GrafanaDashboard[];
};

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

export enum FileFormat {
  JSON = "JSON",
  YAML = "YAML",
  TEXT = "TEXT",
}

/**
 * ==========
 * SIGNATURES
 * ==========
 */

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

export enum ReleaseSignatureStatusCode {
  notSigned = "notSigned",
  signedByKnownKey = "signedByKnownKey",
  signedByUnknownKey = "signedByUnknownKey",
}

export type ReleaseSignatureStatus =
  | { status: ReleaseSignatureStatusCode.notSigned }
  | { status: ReleaseSignatureStatusCode.signedByKnownKey; keyName: string }
  | {
      status: ReleaseSignatureStatusCode.signedByUnknownKey;
      signatureProtocol: string;
      key: string;
    };

export type ReleaseSignatureWithData = {
  signature: ReleaseSignature;
  signedData: string;
};

/** TODO: Add RSA_2048, OpenPGP */
export type ReleaseSignatureProtocol = "ECDSA_256";
// NOTE: Must list all available protocols to be shown in the UI select component
export const releaseSignatureProtocols: ReleaseSignatureProtocol[] = [
  "ECDSA_256",
];

export interface TrustedReleaseKey {
  /** Metadata name to identify this key: `DAppnode association` */
  name: string;
  signatureProtocol: ReleaseSignatureProtocol;
  /** `.dnp.dappnode.eth` */
  dnpNameSuffix: string;
  /** `0x14791697260E4c9A71f18484C9f997B308e59325` */
  key: string;
}

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
