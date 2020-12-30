import { Emitter } from "mitt";
import { RpcPayload, RpcResponse } from "common/transport/types";

export interface IApiRpc {
  start(
    apiEventBridge: Emitter,
    onConnect: () => void,
    onError: (errorMessage: string) => void
  ): void;
  call<R>(payload: RpcPayload): Promise<RpcResponse<R>>;
}
