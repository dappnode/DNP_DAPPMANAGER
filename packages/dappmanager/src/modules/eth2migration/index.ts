import { eth2migrationParams } from "./params";

export async function eth2Migrate(testnet: boolean): Promise<void> {
  const network = testnet ? "prater" : "mainnet";
  const dnpName = testnet
    ? eth2migrationParams.testnet.dnpName
    : eth2migrationParams.mainnet.dnpName;
  const containerName = testnet
    ? eth2migrationParams.testnet.validatorContainerName
    : eth2migrationParams.mainnet.validatorContainerName;

  // 1. Check requirements
  // 2. Backup keystores and slashing protection in docker volume
  // 3. Verify backup was generated in docker volume
  // 4. Stop and remove validator container (no its volumes)
  // 5. Export keystores and slashing protection from docker volume to web3signer
  // 6. Start web3signer container
  // 7. Delete validator docker volumes
}
