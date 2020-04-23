import Logs from "../../logs";
import shell from "../../utils/shell";
import { dockerVolumesList } from "../docker/dockerApi";
import { dockerVolumeRm } from "../docker/dockerCommands";
const logs = Logs(module);

const oldBindVol = "dncore_binddnpdappnodeeth_data";
const newBindVol = "dncore_binddnpdappnodeeth_bind";

/**
 * After core version 0.2.30 there will be an orphan volume of the
 * DNP_BIND which should be removed for asthetic versions
 */
export async function removeLegacyBindVolume(): Promise<void> {
  const volumes = await dockerVolumesList();
  const volumeExists = (name: string): boolean =>
    volumes.some(vol => vol.Name === name);

  // nuevo-> dncore_binddnpdappnodeeth_bind
  // viejo-> dncore_binddnpdappnodeeth_data
  // Remove all packages that are using the volume to safely move it

  if (volumeExists(oldBindVol) && volumeExists(newBindVol)) {
    const usersOfOld = await shell(
      `docker ps -aq --filter volume=${oldBindVol}`
    );
    if (usersOfOld)
      throw Error(`legacy BIND volume ${oldBindVol} has users: ${usersOfOld}`);

    // Delete only if has no users
    await dockerVolumeRm(oldBindVol);
    logs.info(`Removed legacy BIND volume ${oldBindVol}`);
  }
}
