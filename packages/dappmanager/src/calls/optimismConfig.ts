import { OptimismConfigGet, OptimismConfigSet } from "@dappnode/types";
import { getOptimismConfig, setOptimismConfig } from "@dappnode/optimism";
import { dappnodeInstaller } from "../index.js";

/**
 * Enables Optimism with the given configuration:
 *
 * - Set in db the envs
 * - Make sure install packages with userSettings: mainnetRpcUrl, enableHistorical, targetOpExecutionClient
 * - Make sure packages are running: op-node, op-geth || op-erigon, and optionally l2geth
 * - If there is a switch in the targetOpExecitonClient, and the enableHistorical has changed, then
 * the volumes of the packages should be removed
 *
 * @param mainnetRpcUrl this is the RPC url of the mainnet node that will be used to connect to the Optimism network
 * @param enableHistorical this enables the historical transactions on the Optimism network
 * @param targetOpExecutionClient this is the client that will be used to connect to the Optimism network
 */
export async function optimismConfigSet({ archive, executionClient, rollup }: OptimismConfigSet): Promise<void> {
  await setOptimismConfig(dappnodeInstaller, {
    archive,
    executionClient,
    rollup
  });
}

/**
 * Returns the current Optimism configuration
 */
export async function optimismConfigGet(): Promise<OptimismConfigGet> {
  return await getOptimismConfig(dappnodeInstaller);
}
