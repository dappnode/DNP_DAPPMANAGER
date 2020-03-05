import { RequestData } from "../route-types/ethClientTargetSet";
import { RpcHandlerReturn, ethClientTargets } from "../types";
import { changeEthMultiClient } from "../watchers/ethMultiClient";

/**
 * Changes the ethereum client used to fetch package data
 */
export default async function ethClientTargetSet({
  target,
  deleteVolumes
}: RequestData): RpcHandlerReturn {
  if (!target) throw Error(`Argument target must be defined`);
  if (!ethClientTargets.includes(target))
    throw Error(`Unknown client target: ${target}`);

  await changeEthMultiClient(target, deleteVolumes);

  return {
    message: `Changed Eth client`,
    logMessage: true,
    userAction: true
  };
}
