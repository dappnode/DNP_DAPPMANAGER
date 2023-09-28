import { optimismNode } from "@dappnode/types";
import { ComposeFileEditor } from "../compose/editor.js";
import { opNodeRpcUrlEnvName, opNodeServiceName } from "./params.js";

export function getOptimismNodeRpcUrlIfExists(): string {
  const userSettings = ComposeFileEditor.getUserSettingsIfExist(
    optimismNode,
    false
  );
  return userSettings.environment
    ? userSettings.environment[opNodeServiceName][opNodeRpcUrlEnvName]
    : "";
}
