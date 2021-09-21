import * as db from "../db";
import { IpfsRepository } from "../common";

export async function ipfsClientTargetGet(): Promise<IpfsRepository> {
  return {
    ipfsClientTarget: db.ipfsClientTarget.get(),
    ipfsGateway: db.ipfsGateway.get()
  };
}
