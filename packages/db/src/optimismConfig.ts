import { ExecutionClientOptimism } from "@dappnode/common";
import { dbMain } from "./dbFactory.js";
import { interceptGlobalEnvOnSet } from "./intercepGlobalEnvOnSet.js";

const OP_EXECUTION_CLIENT = "op-execution-client";
const OP_ENABLE_HISTORICAL_RPC = "op-enable-historical-rpc";

// Global env to be in the op-node package
export const opExecutionClient = interceptGlobalEnvOnSet(
  dbMain.staticKey<ExecutionClientOptimism | null | undefined>(
    OP_EXECUTION_CLIENT,
    null
  ),
  Object.keys({ OP_EXECUTION_CLIENT })[0]
);

// Global env to be in the op-execution packages
export const opEnableHistoricalRpc = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(OP_ENABLE_HISTORICAL_RPC, false),
  Object.keys({ OP_ENABLE_HISTORICAL_RPC })[0]
);
