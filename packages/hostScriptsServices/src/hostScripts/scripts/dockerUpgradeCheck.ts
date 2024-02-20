import { DockerUpgradeRequirements } from "@dappnode/types";
import { runScript } from "../runScripts.js";

export async function dockerUpgradeCheck(): Promise<DockerUpgradeRequirements> {
  const requirements = await runScript("docker_upgrade.sh", "-- --check");
  const requirementsParsed: DockerUpgradeRequirements =
    JSON.parse(requirements);
  // check if dockerLatestVersion is empty string and set it to undefined if so
  return {
    ...requirementsParsed,
    dockerLatestVersion: requirementsParsed.dockerLatestVersion || undefined,
  };
}
