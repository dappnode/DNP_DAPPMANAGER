import * as db from "../db/index.js";
import { IpfsRepository } from "@dappnode/common";

export async function ipfsClientTargetGet(): Promise<IpfsRepository> {
  return {
    ipfsClientTarget: db.ipfsClientTarget.get(),
    ipfsGateway: db.ipfsGateway.get()
  };
}
