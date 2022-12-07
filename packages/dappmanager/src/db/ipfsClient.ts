import { dbMain } from "./dbFactory";
import { IpfsClientTarget } from "../types";
import params from "../params";
import { dbKeys } from "./dbUtils";

export const ipfsClientTarget = dbMain.staticKey<IpfsClientTarget>(
  dbKeys.IPFS_CLIENT_TARGET,
  IpfsClientTarget.local
);

export const ipfsGateway = dbMain.staticKey<string>(
  dbKeys.IPFS_GATEWAY,
  params.IPFS_REMOTE
);
