import * as db from "@dappnode/db";
import { IpfsRepository } from "@dappnode/types";

export async function ipfsClientTargetGet(): Promise<IpfsRepository> {
  const storedGateway = db.ipfsGateway.get();
  return {
    ipfsClientTarget: db.ipfsClientTarget.get(),
    ipfsGateway: Array.isArray(storedGateway) ? storedGateway : [storedGateway]
  };
}
