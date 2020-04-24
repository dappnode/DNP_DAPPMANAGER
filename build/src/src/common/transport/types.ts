export type RpcResult<R> =
  | { success: true; result: R }
  | { success: false; message: string };

export type Args = any[];
export type Result = any | void;

export interface LoggerMiddleware {
  onCall?: (route: string, args?: Args) => void;
  onSuccess?: (route: string, result: Result, args?: Args) => void;
  onError?: (route: string, error: Error, args?: Args) => void;
}
