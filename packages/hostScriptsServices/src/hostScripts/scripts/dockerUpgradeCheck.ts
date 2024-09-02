import { DockerUpgradeRequirements } from "@dappnode/types";
import { runScript } from "../runScripts.js";

export async function dockerUpgradeCheck(): Promise<DockerUpgradeRequirements> {
  const requirements = await runScript("docker_upgrade.sh", "-- --check");
  const requirementsParsed = JSON.parse(requirements);

  return {
    dockerHostVersion: requirementsParsed.dockerHostVersion,
    dockerLatestVersion: requirementsParsed.dockerLatestVersion || undefined, // check if dockerLatestVersion is empty string and set it to undefined if so
    isDockerInstalledThroughApt: requirementsParsed.isDockerInstalledThroughApt === "true", // check if isDockerInstalledThroughApt is a string and set it to boolean if so
    isDockerInUnattendedUpgrades: requirementsParsed.isDockerInUnattendedUpgrades === "true" // check if isDockerInUnattendedUpgrades is a string and set it to boolean if so
  };
}
