import { Ajv, ErrorObject } from "ajv";
import { routesArgumentsSchema } from "@dappnode/common";
import { LoggerMiddleware, RpcPayload, Routes, RpcResponse } from "@dappnode/types";

const ajv = new Ajv({ allErrors: true });

/**
 * Given a set of method handlers, parse a RPC request and handle it
 */
export const getRpcHandler = (methods: Routes, loggerMiddleware?: LoggerMiddleware) => {
  const validateParams = ajv.compile(routesArgumentsSchema);
  const { onCall, onSuccess, onError } = loggerMiddleware || {};

  return async (body: RpcPayload): Promise<RpcResponse> => {
    try {
      const { method, params } = parseRpcRequest(body);

      // Get handler
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = methods[method] as (...params: any[]) => Promise<any>;
      if (!handler) throw new JsonRpcReqError(`Method not found ${method}`);
      if (onCall) onCall(method, params);

      // Validate params
      const valid = validateParams({ [method]: params });
      if (!valid) throw new JsonRpcReqError(formatErrors(validateParams.errors, method));

      const result = await handler(...params);
      if (onSuccess) onSuccess(method, result, params);
      return { result };
    } catch (e) {
      if (e instanceof JsonRpcReqError) {
        // JSON RPC request formating errors, do not log
        return { error: { code: e.code, message: e.message } };
      } else {
        // Unexpected error, log and send more details
        const { method, params } = tryToParseRpcRequest(body);
        if (onError) onError(method || "unknown-method", e, params || []);
        return { error: { code: -32603, message: e.message, data: e.stack } };
      }
    }
  };
};

/**
 * Parse RPC request, to be used in the server
 */
function parseRpcRequest(body: RpcPayload): {
  method: keyof Routes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[];
} {
  if (typeof body !== "object") throw Error(`body request must be an object, ${typeof body}`);
  const { method, params } = body;
  if (!method) throw new JsonRpcReqError("request body missing method");
  if (!params) throw new JsonRpcReqError("request body missing params");
  if (!Array.isArray(params)) throw new JsonRpcReqError("request body params must be an array");
  return { method: method as keyof Routes, params };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryToParseRpcRequest(body: any): { method?: string; params?: any[] } {
  try {
    return parseRpcRequest(body);
  } catch {
    return {};
  }
}

function formatErrors(errors: Array<ErrorObject> | null | undefined, method: string): string {
  const dataVar = `root_prop`;
  // Ajv v8 error paths are `${dataVar}${instancePath}` with "/"-separated instance paths
  const toReplace = `${dataVar}/${method}`;
  const errorsText = ajv.errorsText(errors, { separator: "\n", dataVar });
  // Plain string replacement: `method` comes from the request, so it must not be compiled into a RegExp
  return "Validation error:\n" + errorsText.replaceAll(toReplace, "params");
}

/**
 * Errors specific to JSON RPC request payload formating
 */
class JsonRpcReqError extends Error {
  code: number;
  constructor(message?: string, code?: number) {
    super(message);
    this.code = code || -32603;
  }
}
