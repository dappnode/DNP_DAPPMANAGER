import * as db from "@dappnode/db";
import { IpfsRepository } from "@dappnode/types";

export async function ipfsGatewayUrlsGet(): Promise<IpfsRepository> {
  return {
    ipfsGatewayUrls: db.ipfsGatewayUrls.get()
  };
}
