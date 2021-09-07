import { Ipfs } from "./Ipfs";
import params from "../../../params";
export * from "./types";

export const ipfs = new Ipfs(params.IPFS_HOST);
