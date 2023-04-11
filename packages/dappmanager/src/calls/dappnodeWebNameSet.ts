import * as db from "../db/index.js";

/**
 * Sets the dappnodeWebName
 * @param dappnodeWebName New dappnodeWebName
 */
export async function dappnodeWebNameSet({
  dappnodeWebName
}: {
  dappnodeWebName: string;
}): Promise<void> {
  db.dappnodeWebName.set(dappnodeWebName);
}
