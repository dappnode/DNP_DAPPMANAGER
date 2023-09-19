import { params } from "@dappnode/params";

/**
 * Used to test different IPFS timeout parameters live from the ADMIN UI.
 * @param timeout new IPFS timeout in ms
 */
export async function changeIpfsTimeout({
  timeout
}: {
  timeout?: number;
}): Promise<void> {
  if (!timeout) throw Error("kwarg timeout must be defined");

  params.IPFS_TIMEOUT = timeout;
}
