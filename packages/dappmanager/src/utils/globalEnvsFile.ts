import params from "../params";
import path from "path";
import fs from "fs";
import { parseEnvironment, stringifyEnvironment } from "./dockerComposeParsers";
import { getDockerComposePath } from "./dockerComposeFile";

const globalEnvsFile = params.GLOBAL_ENVS_PATH_NODE;
export const envsPath = globalEnvsFile; // For testing

const NEWLINES_MATCH = /\n|\r|\r\n/;

interface Envs {
  [name: string]: string;
}

export function getRelativePathFromComposePath(
  composePath: string,
  _globalEnvsFile = globalEnvsFile // For testing
): string {
  const composeDir = path.parse(composePath).dir;
  return path.relative(composeDir, _globalEnvsFile);
}

export function getRelativePath(dnpName: string): string {
  const composePath = getDockerComposePath(dnpName);
  return getRelativePathFromComposePath(composePath);
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
