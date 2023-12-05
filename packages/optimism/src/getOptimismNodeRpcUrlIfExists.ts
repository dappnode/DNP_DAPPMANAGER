import { optimismNode } from "@dappnode/common";
import { ComposeFileEditor } from "@dappnode/dockercompose";
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
