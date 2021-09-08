import { interceptOnSet } from "./ethClient";
import { dbCache, dbMain } from "./dbFactory";
import { IpfsTarget, IpfsFallback, IpfsStatus } from "../types";
import { IpfsInstallStatus } from "../modules/ethClient/types";

// User chosen properties
const IPFS_TARGET = "ipfs-target";
const IPFS_FALLBACK = "ipfs-fallback";
// Cached status
const IPFS_INSTALL_STATUS = "ipfs-install-status";
const IPFS_STATUS = "ipfs-status";
const IPFS_PROVIDER_URL = "ipfs-provider-url";

// Re-export to consider the first value (when it's not set)
// but do not allow to set null again. Using to express intentionality
const _ipfsTarget = interceptOnSet(
  dbMain.staticKey<IpfsTarget | null>(IPFS_TARGET, null)
);

export const ipfsTarget = {
  get: _ipfsTarget.get,
  set: (newValue: IpfsTarget): void => _ipfsTarget.set(newValue)
};

export const ipfsFallback = interceptOnSet(
  dbMain.staticKey<IpfsFallback>(IPFS_FALLBACK, "off")
);

export const ipfsProviderUrl = interceptOnSet(
  dbCache.staticKey<string>(IPFS_PROVIDER_URL, "")
);

// Cache status

/**
 * Cache the status of the IPFS install loop
 */
export const ipfsInstallStatus = interceptOnSet(
  dbCache.indexedByKey<IpfsInstallStatus, IpfsTarget>({
    rootKey: IPFS_INSTALL_STATUS,
    getKey: target => target,
    validate: (id, installStatus) =>
      typeof id === "string" && typeof installStatus === "object"
  })
);

/**
 * Cache the general status of the IPFS, if it's available or not
 */
export const ipfsStatus = interceptOnSet(
  dbCache.indexedByKey<IpfsStatus, IpfsTarget>({
    rootKey: IPFS_STATUS,
    getKey: target => target,
    validate: (id, status) =>
      typeof id === "string" && typeof status === "object"
  })
);
