import { staticKey } from "./dbMain";

const SERVER_NAME = "server-name";

export const serverName = staticKey<string>(SERVER_NAME, "");
