import { logs } from "../../logs";
import shell from "../../utils/shell";
import {
  dockerVolumesList,
  dockerVolumeRemove,
  dockerContainerRemove
} from "../docker";
import { listPackages } from "../docker/list";
import * as getPath from "../../utils/getPath";
import fs from "fs";
import { InstalledPackageData } from "@dappnode/common";
import { isNotFoundError } from "../../utils/node";
import { parseEnvironment } from "../compose";
import { ComposeFileEditor } from "../compose/editor";

const volumesToRemove = [
  // After core version 0.2.30 there will be an orphan volume of the
  // DNP_BIND which should be removed for asthetic versions
  "dncore_binddnpdappnodeeth_data",
  // After core version 0.2.34 the new volume will become orphan and
  // must be removed for the bind state to be reset
  "dncore_binddnpdappnodeeth_bind",
  // Volume shared between ADMIN and VPN to share credentials
  "vpndnpdappnodeeth_shared"
];

const dnpsToRemove = [
  // WAMP has been substituted by an internal module in the DAPPMANAGER
  "wamp.dnp.dappnode.eth",
  // The ADMIN UI is now served from the DAPPMANAGER
  "admin.dnp.dappnode.eth",
  // DNP_ETHFORWARD functionality has been moved to the DAPPMANAGER
  // The migration is just deleting the container and clearing it's assets
  "ethforward.dnp.dappnode.eth"
];

/**
 * Bundle legacy ops to prevent spamming the docker API
 */
export async function removeLegacyDockerAssets(): Promise<void> {
  const dnpList = await listPackages();
  const volumes = await dockerVolumesList();

  migrateLegacyEnvFiles(dnpList).catch(e =>
    logs.error("Error migrate env_files", e)
  );

  // Remove legacy volumes
  for (const volName of volumesToRemove)
    if (volumes.some(vol => vol.Name === volName))
      try {
        const users = await shell(`docker ps -aq --filter volume=${volName}`);
        // Delete only if has no users
        if (users) throw Error(`legacy volume ${volName} has users: ${users}`);
        await dockerVolumeRemove(volName);
        logs.info(`Removed legacy volume ${volName}`);
      } catch (e) {
        logs.error(`Error removing legacy volume ${volName}`, e);
      }

  // Remove legacy containers
  for (const dnpName of dnpsToRemove) {
    const dnp = dnpList.find(d => d.dnpName === dnpName);
    if (dnp)
      try {
        // Remove / uninstall DNP
        for (const container of dnp.containers)
          await dockerContainerRemove(container.containerName);

        // Clean manifest and docker-compose
        for (const filepath of [
          getPath.dockerCompose(dnpName, true),
          getPath.manifest(dnpName, true)
        ])
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

        logs.info(`Removed legacy DNP ${dnpName}`);
      } catch (e) {
        logs.error(`Error removing legacy DNP ${dnpName}`);
      }
  }
}

// Utils

/**
 * [LEGACY] The previous method of injecting ENVs to a DNP was via .env files
 * This function will read the contents of .env files and add them in the
 * compose itself in the `environment` field in array format
 */
export async function migrateLegacyEnvFiles(
  dnpList: InstalledPackageData[]
): Promise<void> {
  try {
    for (const dnp of dnpList) migrateLegacyEnvFile(dnp.dnpName, dnp.isCore);
    logs.info("Finished migrating legacy DNP .env files if any");
  } catch (e) {
    logs.error("Error migrating DNP .env files", e);
  }
}

export function migrateLegacyEnvFile(
  dnpName: string,
  isCore: boolean
): boolean {
  const envFilePath = getPath.envFile(dnpName, isCore);
  try {
    const envFileData = fs.readFileSync(envFilePath, "utf8");
    const envsArray = envFileData.trim().split("\n");

    const compose = new ComposeFileEditor(dnpName, isCore);
    const singleService = compose.firstService();
    if (singleService && singleService.serviceName === dnpName) {
      singleService.mergeEnvs(parseEnvironment(envsArray));
      singleService.omitDnpEnvFile();
      compose.write();

      fs.unlinkSync(envFilePath);
      logs.info(`Converted ${dnpName} .env file to compose environment`);
      return true;
    } else {
      throw Error(
        `Can not migrate ENVs for multi-service packages: ${dnpName}`
      );
    }
  } catch (e) {
    if (!isNotFoundError(e))
      logs.error(`Error migrating ${dnpName} .env file`, e);
    return false;
  }
}
