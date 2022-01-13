import { shellHost } from "../../../utils/shell";
import Dockerode from "dockerode";
import { extendError } from "../../../utils/extendError";

/**
 * Verify content is in host volume:
 * - backup.zip and the unziped content (keystore_x.json)
 * - slashing_protection.json
 * - walletpassword.txt
 * @param volume
 */
export async function verifyExport(volume: Dockerode.Volume): Promise<void> {
  try {
    const volumeMountpoint = (await volume.inspect()).Mountpoint;
    await shellHost(
      `ls ${volumeMountpoint}/backup.zip ${volumeMountpoint}/keystore*.json ${volumeMountpoint}/slashing_protection.json ${volumeMountpoint}/walletpassword.txt`
    ).catch(e => {
      throw extendError(
        e,
        "backup.zip, keystore_x.json, slashing_protection.json or walletpassword.txt not found"
      );
    });
  } catch (e) {
    // Delete everything all exports in volume
    throw Error(`Eth2 migration: backup verification failed. ${e}`);
  }
}
