import { dbMain } from "./dbFactory";
import { interceptOnSet } from "./ethClient";
import { IpfsClientTarget } from "../types";

// User chosen properties
const IPFS_CLIENT_TARGET = "ipfs-client-target";

export const ipfsClientTarget = interceptOnSet(
  dbMain.staticKey<IpfsClientTarget>(IPFS_CLIENT_TARGET, "local")
);
