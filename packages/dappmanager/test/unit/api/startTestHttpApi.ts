import fs from "fs";
import os from "os";
import path from "path";
import { AddressInfo } from "net";
import type express from "express";
import type { EventBus } from "@dappnode/eventbus";
import type { Routes } from "@dappnode/types";
import { startHttpApi } from "../../../src/api/startHttpApi.js";
import { AdminPasswordDb } from "../../../src/api/auth/adminPasswordDb.js";

export interface TestHttpApi {
  host: string;
  baseUrl: string;
  adminPasswordDb: AdminPasswordDb;
  close: () => Promise<void>;
}

/**
 * Start the real HTTP API on a random port, with stub routes and no admin registered
 */
export async function startTestHttpApi(corsWhitelist: string[]): Promise<TestHttpApi> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dappmanager-http-api-test-"));
  const params = {
    AUTH_IP_ALLOW_LOCAL_IP: false,
    HTTP_API_PORT: 0,
    UI_FILES_PATH: tmpDir,
    HTTP_CORS_WHITELIST: corsWhitelist,
    ADMIN_RECOVERY_FILE: path.join(tmpDir, "recovery.txt"),
    SESSIONS_SECRET_FILE: path.join(tmpDir, "sessions-secret.txt"),
    ADMIN_PASSWORDS_JSON_FILE: path.join(tmpDir, "passwords.json"),
    ADMIN_STATUS_JSON_FILE: path.join(tmpDir, "status.json"),
    SESSIONS_MAX_TTL_MS: 60_000,
    SESSIONS_TTL_MS: 60_000
  };
  // Report how the body was parsed without reflecting request data
  const describeBody: express.RequestHandler = (req, res) => {
    const body: unknown = req.body;
    res.json({ bodyType: typeof body, bodyLength: typeof body === "string" ? body.length : null });
  };
  const notUsed = (): void => {
    throw Error("not used");
  };
  const noop = (_req: unknown, _res: unknown, next: () => void): void => next();
  const adminPasswordDb = new AdminPasswordDb(params);

  const server = startHttpApi({
    params,
    logs: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
    routes: {
      containerLogs: notUsed,
      dataSend: describeBody,
      download: notUsed,
      downloadUserActionLogs: notUsed,
      downloadWireguardConfig: notUsed,
      env: notUsed,
      fileDownload: notUsed,
      fullBackupCreate: notUsed,
      fullBackupInspect: notUsed,
      fullBackupRestore: notUsed,
      globalEnvs: notUsed,
      packageManifest: notUsed,
      metrics: notUsed,
      publicPackagesData: notUsed,
      sign: describeBody,
      upload: notUsed
    },
    limiterMiddleware: noop,
    counterViewsMiddleware: noop,
    ethForwardMiddleware: noop,
    routesLogger: {},
    methods: {} as Routes,
    subscriptionsLogger: {},
    adminPasswordDb,
    eventBus: fakeEventBus,
    isNewDappmanagerVersion: () => false,
    getIpfsFileBytes: async () => new Uint8Array()
  });
  if (!server.listening) await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  const host = `127.0.0.1:${port}`;

  return {
    host,
    baseUrl: `http://${host}`,
    adminPasswordDb,
    close: async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  };
}

// mapSubscriptionsToEventBus only registers listeners and emits initial requests
const fakeEventBus = new Proxy(
  {},
  {
    get: () => ({ on: () => {}, emit: () => {} })
  }
) as unknown as EventBus;
