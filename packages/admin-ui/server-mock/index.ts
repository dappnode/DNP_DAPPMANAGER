import path from "path";
import * as methods from "./methods";
import { startHttpApi } from "../../dappmanager/src/api/startHttpApi";
import { LoggerMiddleware } from "../src/common/transport/types";
import { AdminPasswordDb } from "../../dappmanager/src/api/auth/adminPasswordDb";

const testFileDir = "test_files";

const params = {
  AUTH_IP_ALLOW_LOCAL_IP: true,
  HTTP_API_PORT: process.env.PORT || 5000,
  UI_FILES_PATH: "./build",
  HTTP_CORS_WHITELIST: ["http://localhost:3000", "http://localhost:3001"],
  ADMIN_PASSWORD_FILE: path.join(testFileDir, "ADMIN_PASSWORD_FILE.txt"),
  ADMIN_RECOVERY_FILE: path.join(testFileDir, "ADMIN_RECOVERY_FILE.txt"),
  SESSIONS_SECRET_FILE: path.join(testFileDir, "SESSIONS_SECRET_FILE.txt"),
  ADMIN_PASSWORDS_JSON_FILE: path.join(testFileDir, "ADMIN_PASSWORDS.json"),
  SESSIONS_MAX_TTL_MS: 24 * 60 * 60 * 100,
  SESSIONS_TTL_MS: 24 * 60 * 60 * 100,
  VPN_MAIN_ADMIN_ID: "dappnode_admin"
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

// Mock placeholder empty subscription object to allow compilation
const emptySubscription = { on: () => {}, emit: () => {} };

const adminPasswordDb = new AdminPasswordDb(params);

const server = startHttpApi({
  params,
  logs: {
    debug: console.log,
    info: console.log,
    warn: console.log,
    error: console.log
  },
  routes: {
    containerLogs: () => {},
    download: () => {},
    downloadUserActionLogs: () => {},
    globalEnvs: () => {},
    packageManifest: () => {},
    publicPackagesData: () => {},
    upload: () => {}
  },
  ethForwardMiddleware: (req, res, next) => {
    next();
  },
  methods,
  routesLogger,
  subscriptionsLogger,
  adminPasswordDb,
  eventBus: {
    chainData: emptySubscription,
    packagesModified: emptySubscription,
    directory: emptySubscription,
    packages: emptySubscription,
    logUi: emptySubscription,
    logUserAction: emptySubscription,
    notification: emptySubscription,
    requestChainData: emptySubscription,
    requestAutoUpdateData: emptySubscription,
    requestDevices: emptySubscription,
    requestPackages: emptySubscription,
    requestSystemInfo: emptySubscription,
    runNatRenewal: emptySubscription,
    initializedDb: emptySubscription,
    runEthClientInstaller: emptySubscription
  },
  isNewDappmanagerVersion: () => false
});

// Graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
