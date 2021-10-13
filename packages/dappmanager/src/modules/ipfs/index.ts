import { Ipfs } from "./Ipfs";
import { getIpfsUrl } from "./utils";
export * from "./types";

export const ipfs = new Ipfs(getIpfsUrl());
