import { dbMain } from "./dbFactory";
import { IdentityInterface } from "../types";

const PUBLIC_IP = "public-ip";
const DOMAIN = "domain";
const DYNDNS_IDENTITY = "dyndns-identity";
const STATIC_IP = "static-ip";

export const publicIp = dbMain.staticKey<string>(PUBLIC_IP, "");

export const domain = dbMain.staticKey<string>(DOMAIN, "");

export const dyndnsIdentity = dbMain.staticKey<IdentityInterface>(
  DYNDNS_IDENTITY,
  { address: "", privateKey: "", publicKey: "" }
);

export const staticIp = dbMain.staticKey<string>(STATIC_IP, "");
