import fs from "fs";
import * as db from "../../db";
import { changeEthMultiClient } from "./changeEthMultiClient";
import { listContainerNoThrow } from "../docker/listContainers";
import { dockerVolumesList, dockerDf } from "../docker/dockerApi";
import { dockerRm, dockerVolumeRm } from "../docker/dockerCommands";
import { ComposeFileEditor } from "../compose/editor";
import { migrateVolume } from "../hostScripts";
import * as getPath from "../../utils/getPath";
import shell from "../../utils/shell";
import { logs } from "../../logs";
import { EthClientTargetPackage } from "../../types";

const ethchainDnpName = "ethchain.dnp.dappnode.eth";

const ethchainVolumes = {
  data: "dncore_ethchaindnpdappnodeeth_data",
  geth: "dncore_ethchaindnpdappnodeeth_geth",
  identity: "dncore_ethchaindnpdappnodeeth_identity",
  ipc: "dncore_ethchaindnpdappnodeeth_ipc"
};
const openEthereumVolumes = {
  data: "openethereumdnpdappnodeeth_data"
};
const gethVolumes = {
  data: "gethdnpdappnodeeth_geth"
};

interface EthchainEnvs {
  EXTRA_OPTS?: string; // --warp-barrier 9530000
  EXTRA_OPTS_GETH?: string; // --syncmode light
  DEFAULT_CLIENT?: string; // PARITY
}

/**
 * Migrate old core package DNP_ETHCHAIN to the new format
 * 1. Get ETHCHAIN config and which client. Then delete configs
 * 2. Move volumes in the host
 * 3. Install new package with existing settings
 */
export async function migrateEthchain(): Promise<void> {
  // Get ETHCHAIN's current status
  const ethchainContainer = await listContainerNoThrow(ethchainDnpName);
  // If ethchain compose does not exist, returns {}
  const userSettings = ComposeFileEditor.getUserSettingsIfExist(
    ethchainDnpName,
    true
  );
  const ethchainServiceName =
    Object.keys(userSettings.environment || {})[0] || ethchainDnpName;
  const envs: EthchainEnvs =
    (userSettings.environment || {})[ethchainServiceName] || {};

  const volumes = await dockerVolumesList();
  const isNextOpenEthereum = /parity/i.test(envs.DEFAULT_CLIENT || "");
  let target: EthClientTargetPackage = isNextOpenEthereum
    ? "openethereum"
    : "geth";
  let EXTRA_OPTS =
    (isNextOpenEthereum ? envs.EXTRA_OPTS : envs.EXTRA_OPTS_GETH) || "";
  // Store settings in the cache. It is possible that the migration is stopped
  // because the DAPPMANAGER resets and then the eth client will not be installed
  if (ethchainContainer)
    db.ethClientMigrationTempSettings.set({ target, EXTRA_OPTS });

  const volumesToMigrate = [
    {
      id: "OpenEthereum data volume",
      from: ethchainVolumes.data,
      to: openEthereumVolumes.data
    },
    {
      id: "Geth data volume",
      from: ethchainVolumes.geth,
      to: gethVolumes.data
    }
  ]
    // Only migrate volumes that exists and their target does not
    .filter(
      ({ from, to }) =>
        volumes.find(vol => vol.Name === from) &&
        !volumes.find(vol => vol.Name === to)
    );

  const volumesToRemove = [
    {
      id: "legacy identity volume",
      name: ethchainVolumes.identity
    },
    {
      id: "legacy IPC volume",
      name: ethchainVolumes.ipc
    }
  ].filter(({ name }) => volumes.find(vol => vol.Name === name));

  // Non-blocking step of uninstalling the DNP_ETHCHAIN
  if (ethchainContainer)
    try {
      await dockerRm(ethchainContainer.containerId);
      logs.info("Removed ETHCHAIN package");

      // Clean manifest and docker-compose
      for (const filepath of [
        getPath.dockerCompose(ethchainDnpName, true),
        getPath.manifest(ethchainDnpName, true)
      ])
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    } catch (e) {
      logs.error("Error removing ETHCHAIN package", e);
    }

  // Non-blocking step of migrating old volumes with a host script
  for (const { id, from, to } of volumesToMigrate) {
    try {
      // Remove all packages that are using the volume to safely move it
      const containerIdsUsingVolume = await shell(
        `docker ps -aq --filter volume=${from}`
      );
      if (containerIdsUsingVolume)
        await shell(`docker rm -f ${containerIdsUsingVolume}`);
      // mv the docker var lib folder in the host context
      await migrateVolume(from, to);
      logs.info(`Migrated ETHCHAIN ${id}`, { from, to });
    } catch (e) {
      logs.error(`Error migrating ETHCHAIN ${id}`, e);
    }
  }
  // Optimization to only run `docker system df -v` once, can run for +15s
  if (volumesToMigrate.length > 0)
    try {
      // Make sure the volume was migrated successfully before removing it
      const { Volumes } = await dockerDf({ noCache: true });
      for (const { id, from } of volumesToMigrate) {
        const fromVol = Volumes.find(vol => vol.Name === from);
        if (!fromVol)
          logs.warn(`Did not delete ETHCHAIN ${id} ${from}, not found`);
        else if (fromVol.UsageData.Size > 0)
          logs.warn(`Did not delete ETHCHAIN ${id} ${from}, not empty`);
        else
          try {
            await shell(`docker volume rm -f ${from}`);
            logs.info(`Deleted ETHCHAIN ${id} ${from}`);
          } catch (e) {
            logs.error(`Error deleting ETHCHAIN ${id} ${from}`, e);
          }
      }
    } catch (e) {
      logs.error(`Error deleting ETHCHAIN volumes`, e);
    }

  for (const { id, name } of volumesToRemove) {
    try {
      // Remove all packages that are using the volume to safely move it
      const containerIdsUsingVolume = await shell(
        `docker ps -aq --filter volume=${name}`
      );
      if (containerIdsUsingVolume)
        throw Error(`Volume is used by ${containerIdsUsingVolume}`);
      await dockerVolumeRm(name);
      logs.info(`Removed ETHCHAIN ${id}`);
    } catch (e) {
      logs.error(`Error removing ETHCHAIN ${id}`, e);
    }
  }

  // Install new package. fullnode.dappnode is assigned after install
  const migrationTempSettings = db.ethClientMigrationTempSettings.get();
  if (ethchainContainer || migrationTempSettings) {
    logs.info(`Installing eth multi-client ${target}`, { EXTRA_OPTS });

    if (migrationTempSettings) {
      target = migrationTempSettings.target || target;
      EXTRA_OPTS = migrationTempSettings.EXTRA_OPTS || EXTRA_OPTS;
    }

    await changeEthMultiClient(target, false, {
      portMappings: userSettings.portMappings,
      environment: { [ethchainServiceName]: EXTRA_OPTS ? { EXTRA_OPTS } : {} }
    });

    // Once the client has been successfully changed, delete temp migration settings
    db.ethClientMigrationTempSettings.set(null);
  }
}
