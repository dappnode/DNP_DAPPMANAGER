import fetch from "node-fetch";
import params from "../../params";

const ipfsApi = params.IPFS_HOST;

const addEndpoint = (hash: string): string => `${ipfsApi}/pin/add?arg=${hash}`;

/**
 * Additive behaviour of pinning a visited hash
 * @param hash
 */
export async function pinIpfsHash(hash: string): Promise<any> {
  return await fetch(addEndpoint(hash)).then(res => res.text());
}
