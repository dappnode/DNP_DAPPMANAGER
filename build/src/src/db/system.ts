import { staticKey } from "./dbMain";

const SERVER_NAME = "server-name";
const FULLNODE_DOMAIN_TARGET = "fullnode-domain-target";
const PASSWORD_IS_SECURE = "password-is-secure";

export const serverName = staticKey<string>(SERVER_NAME, "");

// Domains

export const fullnodeDomainTarget = staticKey<string>(
  FULLNODE_DOMAIN_TARGET,
  ""
);

export const passwordIsSecure = staticKey<boolean>(PASSWORD_IS_SECURE, false);
