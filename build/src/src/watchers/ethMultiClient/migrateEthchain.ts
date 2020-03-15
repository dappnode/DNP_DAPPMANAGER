import fs from "fs";
import { listContainerNoThrow } from "../../modules/docker/listContainers";
import { dockerVolumesList } from "../../modules/docker/dockerApi";
import { dockerRm } from "../../modules/docker/dockerCommands";
import { changeEthMultiClient } from ".";
import { migrateEthchainVolumes } from "../../modules/hostScripts";
import { getUserSettingsSafe } from "../../utils/dockerComposeFile";
import * as getPath from "../../utils/getPath";
import Logs from "../../logs";
const logs = Logs(module);

const ethchainDnpName = "ethchain.dnp.dappnode.eth";
const ethchainVolumePrefix = "dncore_ethchaindnpdappnodeeth";

/**
 * Migrate old core package DNP_ETHCHAIN to the new format
 * 1. Get ETHCHAIN config and which client. Then delete configs
 * 2. Move volumes in the host
 * 3. Install new package with existing settings
 */
export default async function migrateEthchain(): Promise<void> {
  const ethchain = await listContainerNoThrow(ethchainDnpName);
  const volumes = await dockerVolumesList();
  // If ethchain compose does not exist, returns {}
  const userSettings = getUserSettingsSafe(ethchainDnpName, true);

  // Non-blocking step of uninstalling the DNP_ETHCHAIN
  if (ethchain)
    try {
      await dockerRm(ethchain.id);
      logs.info("Removed ETHCHAIN package");

      // Clean manifest and docker-compose
      for (const filepath of [
        getPath.dockerCompose(ethchainDnpName, true),
        getPath.manifest(ethchainDnpName, true)
      ])
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    } catch (e) {
      logs.error(`Error removing ETHCHAIN package: ${e.stack}`);
    }

  // Non-blocking step of migrating old volumes with a host script
  if (volumes.some(vol => vol.Name.startsWith(ethchainVolumePrefix)))
    try {
      await migrateEthchainVolumes();
      logs.info("Migrated ETHCHAIN volumes");
    } catch (e) {
      logs.error(`Error migrating ETHCHAIN volumes: ${e.stack}`);
    }

  // Install new package. fullnode.dappnode is assigned after install
  if (ethchain) {
    const envs: {
      EXTRA_OPTS?: string; // --warp-barrier 9530000
      EXTRA_OPTS_GETH?: string; // --syncmode light
      DEFAULT_CLIENT?: string; // PARITY
    } = ethchain.envs || userSettings.environment || {};

    const isParity = /parity/i.test(envs.DEFAULT_CLIENT || "");
    const target = isParity ? "parity" : "geth";
    const EXTRA_OPTS = isParity ? envs.EXTRA_OPTS : envs.EXTRA_OPTS_GETH;

    await changeEthMultiClient(target, false, {
      portMappings: userSettings.portMappings,
      environment: EXTRA_OPTS ? { EXTRA_OPTS } : undefined
    });
  }
}
