import fs from "fs";
import { listContainerNoThrow } from "../modules/docker/listContainers";
import { dockerRm } from "../modules/docker/dockerCommands";
import * as getPath from "../utils/getPath";
import { logs } from "../logs";

const ethforwardName = "ethforward.dnp.dappnode.eth";

/**
 * DNP_ETHFORWARD functionality has been moved to the DAPPMANAGER
 * The migration is just deleting the container and clearing it's assets
 */
export async function migrateEthForward(): Promise<void> {
  const ethforward = await listContainerNoThrow(ethforwardName);
  if (ethforward) {
    // Remove / uninstall ETHFORWARD
    await dockerRm(ethforward.id);

    // Clean manifest and docker-compose
    for (const filepath of [
      getPath.dockerCompose(ethforwardName, true),
      getPath.manifest(ethforwardName, true)
    ])
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    logs.info(`Migrated (deleted) ETHFORWARD`);
  }
}
