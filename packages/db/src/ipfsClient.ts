import { dbMain } from "./dbFactory.js";
import { params } from "@dappnode/params";

// User chosen properties
const IPFS_GATEWAY_URLS = "ipfs-gateway-urls";
// Legacy key for migration
const IPFS_GATEWAY_LEGACY = "ipfs-gateway";

export const ipfsGatewayUrls = dbMain.staticKey<string[]>(IPFS_GATEWAY_URLS, params.IPFS_REMOTE_URLS);

// Legacy accessor for migration purposes only
export const ipfsGatewayLegacy = dbMain.staticKey<string>(IPFS_GATEWAY_LEGACY, params.IPFS_REMOTE_URLS[0]);
