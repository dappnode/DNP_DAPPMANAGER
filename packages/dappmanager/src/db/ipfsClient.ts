import { dbMain } from "./dbFactory";
import { interceptOnSet } from "./ethClient";
import { IpfsClientTarget, IpfsClientFallback } from "../types";

// User chosen properties
const IPFS_CLIENT_TARGET = "ipfs-client-target";
const IPFS_CLIENT_FALLBACK = "ipfs-client-fallback";

export const ipfsClientTarget = interceptOnSet(
  dbMain.staticKey<IpfsClientTarget>(IPFS_CLIENT_TARGET, "remote")
);

export const ipfsClientFallback = interceptOnSet(
  dbMain.staticKey<IpfsClientFallback>(IPFS_CLIENT_FALLBACK, "off")
);
