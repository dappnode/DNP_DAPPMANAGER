import { optimismNode } from "@dappnode/types";
import { ComposeFileEditor } from "../compose/editor.js";
import { opNodeRpcUrlEnvName, opNodeServiceName } from "./params.js";

export function getOptimismNodeRpcUrl(): string {
  const userSettings = new ComposeFileEditor(
    optimismNode,
    false
  ).getUserSettings();
  return userSettings.environment
    ? userSettings.environment[opNodeServiceName][opNodeRpcUrlEnvName]
    : "";
}
