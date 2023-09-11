import { OptimismConfigGet, OptimismConfigSet } from "@dappnode/common";
import * as db from "../db/index.js";
import { listPackageNoThrow } from "../modules/docker/list/listPackages.js";
import { optimismNode } from "@dappnode/types";
import { ComposeFileEditor } from "../modules/compose/editor.js";

const rpcUrlEnvName = "L1_RPC";
const serviceName = "op-node";

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
export async function optimismConfigGet(): Promise<OptimismConfigGet> {
  let mainnetRpcUrl = null;
  const opNodePackage = await listPackageNoThrow({ dnpName: optimismNode });

  if (opNodePackage) {
    // get rpc url from environment variable

    const userSettings = new ComposeFileEditor(
      optimismNode,
      false
    ).getUserSettings();
    mainnetRpcUrl = userSettings.environment
      ? userSettings.environment[serviceName][rpcUrlEnvName]
      : null;
  }

  return {
    mainnetRpcUrl,
    opHistoricalGeth: db.opHistoricalGeth.get(),
    opHistoricalErigon: db.opHistoricalErigon.get(),
    currentOpExecutionClient: db.opExecutionClient.get()
  };
}

/**
 * Disables Optimism by stopping the packages envolved
 */
export async function optimismDisable(): Promise<void> {}
