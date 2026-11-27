import { Emitter } from "mitt";
import {
  FullBackupCreateResult,
  FullBackupInspectResult,
  FullBackupRestoreMode,
  RpcPayload,
  RpcResponse
} from "@dappnode/types";

export type LoginStatus =
  | { status: "logged-in"; username: string }
  | { status: "not-logged-in"; noCookie: boolean }
  | { status: "not-registered" }
  | { status: "error"; error: Error };

export interface IApiAuth {
  fetchLoginStatus(): Promise<LoginStatus>;
  login(data: { username: string; password: string }): Promise<{ ok: true }>;
  logoutAndReload(): Promise<void>;
  register(data: { username: string; password: string }): Promise<{ recoveryToken: string }>;
  changePass(data: { password: string; newPassword: string }): Promise<{ ok: true }>;
  recoverPass(data: { token: string }): Promise<{ ok: true }>;
}

export interface IApiRoutes {
  /** Get URL to download a specific path with an HTTP GET req */
  fileDownloadUrl(data: { containerName: string; path: string }): string;
  /** Download Wireguard config */
  downloadWireguardConfig(data: { device: string; isLocal: boolean }): string;
  /** Legacy download file URL using both REST api and JSON RPC */
  downloadUrl(data: { fileId: string }): string;
  /** Static URL to download all user actions logs */
  userActionLogsUrl(): string;
  /** Per container URL to download all of its logs */
  containerLogsUrl(data: { containerName: string }): string;
  /** Upload file to Dappnode and get a fileId */
  uploadFile(file: File, onProgress: (data: { loaded: number; total: number }) => void): Promise<{ fileId: string }>;
  /** Create an encrypted full backup. Requires the admin password; download it with downloadUrl */
  createFullBackup(data: {
    adminPassword: string;
    password: string;
    keepValidatorsStopped: boolean;
    skipValidatorData: boolean;
  }): Promise<FullBackupCreateResult>;
  /** URL to download a backup kept on the node (fullBackupPendingGet). Works any number of times */
  fullBackupPendingUrl(data: { fileName: string }): string;
  /** Decrypt the manifest of an uploaded backup and get the restore plan. Changes nothing */
  inspectFullBackup(data: { fileId: string; password: string }): Promise<FullBackupInspectResult>;
  /** Start restoring an uploaded backup. Requires the admin password; follow with fullBackupRestoreStatus */
  restoreFullBackup(data: {
    adminPassword: string;
    fileId: string;
    password: string;
    mode: FullBackupRestoreMode;
    /** Restore packages only: packages whose backed-up data is written */
    restoreDataFor?: string[];
    confirmValidatorsOff: boolean;
  }): Promise<{ ok: true }>;
}

export interface IApiRpc {
  start(apiEventBridge: Emitter, onConnect: () => void, onError: (errorMessage: string) => void): void;
  call<R>(payload: RpcPayload): Promise<RpcResponse<R>>;
}

export interface IApi {
  auth: IApiAuth;
  rpc: IApiRpc;
}
