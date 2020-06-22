import params from "../params";
import fs from "fs";
import { parseEnvironment, stringifyEnvironment } from "../modules/compose";

const globalEnvsFile = params.GLOBAL_ENVS_PATH_NODE;
export const envsPath = globalEnvsFile; // For testing

const NEWLINES_MATCH = /\n|\r|\r\n/;

interface Envs {
  [name: string]: string;
}

export function getGlobalEnvsFilePath(isCore: boolean): string {
  return isCore ? params.GLOBAL_ENVS_PATH_CORE : params.GLOBAL_ENVS_PATH_DNP;
}

export function setEnvs(newEnvs: Envs): void {
  const globalEnvs = readEnvFile(globalEnvsFile);
  writeEnvFile(globalEnvsFile, {
    ...globalEnvs,
    ...newEnvs
  });
}

export function createFile(): void {
  if (!fs.existsSync(globalEnvsFile)) writeEnvFile(globalEnvsFile, {});
}

/**
 * Low level utils
 */

export function readEnvFile(envPath: string): Envs {
  if (!fs.existsSync(envPath)) writeEnvFile(envPath, {});

  const envData = fs.readFileSync(envPath, "utf8").trim();
  return parseEnvironment(envData.split(NEWLINES_MATCH));
}

export function writeEnvFile(envPath: string, envs: Envs): void {
  const envData = stringifyEnvironment(envs).join("\n");
  fs.writeFileSync(envPath, envData);
}
