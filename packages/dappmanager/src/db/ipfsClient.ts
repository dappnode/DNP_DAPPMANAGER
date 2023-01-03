import { dbMain } from "./dbFactory";
import { IpfsClientTarget } from "@dappnode/common";
import params from "../params";

// User chosen properties
const IPFS_CLIENT_TARGET = "ipfs-client-target";
const IPFS_GATEWAY = "ipfs-gateway";

export const ipfsClientTarget = dbMain.staticKey<IpfsClientTarget>(
  IPFS_CLIENT_TARGET,
  IpfsClientTarget.local
);

export const ipfsGateway = dbMain.staticKey<string>(
  IPFS_GATEWAY,
  params.IPFS_REMOTE
);
