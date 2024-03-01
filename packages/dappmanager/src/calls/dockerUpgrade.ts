import {
  dockerUpgradeService,
  dockerUpgradeCheck as _dockerUpgradeCheck
} from "@dappnode/hostscriptsservices";
import { DockerUpgradeRequirements } from "@dappnode/types";

/**
 * Updates docker engine
 */
export async function dockerUpgrade(): Promise<void> {
  await dockerUpgradeService();
}

/**
 * Checks requirements to update docker
 */
export async function dockerUpgradeCheck(): Promise<DockerUpgradeRequirements> {
  return await _dockerUpgradeCheck();
}
