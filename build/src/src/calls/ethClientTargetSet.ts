import { ethClientTargets } from "../types";
import { changeEthMultiClient } from "../modules/ethClient";
import { EthClientTarget } from "../common/types";

/**
 * Changes the ethereum client used to fetch package data
 */
export async function ethClientTargetSet({
  target,
  deleteVolumes
}: {
  target: EthClientTarget;
  deleteVolumes?: boolean;
}): Promise<void> {
  if (!target) throw Error(`Argument target must be defined`);
  if (!ethClientTargets.includes(target))
    throw Error(`Unknown client target: ${target}`);

  await changeEthMultiClient(target, deleteVolumes);
}
