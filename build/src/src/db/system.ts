import { staticKey } from "./dbMain";
import { EthClientStatus, EthClientTarget } from "../types";

const SERVER_NAME = "server-name";
const ETH_PROVIDER = "eth-provider";
const ETH_CLIENT_TARGET = "eth-client-target";
const ETH_CLIENT_STATUS = "eth-client-status";
const ETH_CLIENT_STATUS_ERROR = "eth-client-status-error";
const FULLNODE_DOMAIN_TARGET = "fullnode-domain-target";

export const serverName = staticKey<string>(SERVER_NAME, "");

export const ethProvider = staticKey<string>(ETH_PROVIDER, "");

export const ethClientTarget = staticKey<EthClientTarget>(
  ETH_CLIENT_TARGET,
  "remote"
);
export const ethClientStatus = staticKey<EthClientStatus>(
  ETH_CLIENT_STATUS,
  "selected"
);
export const ethClientStatusError = staticKey<string | undefined>(
  ETH_CLIENT_STATUS_ERROR,
  undefined
);

export function setEthClientStatusAndError(
  status: EthClientStatus,
  e?: Error
): void {
  ethClientStatus.set(status);
  ethClientStatusError.set(e ? e.message : undefined);
}

// Domains

export const fullnodeDomainTarget = staticKey<string>(
  FULLNODE_DOMAIN_TARGET,
  ""
);
