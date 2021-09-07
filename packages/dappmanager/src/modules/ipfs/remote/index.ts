import { IpfsGateway } from "./IpfsGateway";
import params from "../../../params";

export const ipfsGateway = new IpfsGateway(params.IPFS_HOST_GATEWAY);
