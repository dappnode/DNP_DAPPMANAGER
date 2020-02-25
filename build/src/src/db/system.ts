import { staticKey } from "./dbMain";
import { EthClientStatus, EthClientTarget } from "../types";

const SERVER_NAME = "server-name";
const ETH_PROVIDER = "eth-provider";
const ETH_CLIENT_TARGET = "eth-client-target";
const ETH_CLIENT_STATUS = "eth-client-status";
const ETH_CLIENT_STATUS_ERROR = "eth-client-status-error";

type StatusError =
  | {
      message: string;
      stack?: string;
    }
  | undefined;

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
const ethClientStatusError = staticKey<StatusError>(
  ETH_CLIENT_STATUS_ERROR,
  undefined
);

export function setEthClientStatusAndError(
  status: EthClientStatus,
  e?: Error
): void {
  ethClientStatus.set(status);
  ethClientStatusError.set(
    e ? { message: e.message, stack: e.stack } : undefined
  );
}
