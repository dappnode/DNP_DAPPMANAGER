import { OptimismConfigGet, OptimismConfigSet } from "@dappnode/common";

/**
 * Enables Optimism with the given configuration
 *
 * @param mainnetRpcUrl this is the RPC url of the mainnet node that will be used to connect to the Optimism network
 * @param enableHistorical this enables the historical transactions on the Optimism network
 * @param targetOpExecutionClient this is the client that will be used to connect to the Optimism network
 */
export async function optimismConfigSet({
  mainnetRpcUrl,
  enableHistorical,
  targetOpExecutionClient
}: OptimismConfigSet): Promise<void> {}

/**
 * Returns the current Optimism configuration
 */
export async function optimismConfigGet(): Promise<OptimismConfigGet> {}

/**
 * Disables Optimism by stopping the packages envolved
 */
export async function optimismDisable(): Promise<void> {}
