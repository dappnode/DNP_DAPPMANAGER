import { Eth2ClientTarget } from "../types";
import { ethereumClient } from "../modules/ethClient";

/**
 * Changes the ethereum client used to fetch package data
 */
export async function ethClientTargetSet({
  target,
  deletePrevExecClient,
  deletePrevConsClient
}: {
  target: Eth2ClientTarget;
  deletePrevExecClient?: boolean;
  deletePrevConsClient?: boolean;
}): Promise<void> {
  if (!target) throw Error(`Argument target must be defined`);

  await ethereumClient.changeEthClient(
    target,
    false,
    deletePrevExecClient,
    deletePrevConsClient
  );
}
