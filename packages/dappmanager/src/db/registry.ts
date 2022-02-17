import { dbMain } from "./dbFactory";
import { AddressHex } from "../types";

const REGISTRY_ADDRESSES = "registry-addresses";

export const registryAddresses = dbMain.indexedByKey<AddressHex, string>({
  rootKey: REGISTRY_ADDRESSES,
  getKey: id => id
});
