import * as db from "../db";

export async function dappnodeWebNameSet({
  dappnodeWebName
}: {
  dappnodeWebName: string;
}): Promise<void> {
  db.dappnodeWebName.set(dappnodeWebName);
}
