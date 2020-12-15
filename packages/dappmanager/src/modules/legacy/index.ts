import fs from "fs";
import { dockerVolumesList } from "../docker/api";
import { listPackages } from "../docker/list";
import { dockerRm, dockerVolumeRemove } from "../docker";
import { logs } from "../../logs";
import shell from "../../utils/shell";
import * as getPath from "../../utils/getPath";
import { migrateLegacyEnvFiles } from "./migrateLegacyEnvFiles";

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
export async function runLegacyActions(): Promise<void> {
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
        for (const container of dnp.containers)
          await dockerRm(container.containerName); // Remove / uninstall DNP
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
