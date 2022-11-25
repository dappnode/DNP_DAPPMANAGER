import { Eth2ClientTarget } from "../types";
import { ethereumClient } from "../modules/ethClient";

/**
 * Changes the ethereum client used to fetch package data
 */
export async function ethClientTargetSet({
  target,
  useCheckpointSync = false,
  deletePrevExecClient = false,
  deletePrevExecClientVolumes = false,
  deletePrevConsClient = false,
  deletePrevConsClientVolumes = false
}: {
  target: Eth2ClientTarget;
  useCheckpointSync?: boolean;
  deletePrevExecClient?: boolean;
  deletePrevExecClientVolumes?: boolean;
  deletePrevConsClient?: boolean;
  deletePrevConsClientVolumes?: boolean;
}): Promise<void> {
  if (!target) throw Error(`Argument target must be defined`);

  await ethereumClient.changeEthClient(
    target,
    false,
    useCheckpointSync,
    deletePrevExecClient,
    deletePrevExecClientVolumes,
    deletePrevConsClient,
    deletePrevConsClientVolumes
  );
}
