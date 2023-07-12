import { RpcPayload, RpcResponse } from "@dappnode/common";
import { calls } from "../../__mock-backend__";
import { IApiRpc } from "../interface";

export const apiRpc: IApiRpc = {
  async call<R>(payload: RpcPayload): Promise<RpcResponse<R>> {
    const method = payload.method as keyof typeof calls;
    if (typeof calls[method] !== "function") {
      throw Error(`method ${payload.method} not supported`);
    }
    const result: R = await (calls[method] as (
      ...params: any[]
    ) => Promise<any>)(...payload.params);
    return { result };
  },

  start(apiEventBridge, onConnect) {
    onConnect();
  }
};
