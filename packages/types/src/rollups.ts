import { PackageItemData } from "./stakers.js";

// Optimism

export const executionClientsOptimism = Object.freeze([
  "op-geth.dnp.dappnode.eth",
  "op-erigon.dnp.dappnode.eth",
] as const);
export type ExecutionClientOptimism = typeof executionClientsOptimism[number];

export type OptimismNode = "op-node.dnp.dappnode.eth";
export const optimismNode: OptimismNode = "op-node.dnp.dappnode.eth";

export type OptimismL2Geth = "op-l2geth.dnp.dappnode.eth";
export const optimismL2Geth: OptimismL2Geth = "op-l2geth.dnp.dappnode.eth";

export type OptimismType = "archive" | "execution" | "rollup";
export type OptimismItem<T extends OptimismType> =
  | OptimismItemOk<T>
  | OptimismItemError<T>;
interface OptimismArchive {
  dnpName: OptimismL2Geth;
}
interface OptimismExecution {
  dnpName: ExecutionClientOptimism;
  enableHistorical: boolean;
}
interface OptimismRollup {
  dnpName: OptimismNode;
  mainnetRpcUrl: string;
}
type OptimismItemBasic<T extends OptimismType> = T extends "archive"
  ? OptimismArchive
  : T extends "execution"
  ? OptimismExecution
  : T extends "rollup"
  ? OptimismRollup
  : never;

export type OptimismItemError<T extends OptimismType> = {
  status: "error";
  error: string;
} & OptimismItemBasic<T>;
export type OptimismItemOk<T extends OptimismType> = {
  status: "ok";
  avatarUrl: string;
  isInstalled: boolean;
  isUpdated: boolean;
  isRunning: boolean;
  data?: PackageItemData;
  isSelected: boolean;
} & OptimismItemBasic<T>;

export interface OptimismConfigGet {
  archive: OptimismItem<"archive">;
  executionClients: OptimismItem<"execution">[];
  rollup: OptimismItem<"rollup">;
}

export interface OptimismConfigGetOk {
  archive: OptimismItemOk<"archive">;
  executionClients: OptimismItemOk<"execution">[];
  rollup: OptimismItemOk<"rollup">;
}

export interface OptimismConfigSet {
  archive?: OptimismItemOk<"archive">;
  executionClient?: OptimismItemOk<"execution">;
  rollup?: OptimismItemOk<"rollup">;
}

// TODO: Polygon
// ZK-EVM

export type ZKEVMType = "rollup";
export type ZKEVMItem<T extends ZKEVMType> = ZKEVMItemOk<T> | ZKEVMItemError<T>;

interface ZKEVMTokenWithdrawals {
  dnpName: "zkevm-tokens-withdrawal.dnp.dappnode.eth";
}

type ZKEVMItemBasic<T extends ZKEVMType> = T extends "rollup"
  ? ZKEVMTokenWithdrawals
  : never;

export type ZKEVMItemError<T extends ZKEVMType> = {
  status: "error";
  error: string;
} & ZKEVMItemBasic<T>;

export type ZKEVMItemOk<T extends ZKEVMType> = {
  status: "ok";
  avatarUrl: string;
  isInstalled: boolean; 
  isUpdated: boolean;
  isRunning: boolean;
  data?: PackageItemData;
  isSelected: boolean;
} & ZKEVMItemBasic<T>;

export interface ZkevmConfigGet {
  rollup: ZKEVMItem<"rollup">;
}

export interface ZkevmConfigGetOk {
  rollup: ZKEVMItemOk<"rollup">;
}

export interface ZkevmConfigSet {
  rollup?: ZKEVMItemOk<"rollup">;
}
