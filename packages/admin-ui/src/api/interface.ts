import { Emitter } from "mitt";
import { RpcPayload, RpcResponse } from "common/transport/types";

export type LoginStatus =
  | { status: "logged-in"; username: string }
  | { status: "not-logged-in"; noCookie: boolean }
  | { status: "not-registered" }
  | { status: "error"; error: Error };

export interface IApiAuth {
  fetchLoginStatus(): Promise<LoginStatus>;
  login(data: { username: string; password: string }): Promise<{ ok: true }>;
  logoutAndReload(): Promise<void>;
  register(data: {
    username: string;
    password: string;
  }): Promise<{ recoveryToken: string }>;
  changePass(data: {
    password: string;
    newPassword: string;
  }): Promise<{ ok: true }>;
  recoverPass(data: { token: string }): Promise<{ ok: true }>;
}

export interface IApiRpc {
  start(
    apiEventBridge: Emitter,
    onConnect: () => void,
    onError: (errorMessage: string) => void
  ): void;
  call<R>(payload: RpcPayload): Promise<RpcResponse<R>>;
}

export interface IApi {
  auth: IApiAuth;
  rpc: IApiRpc;
}
