import { dbMain } from "./dbFactory";
import { IdentityInterface } from "../types";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";
import { dbKeys } from "./dbUtils";

export const publicIp = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(dbKeys.PUBLIC_IP, ""),
  dbKeys.PUBLIC_IP
);

export const domain = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(dbKeys.DOMAIN, ""),
  dbKeys.DOMAIN
);

export const dyndnsIdentity = dbMain.staticKey<IdentityInterface>(
  dbKeys.DYNDNS_IDENTITY,
  { address: "", privateKey: "", publicKey: "" }
);

export const staticIp = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(dbKeys.STATIC_IP, ""),
  dbKeys.STATIC_IP
);
