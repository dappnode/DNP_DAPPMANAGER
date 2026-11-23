import fs from "fs";
import path from "path";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { getLogUi } from "@dappnode/logger";
import { httpsPortal } from "@dappnode/httpsportal";
import {
  dockerComposeStop,
  dockerComposeUpPackage,
  dockerContainerStop,
  dockerPutArchive,
  listPackages
} from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { packageInstall } from "../calls/packageInstall.js";
import { packageRemove } from "../calls/packageRemove.js";
import { writeFullBackup } from "./create.js";
import { RestoreDeps } from "./restore.js";

const SNAPSHOTS_KEPT = 2;

export function getSnapshotDir(): string {
  return path.join(params.DNCORE_DIR, "full-backup-snapshots");
}

/** Keep only the latest snapshots: each one holds every secret of the node */
function pruneSnapshots(dir: string): void {
  const snapshots = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".dnbackup"))
    .map((name) => ({ name, mtime: fs.statSync(path.join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const { name } of snapshots.slice(SNAPSHOTS_KEPT)) fs.rmSync(path.join(dir, name), { force: true });
}

export const restoreDeps: RestoreDeps = {
  listPackages,

  async installPackage({ dnpName, version, origin, userSettings, start }) {
    const install = (v: string): Promise<void> =>
      packageInstall({
        name: dnpName,
        version: v,
        userSettings: { [dnpName]: userSettings },
        options: { INSTALL_STOPPED: !start }
      });
    try {
      await install(version);
    } catch (e) {
      // Installed by IPFS hash: that version may not be published in the registry
      if (!origin || origin === "dev" || origin === version) throw e;
      await install(origin);
    }
  },

  async applySettings({ dnpName, isCore, userSettings, start }) {
    const compose = new ComposeFileEditor(dnpName, isCore);
    compose.applyUserSettings(userSettings, { dnpName });
    compose.write();
    if (start) {
      await dockerComposeUpPackage({ composeArgs: { dnpName }, upAll: true });
    } else {
      // Recreate with the new settings, stopped, so data can be restored first
      await dockerComposeStop(compose.composePath);
      await dockerComposeUpPackage({
        composeArgs: { dnpName },
        upAll: true,
        dockerComposeUpOptions: { noStart: true }
      });
    }
  },

  async startPackage(dnpName) {
    await dockerComposeUpPackage({ composeArgs: { dnpName }, upAll: true });
  },

  async removePackage(dnpName) {
    await packageRemove({ dnpName, deleteVolumes: false });
  },

  async putArchive(containerName, dirPath, tarFilePath) {
    await dockerPutArchive(containerName, dirPath, fs.createReadStream(tarFilePath));
  },

  async stopContainer(containerName) {
    await dockerContainerStop(containerName);
  },

  getHttpsMappings: () => httpsPortal.getMappings(),
  addHttpsMapping: (mapping) => httpsPortal.addMapping(mapping),

  async writeSafetySnapshot(password) {
    const dir = getSnapshotDir();
    const { fileName } = await writeFullBackup({ password, outDir: dir });
    pruneSnapshots(dir);
    return `DNCORE/full-backup-snapshots/${fileName}`;
  },

  getGlobalEnvs: () => db.computeGlobalEnvsFromDb(true) as Record<string, unknown>,
  refreshGlobalEnvFile: () => db.writeGlobalEnvsToEnvFile(),
  progress: getLogUi("full-backup-restore")
};
