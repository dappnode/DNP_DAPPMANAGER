import { changeIpfsClient } from "../modules/ipfsClient";
import { IpfsClientTarget } from "../types";

/**
 * Changes the ethereum client used to fetch package data
 */
export async function ipfsClientTargetSet({
  target,
  deleteLocalIpfsClient
}: {
  target: IpfsClientTarget;
  deleteLocalIpfsClient?: boolean;
}): Promise<void> {
  if (!target) throw Error(`Argument target must be defined`);

  await changeIpfsClient(target, deleteLocalIpfsClient);
}
