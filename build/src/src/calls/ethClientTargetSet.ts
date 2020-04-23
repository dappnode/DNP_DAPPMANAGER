import { RequestData } from "../route-types/ethClientTargetSet";
import { ethClientTargets } from "../types";
import { changeEthMultiClient } from "../modules/ethClient";

/**
 * Changes the ethereum client used to fetch package data
 */
export async function ethClientTargetSet({
  target,
  deleteVolumes
}: RequestData): Promise<void> {
  if (!target) throw Error(`Argument target must be defined`);
  if (!ethClientTargets.includes(target))
    throw Error(`Unknown client target: ${target}`);

  await changeEthMultiClient(target, deleteVolumes);
}
