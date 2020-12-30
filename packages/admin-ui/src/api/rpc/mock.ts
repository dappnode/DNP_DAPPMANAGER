import { RpcPayload, RpcResponse } from "common/transport/types";
import { calls } from "../../__mock-backend__";
import { IApiRpc } from "./interface";

export const rpc: IApiRpc = {
  async call<R>(payload: RpcPayload): Promise<RpcResponse<R>> {
    const method = payload.method as keyof typeof calls;
    if (typeof calls[method] !== "function") {
      throw Error(`method ${payload.method} not supported`);
    }
    return await (calls[method] as (...params: any[]) => Promise<any>)(
      ...payload.params
    );
  },

  start(apiEventBridge, onConnect) {
    onConnect();
  }
};
