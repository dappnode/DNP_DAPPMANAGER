import { Eth2ClientTarget, EthClientStatusToSet } from "@dappnode/common";
import { ethereumClient } from "../modules/ethClient/index.js";

/**
 * Changes the ethereum client used to fetch package data
 */
export async function ethClientTargetSet({
  target,
  sync = false,
  useCheckpointSync = false,
  prevExecClientStatus = "running",
  prevConsClientStatus = "running"
}: {
  target: Eth2ClientTarget;
  sync?: boolean;
  useCheckpointSync?: boolean;
  prevExecClientStatus?: EthClientStatusToSet;
  prevConsClientStatus?: EthClientStatusToSet;
}): Promise<void> {
  if (!target) throw Error(`Argument target must be defined`);

  await ethereumClient.changeEthClient(
    target,
    sync,
    useCheckpointSync,
    prevExecClientStatus,
    prevConsClientStatus
  );
}
