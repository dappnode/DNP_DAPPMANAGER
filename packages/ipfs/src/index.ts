import { Ipfs } from "./Ipfs.js";
import { DappnodeRepository } from "@dappnode/toolkit";
import { getIpfsUrl } from "./utils.js";
export * from "./types.js";
export { Ipfs } from "./Ipfs.js";
export const ipfs = new Ipfs(getIpfsUrl());
