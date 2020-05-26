import { staticKey } from "./dbMain";
import { IdentityInterface } from "../types";

const PUBLIC_IP = "public-ip";
const DOMAIN = "domain";
const DYNDNS_IDENTITY = "dyndns-identity";
const STATIC_IP = "static-ip";

export const publicIp = staticKey<string>(PUBLIC_IP, "");

export const domain = staticKey<string>(DOMAIN, "");

export const dyndnsIdentity = staticKey<IdentityInterface>(DYNDNS_IDENTITY, {
  address: "",
  privateKey: ""
});

export const staticIp = staticKey<string>(STATIC_IP, "");
