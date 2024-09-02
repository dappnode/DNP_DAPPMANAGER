import { runScript } from "../runScripts.js";

/**
 * Dangerously move a docker volume in the host docker root dir
 * @param fromVolumeName "dncore_ethchaindnpdappnodeeth_geth"
 * @param toVolumeName "gethdnpdappnodeeth_geth"
 */
export async function migrateVolume(fromVolumeName: string, toVolumeName: string): Promise<void> {
  for (const [id, name] of Object.entries({ fromVolumeName, toVolumeName })) {
    // Make sure a wrong path is not created, and prevent "../../" paths
    if (!name) throw new Error(`${id} must not be empty`);
    if (/(\.){2,}/.test(name)) throw Error(`${id} must not contain '..'`);
    if (/\//.test(name)) throw Error(`${id} must not be a path`);
  }

  await runScript("migrate_volume.sh", `${fromVolumeName} ${toVolumeName}`);
}
