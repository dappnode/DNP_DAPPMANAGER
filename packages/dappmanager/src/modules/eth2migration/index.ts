import { exportValidator } from "./export";
import { importValidator } from "./import";
import { packageStartStop, packageRemove } from "../../calls";
import { getValidatorContainerSpecs, getMigrationParams } from "./utils";

export async function eth2Migrate(testnet: boolean): Promise<void> {
  // Get params deppending on the network
  const { network, dnpName, containerName } = getMigrationParams(testnet);

  try {
    // Get container and volume
    const { container, volume } = await getValidatorContainerSpecs(
      dnpName,
      containerName
    );

    // 1. Backup keystores and slashing protection in docker volume
    await exportValidator({ network, containerName, volume });
    // 2. Stop and remove validator container (no its volumes)
    if (container.running) packageStartStop({ dnpName });
    await packageRemove({ dnpName, deleteVolumes: false });
    // 3. Import validator: keystores and slashing protection from docker volume to web3signer
    await importValidator();
    // 4. Start web3signer container
    // 5. Delete validator docker volumes
  } catch (e) {
    throw Error(`Eth2 migration failed. ${e.message}`);
  }
}
