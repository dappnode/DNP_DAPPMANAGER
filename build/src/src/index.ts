import params from "./params";
import * as db from "./db";
import { convertLegacyEnvFiles } from "./utils/configFiles";
import initializeDb from "./initializeDb";
import * as globalEnvsFile from "./utils/globalEnvsFile";
import { generateKeyPair } from "./utils/publickeyEncryption";
import { copyHostScripts } from "./modules/hostScripts";
import { migrateEthchain } from "./modules/ethClient";
import { migrateEthForward } from "./ethForward/migrateEthForward";
import { removeLegacyBindVolume } from "./modules/legacy/removeLegacyBindVolume";
import { migrateUserActionLogs } from "./logUserAction";
import { postRestartPatch } from "./modules/installer/restartPatch";
import { getVersionData } from "./utils/getVersionData";
import * as calls from "./calls";
import runWatchers from "./watchers";
import startEthForward from "./ethForward";
import startHttpApi from "./httpApi";
import { startAutobahn } from "./api";
import { logs } from "./logs";

// Start HTTP API
startHttpApi();

// Start WAMP Transport
startAutobahn({ url: params.autobahnUrl, realm: params.autobahnRealm });

// Start eth forward http proxy
startEthForward();

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
  .then(isSecure =>
    logs.info("Host password is", isSecure ? "secure" : "INSECURE")
  )
  .catch(e => logs.error("Error checking if host user password is secure", e));

// Read and print version data
const versionData = getVersionData();
if (versionData.ok) logs.info("Version info", versionData.data);
else logs.error(`Error getting version data: ${versionData.message}`);

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
    logs.error("Error migrating to new main DB", e);
  }

  try {
    const dnpList = await calls.listPackages();
    for (const dnp of dnpList) {
      const hasConverted = convertLegacyEnvFiles(dnp);
      if (hasConverted)
        logs.info(`Converted ${dnp.name} .env file to compose environment`);
    }
    logs.info("Finished converting legacy DNP .env files if any");
  } catch (e) {
    logs.error("Error converting DNP .env files", e);
  }

  migrateEthchain().catch(e => logs.error("Error migrating ETHCHAIN", e));

  migrateEthForward().catch(e => logs.error("Error migrating ETHFORWARD", e));

  removeLegacyBindVolume().catch(e =>
    logs.error("Error removing legacy BIND volume", e)
  );

  migrateUserActionLogs().catch(e =>
    logs.error("Error migrating userActionLogs", e)
  );
}

runLegacyOps();

/**
 * Run initial opts
 * - Copy host scripts
 * -
 */

copyHostScripts().catch(e => logs.error("Error copying host scripts", e));

postRestartPatch().catch(e => logs.error("Error on postRestartPatch", e));
