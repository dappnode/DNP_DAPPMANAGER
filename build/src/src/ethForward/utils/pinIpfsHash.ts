const ipfsAPI = require("ipfs-http-client");
import { promisify } from "util";
import params from "../../params";

/**
 * [ { hash: 'QmNqDvqAyy3pN3PvymB6chM7S1FgYyive8LosVKUuaDdfd' } ]
 */
type IpfsPinAddResult = { hash: string }[];

/**
 * Additive behaviour of pinning a visited hash
 * @param hash
 */
export async function pinIpfsHash(hash: string): Promise<IpfsPinAddResult> {
  const ipfsHost = params.IPFS_HOST;
  const protocol = process.env.IPFS_PROTOCOL || "http";
  const ipfs = ipfsAPI(ipfsHost, "5001", { protocol });

  return await promisify(ipfs.pin.add)(hash);
}
