import { EthClientTargetPackage, PackagePort } from "./common";
export * from "./common";

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
  target: EthClientTargetPackage;
  status: "AwaitingSynced" | "Synced";
} | null;

export interface DiskUsageThresholds {
  [thresholdId: string]: boolean;
}

export interface PortToOpen extends PackagePort {
  serviceName: string;
  dnpName: string;
}
