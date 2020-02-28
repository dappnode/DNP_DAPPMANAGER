import { RequestData } from "../route-types/ethClientTargetSet";
import { RpcHandlerReturn } from "../types";
import { changeEthMultiClient } from "../watchers/ethMultiClient";

/**
 * Changes the ethereum client used to fetch package data
 */
export default async function ethClientTargetSet({
  target,
  deleteVolumes
}: RequestData): RpcHandlerReturn {
  await changeEthMultiClient(target, deleteVolumes);

  return {
    message: `Changed Eth client`,
    logMessage: true,
    userAction: true
  };
}
