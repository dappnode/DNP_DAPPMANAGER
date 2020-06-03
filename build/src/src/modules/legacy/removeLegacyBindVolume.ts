import { logs } from "../../logs";
import shell from "../../utils/shell";
import { dockerVolumesList } from "../docker/dockerApi";
import { dockerVolumeRm } from "../docker/dockerCommands";

const oldBindVol = "dncore_binddnpdappnodeeth_data";
const newBindVol = "dncore_binddnpdappnodeeth_bind";

/**
 * After core version 0.2.30 there will be an orphan volume of the
 * DNP_BIND which should be removed for asthetic versions
 *
 * After core version 0.2.34 the new volume will become orphan and
 * must be removed for the bind state to be reset
 */
export async function removeLegacyBindVolume(): Promise<void> {
  const volumes = await dockerVolumesList();
  const volumeExists = (name: string): boolean =>
    volumes.some(vol => vol.Name === name);

  for (const volName of [oldBindVol, newBindVol])
    if (volumeExists(volName))
      try {
        const users = await shell(`docker ps -aq --filter volume=${volName}`);
        if (users) throw Error(`legacy volume ${volName} has users: ${users}`);

        // Delete only if has no users
        await dockerVolumeRm(volName);
        logs.info(`Removed legacy volume ${volName}`);
      } catch (e) {
        logs.error(`Error removing legacy volume ${volName}`, e);
      }
}
