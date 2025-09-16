import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { initializeDb } from "./initializeDb.js";
import {
  ensureIpv4Forward,
  recreateDappnode,
  copyHostScripts,
  copyHostServices,
  copyHostTimers
} from "@dappnode/hostscriptsservices";
import { DappnodeInstaller, getIpfsUrl, postRestartPatch } from "@dappnode/installer";
import * as calls from "./calls/index.js";
import { routesLogger, subscriptionsLogger, logs } from "@dappnode/logger";
import * as routes from "./api/routes/index.js";
import { params } from "@dappnode/params";
import { getVpnApiClient } from "./api/vpnApiClient.js";
import { getVersionData, isNewDappmanagerVersion } from "./utils/index.js";
import { createGlobalEnvsEnvFile } from "@dappnode/utils";
import { startAvahiDaemon, startDaemons } from "@dappnode/daemons";
import { executeMigrations } from "@dappnode/migrations";
import { startTestApi } from "./api/startTestApi.js";
import { getLimiter, getViewsCounterMiddleware, getEthForwardMiddleware } from "./api/middlewares/index.js";
import { AdminPasswordDb } from "./api/auth/adminPasswordDb.js";
import { DeviceCalls } from "./calls/device/index.js";
import { startHttpApi } from "./api/startHttpApi.js";
import { DappNodeDirectory, DappNodeRegistry, MultiUrlJsonRpcProvider } from "@dappnode/toolkit";
import { Consensus, Execution, MevBoost, Signer } from "@dappnode/stakers";

const controller = new AbortController();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Graceful shutdown
process.on("SIGINT", () => {
  controller.abort();
  server.close();
  process.exit(0);
});

// Initialize DB must be the first step so the db has the required values
initializeDb()
  .then(() => logs.info("Initialized Database"))
  .catch((e) => logs.error("Error inititializing Database", e));

let ipfsUrl = params.IPFS_LOCAL;
try {
  ipfsUrl = getIpfsUrl(); // Attempt to update with value from getIpfsUrl
} catch (e) {
  logs.error(`Error getting ipfsUrl: ${e.message}. Using default: ${ipfsUrl}`);
}

// Read and print version data
const versionData = getVersionData();
if (versionData.ok) logs.info("Version info", versionData.data);
else logs.error(`Error getting version data: ${versionData.message}`);

const providers = new MultiUrlJsonRpcProvider(
  [
    {
      url: "http://execution.mainnet.dncore.dappnode:8545",
      beaconchainUrl: "http://beacon-chain.mainnet.dncore.dappnode:8545",
      type: "local"
    },
    { url: params.ETH_MAINNET_RPC_URL_REMOTE, type: "remote" }
  ],
  {
    ["x-dappmanager-version"]: `${versionData.data.version}-${db.versionData.get().commit?.slice(0, 8)}`
  }
);

// Required db to be initialized
export const directory = new DappNodeDirectory(providers);
export const dappnodeInstaller = new DappnodeInstaller(ipfsUrl, providers);

export const publicRegistry = new DappNodeRegistry("public");

// TODO: find a way to move the below constants to the api itself
const vpnApiClient = getVpnApiClient(params);
const adminPasswordDb = new AdminPasswordDb(params);
const deviceCalls = new DeviceCalls({
  eventBus,
  adminPasswordDb,
  vpnApiClient
});

// Start HTTP API
const server = startHttpApi({
  params,
  logs,
  routes,
  limiterMiddleware: getLimiter(),
  counterViewsMiddleware: getViewsCounterMiddleware(),
  ethForwardMiddleware: getEthForwardMiddleware(),
  routesLogger,
  methods: { ...calls, ...deviceCalls },
  subscriptionsLogger,
  adminPasswordDb,
  eventBus,
  isNewDappmanagerVersion
});

// Start Test API
if (params.TEST) startTestApi();

// Create staker instances
export const execution = new Execution(dappnodeInstaller);
export const consensus = new Consensus(dappnodeInstaller);
export const mevBoost = new MevBoost(dappnodeInstaller);
export const signer = new Signer(dappnodeInstaller);

// Execute migrations
executeMigrations().catch((e) => logs.error("Error on executeMigrations", e));
// Start daemons
startDaemons(dappnodeInstaller, execution, consensus, signer, mevBoost, controller.signal);

Promise.all([
  // Copy host scripts
  copyHostScripts().catch((e) => logs.error("Error copying host scripts", e)),
  // Copy host services
  copyHostServices().catch((e) => logs.error("Error copying host services", e)),
  // Copy host timers
  copyHostTimers().catch((e) => logs.error("Error copying host timers", e))
]).then(() => {
  // ensure ipv4 forward
  ensureIpv4Forward().catch((e) => logs.error("Error ensuring ipv4 forward", e));
  // avahiDaemon uses a host script that must be copied before been initialized
  startAvahiDaemon().catch((e) => logs.error("Error starting avahi daemon", e));
  // start recreate-dappnode service with timer
  recreateDappnode().catch((e) => logs.error("Error starting service recreate dappnode", e));
});

// Create the global env file
createGlobalEnvsEnvFile();

// TODO: find a proper place for this
// Store pushed notifications in DB
eventBus.notification.on((notification) => {
  db.notificationPush(notification.id, notification);
});

// Initial calls to check this DAppNode's status
// TODO: find a proper place for this. Consider having a initial calls health check
calls
  .passwordIsSecure()
  .then((isSecure) => logs.info("Host password is", isSecure ? "secure" : "INSECURE"))
  .catch((e) => logs.error("Error checking if host user password is secure", e));

postRestartPatch().catch((e) => logs.error("Error on postRestartPatch", e));
