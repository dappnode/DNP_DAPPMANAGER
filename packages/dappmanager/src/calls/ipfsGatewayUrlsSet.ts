import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { dappnodeInstaller } from "../index.js";
import { eventBus } from "@dappnode/eventbus";

/**
 * Sets the IPFS gateway URLs for package fetching
 */
export async function ipfsGatewayUrlsSet({ ipfsGatewayUrls }: { ipfsGatewayUrls: string[] }): Promise<void> {
  if (!ipfsGatewayUrls || ipfsGatewayUrls.length === 0) {
    throw Error(`At least one gateway URL must be provided`);
  }

  await changeIpfsGatewayUrls(ipfsGatewayUrls);

  // Emit event to trigger notifier healthcheck notification
  eventBus.ipfsRepositoryChanged.emit();
}

/**
 * Changes IPFS gateway URLs used for package fetching
 * @param nextGatewayUrls Gateway endpoints to be used
 */
async function changeIpfsGatewayUrls(nextGatewayUrls: string[]): Promise<void> {
  try {
    // Return if gateway URLs are equal
    const currentGatewayUrls = db.ipfsGatewayUrls.get();
    if (JSON.stringify(currentGatewayUrls) === JSON.stringify(nextGatewayUrls)) {
      return;
    }

    // Set new values in db
    const gatewayUrls = nextGatewayUrls.length > 0 ? nextGatewayUrls : params.IPFS_REMOTE_URLS;
    db.ipfsGatewayUrls.set(gatewayUrls);

    // Change IPFS gateway URLs in the installer
    dappnodeInstaller.changeIpfsGatewayUrls(db.ipfsGatewayUrls.get());
  } catch (e) {
    throw Error(`Error changing IPFS gateway URLs, ${e}`);
  }
}
