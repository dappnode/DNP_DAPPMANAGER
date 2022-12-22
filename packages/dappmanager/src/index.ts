import { AbortController } from "abort-controller";
import * as db from "./db";
import { eventBus } from "./eventBus";
import initializeDb from "./initializeDb";
import { createGlobalEnvsEnvFile } from "./modules/globalEnvs";
import { generateKeyPair } from "./utils/publickeyEncryption";
import { copyHostScripts } from "./modules/hostScripts";
import { postRestartPatch } from "./modules/installer/restartPatch";
import { startDaemons } from "./daemons";
import { SshManager } from "./modules/sshManager";
import * as calls from "./calls";
import { routesLogger, subscriptionsLogger } from "./api/logger";
import * as routes from "./api/routes";
import { logs } from "./logs";
import params from "./params";
import { getVpnApiClient } from "./api/vpnApiClient";
import {
  getVersionData,
  isNewDappmanagerVersion
} from "./utils/getVersionData";
import { shellHost } from "./utils/shell";
import { startDappmanager } from "./startDappmanager";
import { copyHostServices } from "./modules/hostServices/copyHostServices";
import { startAvahiDaemon } from "./daemons/avahi";
import { executeMigrations } from "./modules/migrations";
import { startTestApi } from "./api/startTestApi";
import {
  getLimiter,
  getViewsCounterMiddleware,
  getEthForwardMiddleware
} from "./api/middlewares";

const controller = new AbortController();

const vpnApiClient = getVpnApiClient(params);
const sshManager = new SshManager({ shellHost });

// Start HTTP API
const server = startDappmanager({
  params,
  logs,
  routes,
  limiterMiddleware: getLimiter(),
  counterViewsMiddleware: getViewsCounterMiddleware(),
  ethForwardMiddleware: getEthForwardMiddleware(),
  routesLogger,
  methods: calls,
  subscriptionsLogger,
  eventBus,
  isNewDappmanagerVersion,
  vpnApiClient,
  sshManager
});

// Start Test API
if (params.TEST) startTestApi();

// Execute migrations
executeMigrations().catch(e => logs.error("Error on executeMigrations", e));

// Initialize DB
initializeDb()
  .then(() => logs.info("Initialized Database"))
  .catch(e => logs.error("Error inititializing Database", e));

// Start daemons
startDaemons(controller.signal);

Promise.all([
  // Copy host services
  copyHostServices().catch(e => logs.error("Error copying host services", e)),
  copyHostScripts().catch(e => logs.error("Error copying host scripts", e)) // Copy hostScripts
]).then(() =>
  // avahiDaemon uses a host script that must be copied before been initialized
  startAvahiDaemon().catch(e => logs.error("Error starting avahi daemon", e))
);

// Create the global env file
createGlobalEnvsEnvFile();

// Create local keys for NACL public encryption
if (!db.naclPublicKey.get() || !db.naclSecretKey.get()) {
  const { publicKey, secretKey } = generateKeyPair();
  db.naclPublicKey.set(publicKey);
  db.naclSecretKey.set(secretKey);
}

// TODO: find a proper place for this
// Store pushed notifications in DB
eventBus.notification.on(notification => {
  db.notificationPush(notification.id, notification);
});

// Initial calls to check this DAppNode's status
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
