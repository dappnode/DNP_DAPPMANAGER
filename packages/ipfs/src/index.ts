import { Ipfs } from "./Ipfs.js";
import { getIpfsUrl } from "./utils.js";
export * from "./types.js";

export const ipfs = new Ipfs(getIpfsUrl());
