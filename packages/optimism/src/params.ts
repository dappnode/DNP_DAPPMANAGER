import { ExecutionClientOptimism } from "@dappnode/types";

export const opNodeRpcUrlEnvName = "CUSTOM_L1_RPC";
export const opNodeServiceName = "op-node";

export const opExecutionClientHistoricalRpcUrlEnvName = "HISTORICAL_RPC_URL";
export const historicalRpcUrl = "http://op-l2geth.dappnode:8545";

export const opClientToServiceMap: Record<ExecutionClientOptimism, string> = {
  "op-geth.dnp.dappnode.eth": "geth",
  "op-erigon.dnp.dappnode.eth": "erigon"
};
