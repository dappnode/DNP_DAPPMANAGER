import { ValidatorFiles } from "../params";
import fs from "fs";
import Dockerode from "dockerode";

/**
 * Returns the validator files needed for the import process:
 * - validator_keystore_x.json
 * - walletpassword.txt
 * - slashing_protection.json
 */
export async function getValidatorFiles({
  volume
}: {
  volume: Dockerode.Volume;
}): ValidatorFiles {
  try {
  } catch (e) {
    throw e;
  }
}
