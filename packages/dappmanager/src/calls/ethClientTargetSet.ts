import { Eth2ClientTarget } from "@dappnode/types";
import { ethereumClient } from "@dappnode/installer";
import { dappnodeInstaller } from "../index.js";

/**
 * Changes the ethereum client used to fetch package data
 */
export async function ethClientTargetSet({
  target,
  ethRemoteRpc,
  sync = false,
  useCheckpointSync = false,
  deletePrevExecClient = false,
  deletePrevExecClientVolumes = false,
  deletePrevConsClient = false,
  deletePrevConsClientVolumes = false
}: {
  target: Eth2ClientTarget;
  ethRemoteRpc?: string;
  sync?: boolean;
  useCheckpointSync?: boolean;
  deletePrevExecClient?: boolean;
  deletePrevExecClientVolumes?: boolean;
  deletePrevConsClient?: boolean;
  deletePrevConsClientVolumes?: boolean;
}): Promise<void> {
  if (!target) throw Error(`Argument target must be defined`);

  await ethereumClient.changeEthClient({
    dappnodeInstaller,
    nextTarget: target,
    sync,
    useCheckpointSync,
    deletePrevExecClient,
    deletePrevExecClientVolumes,
    deletePrevConsClient,
    deletePrevConsClientVolumes,
    ethRemoteRpc
  });
}
