import autobahn from "autobahn";
import * as eventBus from "./eventBus";
import logUserAction from "./logUserAction";
import { registerHandler } from "./registerHandler";
import { registerSubscriptions } from "./registerSubscriptions";
import params from "./params";
import * as db from "./db";
import { convertLegacyEnvFiles } from "./utils/configFiles";
import initializeDb from "./initializeDb";
import * as globalEnvsFile from "./utils/globalEnvsFile";
import { generateKeyPair } from "./utils/publickeyEncryption";
import { PackageNotification } from "./types";
import { copyHostScripts } from "./modules/hostScripts";
import * as calls from "./calls";
import runWatchers from "./watchers";
import Logs from "./logs";
const logs = Logs(module);

// Print version data
import "./utils/getVersionData";

// Start HTTP API
import "./httpApi";

// Start watchers
runWatchers();

// Generate keypair, network stats, and run dyndns loop
initializeDb();

// Create the global env file
globalEnvsFile.createFile();
globalEnvsFile.setEnvs({ [params.GLOBAL_ENVS.ACTIVE]: "true" });

// Create local keys for NACL public encryption
if (!db.naclPublicKey.get() || !db.naclSecretKey.get()) {
  const { publicKey, secretKey } = generateKeyPair();
  db.naclPublicKey.set(publicKey);
  db.naclSecretKey.set(secretKey);
}

// Initial calls to check this DAppNode's status
calls
  .passwordIsSecure()
  .then(({ result }) => {
    logs.info("Host user password is " + (result ? "secure" : "INSECURE"));
  })
  .catch(e => {
    logs.error(`Error checking if host user password is secure: ${e.message}`);
  });

/*
 * Connection configuration
 * ************************
 * Autobahn.js connects to the WAMP, whos url in defined in params.js
 * On connection open:
 * - all handlers are registered
 * - the native event bus is linked to the session to:
 *   - allow internal calls
 *   - publish progress logs and userAction logs
 * - it subscribe to userAction logs sent by the VPN to store them locally
 */
const url = params.autobahnUrl;
const realm = params.autobahnRealm;
const connection = new autobahn.Connection({ url, realm });

connection.onopen = (session, details): void => {
  logs.info(`Connected to DAppNode's WAMP
  url:     ${url}
  realm:   ${realm}
  session: ${(details || {}).authid}`);

  registerHandler(
    session,
    "ping.dappmanager.dnp.dappnode.eth",
    async (x: string) => ({ message: "ping", result: x })
  );
  for (const [callId, callHandler] of Object.entries(calls)) {
    registerHandler(
      session,
      callId + ".dappmanager.dnp.dappnode.eth",
      callHandler
    );
  }

  /**
   * All the session uses below can throw errors if the session closes.
   * so each single callback is wrapped in a try/catch block,
   * via the `eventBusOnSafe` method
   */

  const wampSubscriptions = registerSubscriptions(session, logs);

  // Pipe local events to WAMP
  eventBus.chainData.on(wampSubscriptions.chainData.emit);
  eventBus.logUi.on(wampSubscriptions.progressLog.emit);
  eventBus.logUserAction.on(wampSubscriptions.userActionLog.emit);
  eventBus.packages.on(wampSubscriptions.packages.emit);
  eventBus.directory.on(wampSubscriptions.directory.emit);

  // Emit the list of packages
  eventBus.requestPackages.on(async () => {
    const dnpList = (await calls.listPackages()).result;
    wampSubscriptions.packages.emit(dnpList);
    const volumes = (await calls.volumesGet()).result;
    wampSubscriptions.volumes.emit(volumes);
  });

  // Emits the auto update data (settings, registry, pending)
  eventBus.requestAutoUpdateData.on(async () => {
    const autoUpdateData = (await calls.autoUpdateDataGet()).result;
    wampSubscriptions.autoUpdateData.emit(autoUpdateData);
  });

  // Receives userAction logs from the VPN nodejs app
  wampSubscriptions.logUserActionToDappmanager.on(userActionLog => {
    logUserAction.log(userActionLog);
  });

  // Store notification in DB and push it to the UI
  eventBus.notification.on((notification: PackageNotification) => {
    db.notification.set(notification.id, notification);
    wampSubscriptions.pushNotification.emit(notification);
  });

  /**
   * Initial calls when WAMP is active
   * - When the DAPPMANAGER starts, update the list of packages.
   *   The DAPPMANAGER may restart without the UI being restarted
   */
  eventBus.requestAutoUpdateData.emit();
  eventBus.requestPackages.emit();
};

connection.onclose = (reason, details): boolean => {
  logs.warn(
    `WAMP connection closed: ${reason} ${(details || {}).message || ""}`
  );
  return false;
};

connection.open();
logs.info(`Attempting WAMP connection to ${url}, realm: ${realm}`);

/**
 * [LEGACY] The previous method of injecting ENVs to a DNP was via .env files
 * This function will read the contents of .env files and add them in the
 * compose itself in the `environment` field in array format.
 *
 * [LEGACY] The DB is split into two where the old db becomes a cache only
 * and the new one is for permanent required data. Some key-values will be
 * moved from the old db to the cache db.
 */

async function runLegacyOps(): Promise<void> {
  try {
    db.migrateToNewMainDb();
  } catch (e) {
    logs.error(`Error migrating to new main DB: ${e.stack || e.message}`);
  }

  try {
    const { result: dnpList } = await calls.listPackages();
    for (const dnp of dnpList) {
      const hasConverted = convertLegacyEnvFiles(dnp);
      if (hasConverted)
        logs.info(`Converted ${dnp.name} .env file to compose environment`);
    }
    logs.info(`Finished converting legacy DNP .env files if any`);
  } catch (e) {
    logs.error(`Error converting DNP .env files: ${e.stack || e.message}`);
  }
}

runLegacyOps();

/**
 * Run initial opts
 * - Copy host scripts
 */

try {
  const { copied, removed } = copyHostScripts();
  let message = "Successfully run copyHostScripts.";
  if (copied.length) message += ` Copied ${copied.join(", ")}.`;
  if (removed.length) message += ` Removed ${removed.join(", ")}.`;
  logs.info(message);
} catch (e) {
  logs.error(`Error copying host scripts: ${e.stack}`);
}
