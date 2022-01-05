import { exportValidator } from "./export";
import { importValidator } from "./import";
import { packageStartStop, packageRemove } from "../../calls";
import { getValidatorContainerSpecs, getMigrationParams } from "./utils";
import { eth2migrationParams } from "./params";
import { extendError } from "../../utils/extendError";
import { getValidatorFiles } from "./validatorFiles/getValidatorFiles";

export async function eth2Migrate(testnet: boolean): Promise<void> {
  // Get params deppending on the network
  const { network, dnpName, containerName } = getMigrationParams(testnet);

  try {
    // Get container and volume of validator
    const { container, volume } = await getValidatorContainerSpecs(
      dnpName,
      containerName
    );

    // Get mainnet/testnet params
    const signerDnpName =
      network === "mainnet"
        ? eth2migrationParams.mainnet.signerDnpName
        : eth2migrationParams.testnet.signerDnpName;

    // 1. Backup keystores and slashing protection in docker volume
    await exportValidator({ network, containerName, volume });
    // 2. Get and validate validator files: keystore-x.json, walletpassword.txt, slashing_protection.json
    const validatorFiles = getValidatorFiles({ volume });
    // 3. Stop and remove validator container (no its volumes)
    if (container.running) packageStartStop({ dnpName });
    await packageRemove({ dnpName, deleteVolumes: false });

    try {
      // 4. Import validator: keystores and slashing protection from docker volume to web3signer
      await importValidator({ signerDnpName, validatorFiles });
      // 5. Start web3signer container
      // 6. Delete validator docker volumes
    } catch (e) {
      // Rollback and install Prysm again
      throw extendError(e, "Eth2 migration: import failed");
    }
  } catch (e) {
    throw extendError(e, "Eth2 migration failed");
  }
}
