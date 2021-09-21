import { dbMain } from "./dbFactory";
import { interceptOnSet } from "./ethClient";
import { IpfsClientTarget } from "../types";
import params from "../params";

// User chosen properties
const IPFS_CLIENT_TARGET = "ipfs-client-target";
const IPFS_GATEWAY = "ipfs-gateway";

export const ipfsClientTarget = interceptOnSet(
  dbMain.staticKey<IpfsClientTarget>(IPFS_CLIENT_TARGET, "local")
);

export const ipfsGateway = interceptOnSet(
  dbMain.staticKey<string>(IPFS_GATEWAY, params.IPFS_REMOTE)
);
