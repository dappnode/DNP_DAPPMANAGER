export async function rollbackToPrysmOld(): Promise<void> {
  throw new Error("Method not implemented.");

  // Validate with Prysm old
  // - Web3signer delete completely burn to death, volumes and everything
  // - Move .eth2validators.backup to .eth2validators
  // - Install last version of Prysm old capable of validating
  //   - Beacon chain volume should exist
  //   - Validator volume should exist
}
