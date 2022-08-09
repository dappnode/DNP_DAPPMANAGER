import { dbMain } from "./dbFactory";
import { IdentityInterface } from "../types";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";

const PUBLIC_IP = "public-ip";
const DOMAIN = "domain";
const DYNDNS_IDENTITY = "dyndns-identity";
const STATIC_IP = "static-ip";

export const publicIp = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<string>(PUBLIC_IP, ""),
  globEnvKey: PUBLIC_IP
});

export const domain = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<string>(DOMAIN, ""),
  globEnvKey: DOMAIN
});

export const dyndnsIdentity = dbMain.staticKey<IdentityInterface>(
  DYNDNS_IDENTITY,
  { address: "", privateKey: "", publicKey: "" }
);

export const staticIp = interceptGlobalEnvOnSet({
  ...dbMain.staticKey<string>(STATIC_IP, ""),
  globEnvKey: STATIC_IP
});
