import { ExecutionClientOptimism } from "@dappnode/types";
import { dbCache, dbMain } from "./dbFactory.js";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet.js";
import { PackageItemData } from "@dappnode/common";

const OP_EXECUTION_CLIENT = "op-execution-client";
const OP_ENABLE_HISTORICAL_RPC = "op-enable-historical-rpc";

// Cache

const OPTIMISM_ITEM_METADATA = "optimism-item-metadata";

export const optimismItemMetadata = dbCache.indexedByKey<
  PackageItemData,
  string
>({
  rootKey: OPTIMISM_ITEM_METADATA,
  getKey: target => target,
  validate: (id, metadata) =>
    typeof id === "string" && typeof metadata === "object"
});

// Global env to be in the op-node package
export const opExecutionClient = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientOptimism | null>(OP_EXECUTION_CLIENT, null),
  Object.keys({ OP_EXECUTION_CLIENT })[0]
);

// Global env to be in the op-execution packages
export const opEnableHistoricalRpc = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(OP_ENABLE_HISTORICAL_RPC, false),
  Object.keys({ OP_ENABLE_HISTORICAL_RPC })[0]
);
