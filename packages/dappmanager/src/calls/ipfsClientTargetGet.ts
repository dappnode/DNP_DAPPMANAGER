import * as db from "@dappnode/db";
import { IpfsRepository } from "@dappnode/types";

export async function ipfsClientTargetGet(): Promise<IpfsRepository> {
  return {
    ipfsClientTarget: db.ipfsClientTarget.get(),
    ipfsGateway: db.ipfsGateway.get()
  };
}
