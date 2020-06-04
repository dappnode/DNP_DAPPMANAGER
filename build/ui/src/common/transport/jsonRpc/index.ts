import Ajv from "ajv";
import { Routes, routesArgumentsSchema } from "../../";
import { LoggerMiddleware } from "../types";

interface RpcResponse {
  result?: any;
  error?: { code: number; message: string; data?: any };
}

const ajv = new Ajv({ allErrors: true });
const validateParams = ajv.compile(routesArgumentsSchema);

/**
 * Given a set of method handlers, parse a RPC request and handle it
 * @param methods
 * @param loggerMiddleware
 */
export const getRpcHandler = (
  methods: Routes,
  loggerMiddleware?: LoggerMiddleware
) => async (body: any): Promise<RpcResponse> => {
  const { onCall, onSuccess, onError } = loggerMiddleware || {};

  try {
    const { method, params } = parseRpcRequest(body);

    // Get handler
    const handler = methods[method] as (...params: any[]) => Promise<any>;
    if (!handler) throw new JsonRpcError(`Method not found ${method}`);
    if (onCall) onCall(method, params);

    // Validate params
    const valid = validateParams({ [method]: params });
    if (!valid)
      throw new JsonRpcError(formatErrors(validateParams.errors, method));

    const result = await handler(...params);
    if (onSuccess) onSuccess(method, result, params);
    return { result };
  } catch (e) {
    if (e instanceof JsonRpcError) {
      return { error: { code: e.code, message: e.message } };
    } else {
      // Unexpected error, log and send more details
      const { method, params } = tryToParseRpcRequest(body);
      if (onError) onError(method || "unknown-method", e, params || []);
      return { error: { code: -32603, message: e.message, data: e.stack } };
    }
  }
};

/**
 * Parse RPC request, to be used in the server
 * @param body
 */
function parseRpcRequest(body: any): { method: keyof Routes; params: any[] } {
  if (typeof body !== "object")
    throw Error(`body request must be an object, ${typeof body}`);
  const { method, params } = body;
  if (!method) throw new JsonRpcError("request body missing method");
  if (!params) throw new JsonRpcError("request body missing params");
  if (!Array.isArray(params))
    throw new JsonRpcError("request body params must be an array");
  return { method, params };
}

function tryToParseRpcRequest(body: any): { method?: string; params?: any[] } {
  try {
    return parseRpcRequest(body);
  } catch {
    return {};
  }
}

/**
 * Parse RPC response, to be used in the client
 * RPC response must always have code 200
 * @param body
 */
export async function parseRpcResponse<R>(body: RpcResponse): Promise<R> {
  if (body.error)
    if (body.error.data)
      throw Error(body.error.message + "\n" + body.error.data);
    else throw Error(body.error.message);
  else return body.result;
}

function formatErrors(
  errors: Array<Ajv.ErrorObject> | null | undefined,
  method: string
): string {
  const dataVar = `root_prop`;
  const toReplace = `${dataVar}.${method}`;
  const errorsText = ajv.errorsText(errors, { separator: "\n", dataVar });
  return (
    "Validation error:\n" +
    errorsText.replace(new RegExp(toReplace, "g"), "params")
  );
}

class JsonRpcError extends Error {
  code: number;
  constructor(message?: string, code?: number) {
    super(message);
    this.code = code || -32603;
  }
}
