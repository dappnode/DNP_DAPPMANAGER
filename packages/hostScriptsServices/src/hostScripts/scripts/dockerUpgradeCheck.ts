import { DockerUpgradeRequirements } from "@dappnode/types";
import { runScript } from "../runScripts.js";

export async function dockerUpgradeCheck(): Promise<DockerUpgradeRequirements> {
  const requirements = await runScript("docker_upgrade.sh", "-- --check");
  const requirementsParsed: DockerUpgradeRequirements =
    JSON.parse(requirements);
  return requirementsParsed;
}
