import * as db from "../db";
import { IpfsClientTarget } from "../common";

export async function ipfsClientTargetGet(): Promise<IpfsClientTarget> {
  return db.ipfsClientTarget.get();
}
