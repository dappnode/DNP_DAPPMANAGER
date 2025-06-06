import path from "path";
import { calls } from "../src/__mock-backend__";
import { startHttpApi } from "@dappnode/dappmanager/src/api/startHttpApi";
import { LoggerMiddleware } from "@dappnode/types";
import { eventBus } from "./eventBus";
import { AdminPasswordDb } from "@dappnode/dappmanager/src/api/auth/adminPasswordDb";

const testFileDir = "test_files";

const params = {
  AUTH_IP_ALLOW_LOCAL_IP: true,
  HTTP_API_PORT: process.env.PORT || 5000,
  UI_FILES_PATH: "./build",
  HTTP_CORS_WHITELIST: ["http://localhost:3000", "http://localhost:3001"],
  ADMIN_RECOVERY_FILE: path.join(testFileDir, "ADMIN_RECOVERY_FILE.txt"),
  SESSIONS_SECRET_FILE: path.join(testFileDir, "SESSIONS_SECRET_FILE.txt"),
  ADMIN_PASSWORDS_JSON_FILE: path.join(testFileDir, "ADMIN_PASSWORDS.json"),
  ADMIN_STATUS_JSON_FILE: path.join(testFileDir, "ADMIN_STATUS.json"),
  SESSIONS_MAX_TTL_MS: 24 * 60 * 60 * 100,
  SESSIONS_TTL_MS: 24 * 60 * 60 * 100
};

/* eslint-disable no-console */

const routesLogger: LoggerMiddleware = {
  onCall: (route, args) => console.log("RPC request", route, args),
  onSuccess: (route, result) => console.log("RPC result", route, result),
  onError: (route, error) => console.log("RPC error", route, error)
};
const subscriptionsLogger: LoggerMiddleware = {
  onCall: (route, args) => console.log("Subscription", route, args),
  onError: (route, error) => console.log("Subscription error", route, error)
};

startHttpApi({
  params,
  logs: {
    debug: console.log,
    info: console.log,
    warn: console.log,
    error: console.log
  },
  routes: {
    containerLogs: () => {},
    dataSend: () => {},
    download: () => {},
    downloadWireguardConfig: () => {},
    downloadUserActionLogs: () => {},
    env: () => {},
    fileDownload: () => {},
    globalEnvs: () => {},
    packageManifest: () => {},
    metrics: () => {},
    publicPackagesData: () => {},
    sign: () => {},
    upload: () => {}
  },
  limiterMiddleware: (_req, _res, next) => {
    next();
  },
  counterViewsMiddleware: (_req, _res, next) => {
    next();
  },
  ethForwardMiddleware: (_req, _res, next) => {
    next();
  },
  methods: calls,
  routesLogger,
  subscriptionsLogger,
  eventBus,
  isNewDappmanagerVersion: () => false,
  adminPasswordDb: new AdminPasswordDb(params)
});
