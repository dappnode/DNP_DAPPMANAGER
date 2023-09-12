import { OptimismConfigGet } from "@dappnode/common";
import * as db from "../../db/index.js";
import { listPackageNoThrow } from "../docker/list/listPackages.js";
import { optimismNode } from "@dappnode/types";
import { ComposeFileEditor } from "../compose/editor.js";
import { opNodeRpcUrlEnvName, opNodeServiceName } from "./params.js";

export async function getOptimismConfig(): Promise<OptimismConfigGet> {
  let mainnetRpcUrl = null;
  const opNodePackage = await listPackageNoThrow({ dnpName: optimismNode });

  if (opNodePackage) {
    // get rpc url from environment variable

    const userSettings = new ComposeFileEditor(
      optimismNode,
      false
    ).getUserSettings();
    mainnetRpcUrl = userSettings.environment
      ? userSettings.environment[opNodeServiceName][opNodeRpcUrlEnvName]
      : null;
  }

  return {
    mainnetRpcUrl,
    historicalEnabled: db.opEnableHistoricalRpc.get(),
    currentOpExecutionClient: db.opExecutionClient.get()
  };
}
