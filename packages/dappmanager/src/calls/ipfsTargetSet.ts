import { changeIpfsTarget } from "../modules/ipfs/changeIpfsTarget";
import { IpfsTarget } from "../common";

/**
 * Changes the IPFS target from
 */
export async function ipfsTargetSet({
  target,
  deleteIpfs
}: {
  target: IpfsTarget;
  deleteIpfs?: boolean;
}): Promise<void> {
  if (!target) throw Error(`Argument target must be defined`);

  await changeIpfsTarget(target, deleteIpfs);
}
