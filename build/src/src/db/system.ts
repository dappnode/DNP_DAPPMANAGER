import { staticKey } from "./dbMain";

const SERVER_NAME = "server-name";
const ETH_PROVIDER = "eth-provider";

export const serverName = staticKey<string>(SERVER_NAME, "");

export const ethProvider = staticKey<string>(ETH_PROVIDER, "");
