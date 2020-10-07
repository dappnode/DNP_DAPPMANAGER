export interface RpcResponse<R = any> {
  result?: R;
  error?: { code: number; message: string; data?: any };
}

export interface RpcPayload {
  method: string;
  params: Args;
}

export type Args = any[];
export type Result = any | void;

export interface LoggerMiddleware {
  onCall?: (route: string, args?: Args) => void;
  onSuccess?: (route: string, result: Result, args?: Args) => void;
  onError?: (route: string, error: Error, args?: Args) => void;
}
