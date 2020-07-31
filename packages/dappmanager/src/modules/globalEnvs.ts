import fs from "fs";
import { mapKeys } from "lodash";
import * as db from "../db";
import params from "../params";
import { stringifyEnvironment } from "../modules/compose";

export type GlobalEnvs = {
  [K in keyof typeof params.GLOBAL_ENVS]: string;
};

/**
 * Compute global ENVs from DB values
 */
export function computeGlobalEnvsFromDb(): GlobalEnvs {
  return {
    ACTIVE: "true",
    INTERNAL_IP: db.internalIp.get(),
    STATIC_IP: db.staticIp.get(),
    HOSTNAME: db.staticIp.get() || db.domain.get(),
    UPNP_AVAILABLE: db.upnpAvailable.get() ? "true" : "false",
    NO_NAT_LOOPBACK: db.noNatLoopback.get() ? "true" : "false",
    DOMAIN: db.domain.get(),
    PUBKEY: db.dyndnsIdentity.get().publicKey,
    ADDRESS: db.dyndnsIdentity.get().address,
    PUBLIC_IP: db.publicIp.get(),
    SERVER_NAME: db.serverName.get()
  };
}

export const globalEnvsFilePath = params.GLOBAL_ENVS_PATH_NODE;

export function getGlobalEnvsFilePath(isCore: boolean): string {
  return isCore ? params.GLOBAL_ENVS_PATH_CORE : params.GLOBAL_ENVS_PATH_DNP;
}

/**
 * Compute global ENVs from DB values and persist it to .env file
 */
export function writeGlobalEnvsToEnvFile(): void {
  writeEnvFile(globalEnvsFilePath, computeGlobalEnvsFromDb());
}

/**
 * Create a global ENVs file with only a sanity check value: { ACTIVE: "true" }
 */
export function createGlobalEnvsEnvFile(): void {
  if (!fs.existsSync(globalEnvsFilePath))
    writeEnvFile(globalEnvsFilePath, { ACTIVE: "true" } as GlobalEnvs);
}

/**
 * Write global ENVs in a file with a prefixed named as defined by params.GLOBAL_ENVS
 * Accepts and envs object
 * ```js
 * { HOSTNAME: "85.84.83.82", ... }
 * ```
 * and writes to disk
 * ```js
 * { "_DAPPNODE_GLOBAL_HOSTNAME": "85.84.83.82", ... }
 * ```
 * @param envs =
 */
function writeEnvFile(envPath: string, envs: GlobalEnvs): void {
  const envsWithPrefix = mapKeys(
    envs,
    (_0, key) => params.GLOBAL_ENVS[key as keyof typeof envs]
  );
  const envData = stringifyEnvironment(envsWithPrefix).join("\n");
  fs.writeFileSync(envPath, envData);
}
