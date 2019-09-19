import params from "../params";
import fs from "fs";

const globalEnvsFile = params.GLOBAL_ENVS_FILE;

const NEWLINES_MATCH = /\n|\r|\r\n/;
const NAME_VALUE_SPLIT = /=(.*)/;

interface Envs {
  [name: string]: string;
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
  return envData.split(NEWLINES_MATCH).reduce(
    (envs, line) => {
      const [name, value] = line.trim().split(NAME_VALUE_SPLIT);
      return { ...envs, [name]: value || "" };
    },
    {} as Envs
  );
}

export function writeEnvFile(envPath: string, envs: Envs): void {
  const envData = Object.entries(envs)
    .map(([name, value]) => [name, value || ""].join("="))
    .join("\n");
  fs.writeFileSync(envPath, envData);
}
