import { RpcResponse } from "../../types";

/**
 * Parse RPC response, to be used in the client
 * RPC response must always have code 200
 */
export async function parseRpcResponse<R>(body: RpcResponse<R>): Promise<R> {
  if (body.error) {
    const error = new JsonRpcResError(body.error);
    if (typeof body.error.data === "string") {
      // If data is of type string assume it's the error stack
      error.stack = body.error.data + "\n" + error.stack || "";
    }
    throw error;
  } else {
    return (body.result as unknown) as R;
  }
}

/**
 * Wrap JSON RPC response errors
 */
class JsonRpcResError extends Error {
  code: number;
  data: any;
  constructor(jsonRpcError: RpcResponse["error"]) {
    super(jsonRpcError?.message);
    this.code = jsonRpcError?.code || -32603;
    this.data = jsonRpcError?.data;
  }
}
