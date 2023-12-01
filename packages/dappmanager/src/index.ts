import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import initializeDb from "./initializeDb.js";
import {
  copyHostScripts,
  copyHostServices
} from "@dappnode/hostscriptsservices";
import {
  DappnodeInstaller,
  getEthUrl,
  getIpfsUrl,
  postRestartPatch
} from "@dappnode/installer";
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
import {
  getLimiter,
  getViewsCounterMiddleware,
  getEthForwardMiddleware
} from "./api/middlewares/index.js";
import { AdminPasswordDb } from "./api/auth/adminPasswordDb.js";
import { DeviceCalls } from "./calls/device/index.js";
import { startHttpApi } from "./api/startHttpApi.js";

const controller = new AbortController();

// TODO: find a way to move the velow constants to the api itself
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

// Execute migrations
executeMigrations().catch(e => logs.error("Error on executeMigrations", e));

// Initialize DB
initializeDb()
  .then(() => logs.info("Initialized Database"))
  .catch(e => logs.error("Error inititializing Database", e));

// Required db to be initialized
export const dappnodeInstaller = new DappnodeInstaller(
  getIpfsUrl(),
  await getEthUrl()
);

// Start daemons
startDaemons(dappnodeInstaller, controller.signal);

Promise.all([
  // Copy host scripts
  copyHostScripts().catch(e => logs.error("Error copying host scripts", e)),
  // Copy host services
  copyHostServices().catch(e => logs.error("Error copying host services", e))
]).then(() =>
  // avahiDaemon uses a host script that must be copied before been initialized
  startAvahiDaemon().catch(e => logs.error("Error starting avahi daemon", e))
);

// Create the global env file
createGlobalEnvsEnvFile();

// TODO: find a proper place for this
// Store pushed notifications in DB
eventBus.notification.on(notification => {
  db.notificationPush(notification.id, notification);
});

// Initial calls to check this DAppNode's status
// TODO: find a proper place for this. Consider having a initial calls health check
calls
  .passwordIsSecure()
  .then(isSecure =>
    logs.info("Host password is", isSecure ? "secure" : "INSECURE")
  )
  .catch(e => logs.error("Error checking if host user password is secure", e));

// Read and print version data
const versionData = getVersionData();
if (versionData.ok) logs.info("Version info", versionData.data);
else logs.error(`Error getting version data: ${versionData.message}`);

postRestartPatch().catch(e => logs.error("Error on postRestartPatch", e));

// Graceful shutdown
process.on("SIGINT", () => {
  controller.abort();
  server.close();
  process.exit(0);
});
