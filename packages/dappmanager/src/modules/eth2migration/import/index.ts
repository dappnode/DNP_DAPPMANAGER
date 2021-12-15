/** Import validator public keys into eth2-client web3signer */
export async function importValidator(): Promise<void> {
  // CHECK REQUIREMENTS
  // 1. Verify web3signer is installed, if not install it WITHOUT starting it
  // Get web3signer volume to upload files: /opt/web3signer/key_files_tmp
  // IMPORT VALIDATOR
  // 1. Upload backup.zip with keys (and unzip) and wallet password into web3signer volume
  // 2. Upload slashing protection data into web3signer volume: https://docs.web3signer.consensys.net/en/latest/Reference/CLI/CLI-Subcommands/#eth2-import
  // RUN WEB3SIGNER
  // 2. Start web3signer (it will generate the validator_yaml files neecesary)
}
