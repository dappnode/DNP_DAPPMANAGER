import { Manifest } from "@dappnode/types";

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

export interface ComposeServicesSharingPid {
  targetPidServices: string[];
  dependantPidServices: string[];
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

export interface ApmVersion {
  version: string;
  contentUri: string;
}
