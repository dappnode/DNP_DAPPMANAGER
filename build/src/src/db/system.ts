import { staticKey } from "./lowLevelDb";

const SERVER_NAME = "server-name";

export const serverName = staticKey<string>(SERVER_NAME, "");
