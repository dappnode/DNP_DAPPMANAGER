import { staticKey } from "./dbMain";

const SERVER_NAME = "server-name";
const FULLNODE_DOMAIN_TARGET = "fullnode-domain-target";

export const serverName = staticKey<string>(SERVER_NAME, "");

// Domains

export const fullnodeDomainTarget = staticKey<string>(
  FULLNODE_DOMAIN_TARGET,
  ""
);
