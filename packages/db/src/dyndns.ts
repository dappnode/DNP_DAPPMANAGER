import { dbMain } from "./dbFactory.js";
import { IdentityInterface } from "../types.js";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet.js";

const PUBLIC_IP = "public-ip";
const DOMAIN = "domain";
const DYNDNS_IDENTITY = "dyndns-identity";
const STATIC_IP = "static-ip";

export const publicIp = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(PUBLIC_IP, ""),
  Object.keys({ PUBLIC_IP })[0]
);

export const domain = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(DOMAIN, ""),
  Object.keys({ DOMAIN })[0]
);

export const dyndnsIdentity = dbMain.staticKey<IdentityInterface>(
  DYNDNS_IDENTITY,
  { address: "", privateKey: "", publicKey: "" }
);

export const staticIp = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(STATIC_IP, ""),
  Object.keys({ STATIC_IP })[0]
);
