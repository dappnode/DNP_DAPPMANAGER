import { GlobalEnvs, GLOBAL_ENVS } from "@dappnode/types";
import { params } from "@dappnode/params";
import fs from "fs";
import { mapKeys } from "lodash-es";
import { stringifyEnvironment } from "./environment.js";

export const globalEnvsFilePath = params.GLOBAL_ENVS_PATH;

/**
 * Create a global ENVs file with only a sanity check value: { ACTIVE: "true" }
 */
export function createGlobalEnvsEnvFile(): void {
  if (!fs.existsSync(globalEnvsFilePath)) writeEnvFile(globalEnvsFilePath, { ACTIVE: "true" } as GlobalEnvs);
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
export function writeEnvFile(envPath: string, envs: GlobalEnvs): void {
  const envsWithPrefix = mapKeys(envs, (_0, key) => GLOBAL_ENVS[key as keyof typeof envs]);
  const envData = stringifyEnvironment(envsWithPrefix).join("\n");
  fs.writeFileSync(envPath, envData);
}
