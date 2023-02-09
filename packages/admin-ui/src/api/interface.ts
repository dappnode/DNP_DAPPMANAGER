import { Emitter } from "mitt";
import { RpcPayload, RpcResponse } from "@dappnode/common";

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

export interface IApiRoutes {
  /** Get URL to download a specific path with an HTTP GET req */
  fileDownloadUrl(data: { containerName: string; path: string }): string;
  /** Download wireguard config */
  downloadWireguardConfig(data: { device: string; isLocal: boolean }): string;
  /** Legacy download file URL using both REST api and JSON RPC */
  downloadUrl(data: { fileId: string }): string;
  /** Static URL to download all user actions logs */
  userActionLogsUrl(): string;
  /** Per container URL to download all of its logs */
  containerLogsUrl(data: { containerName: string }): string;
  /** Upload file to DAppNode and get a fileId */
  uploadFile(
    file: File,
    onProgress: (data: { loaded: number; total: number }) => void
  ): Promise<{ fileId: string }>;
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
