import { changeIpfsClient } from "../modules/ipfsClient";
import { IpfsRepository } from "@dappnode/common";

/**
 * Changes the IPFS client
 */
export async function ipfsClientTargetSet({
  ipfsRepository,
  deleteLocalIpfsClient
}: {
  ipfsRepository: IpfsRepository;
  deleteLocalIpfsClient?: boolean;
}): Promise<void> {
  if (!ipfsRepository.ipfsClientTarget)
    throw Error(`Argument target must be defined`);

  await changeIpfsClient(
    ipfsRepository.ipfsClientTarget,
    deleteLocalIpfsClient,
    ipfsRepository.ipfsGateway
  );
}
