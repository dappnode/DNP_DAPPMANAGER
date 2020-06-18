import fs from "fs";
import { parseEnvironment } from "../compose";
import { ComposeFileEditor } from "../compose/editor";
import { packagesGet } from "../../calls";
import * as getPath from "../../utils/getPath";
import { logs } from "../../logs";
import { isNotFoundError } from "../../utils/node";

/**
 * [LEGACY] The previous method of injecting ENVs to a DNP was via .env files
 * This function will read the contents of .env files and add them in the
 * compose itself in the `environment` field in array format
 */
export async function migrateLegacyEnvFiles(): Promise<void> {
  try {
    const dnpList = await packagesGet();
    for (const { name, isCore } of dnpList) migrateLegacyEnvFile(name, isCore);
    logs.info("Finished migrating legacy DNP .env files if any");
  } catch (e) {
    logs.error("Error migrating DNP .env files", e);
  }
}

export function migrateLegacyEnvFile(name: string, isCore: boolean): boolean {
  const envFilePath = getPath.envFile(name, isCore);
  try {
    const envFileData = fs.readFileSync(envFilePath, "utf8");
    const envsArray = envFileData.trim().split("\n");

    const compose = new ComposeFileEditor(name, isCore);
    compose.service().mergeEnvs(parseEnvironment(envsArray));
    compose.service().omitDnpEnvFile();
    compose.write();

    fs.unlinkSync(envFilePath);
    logs.info(`Converted ${name} .env file to compose environment`);
    return true;
  } catch (e) {
    if (!isNotFoundError(e)) logs.error(`Error migrating ${name} .env file`, e);
    return false;
  }
}
