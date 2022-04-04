import { dbMain } from "./dbFactory";
import { EIP3770AddressStr } from "../types";

const REGISTRY_ADDRESSES = "registry-addresses";

// EIP-3770: Chain-specific addresses https://eips.ethereum.org/EIPS/eip-3770
export const registryEIP3770Addresses = dbMain.indexedByKey<
  EIP3770AddressStr,
  string
>({ rootKey: REGISTRY_ADDRESSES, getKey: id => id });
