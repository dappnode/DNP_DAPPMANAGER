import shell from "../../../utils/shell";
import { eth2migrationParams } from "../params";
import { extendError } from "../../../utils/extendError";
import Dockerode from "dockerode";

/**
 * Check export requirements: paths and walletpassword.txt
 * @param containerName
 */
export async function checkExportRequirements({
  containerName,
  volume
}: {
  containerName: string;
  volume: Dockerode.Volume;
}): Promise<void> {
  try {
    // Volume exists in host
    if (!volume.name) throw Error(`Volume ${volume.name} not found`);
    // Container has walletdir and walletpassword file
    await shell(
      `docker exec ${containerName} ls ${eth2migrationParams.keys.walletPasswordFile}`
    ).catch(e => {
      throw extendError(e, "walletdir or/and walletpassword file not found");
    });
  } catch (e) {
    throw extendError(e, "Eth2 migration: backup requirements failed");
  }
}
