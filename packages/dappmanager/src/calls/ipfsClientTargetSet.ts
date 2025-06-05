import { IpfsRepository, IpfsClientTarget } from "@dappnode/types";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { dappnodeInstaller } from "../index.js";
import { eventBus } from "@dappnode/eventbus";

/**
 * Changes the IPFS client
 */
export async function ipfsClientTargetSet({ ipfsRepository }: { ipfsRepository: IpfsRepository }): Promise<void> {
  if (!ipfsRepository.ipfsClientTarget) throw Error(`Argument target must be defined`);

  await changeIpfsClient(ipfsRepository.ipfsClientTarget, ipfsRepository.ipfsGateway);

  // Emit event to trigger notifier healthcheck notification
  eventBus.ipfsRepositoryChanged.emit();
}

/**
 * Changes IPFS client from remote to local and viceversa.
 * I local mode is set and IPFS is not installed, it will install
 * the IPFS package
 * @param nextTarget "local" | "remote"
 * @param nextGateway Gateway endpoint to be used by remote node. By default dappnode gateway
 */
async function changeIpfsClient(nextTarget: IpfsClientTarget, nextGateway?: string): Promise<void> {
  try {
    // Return if targets and gateways are equal
    const currentTarget = db.ipfsClientTarget.get();
    const currentGateway = db.ipfsGateway.get();
    if (currentTarget === nextTarget && currentGateway === nextGateway) return;

    if (nextTarget === IpfsClientTarget.local) {
      db.ipfsClientTarget.set(IpfsClientTarget.local);
      dappnodeInstaller.changeIpfsGatewayUrl(params.IPFS_LOCAL);
    } else {
      // Set new values in db
      db.ipfsGateway.set(nextGateway || params.IPFS_GATEWAY);
      db.ipfsClientTarget.set(IpfsClientTarget.remote);

      // Change IPFS host
      dappnodeInstaller.changeIpfsGatewayUrl(db.ipfsGateway.get());
    }
  } catch (e) {
    throw Error(`Error changing ipfs client to ${nextTarget}, ${e}`);
  }
}
