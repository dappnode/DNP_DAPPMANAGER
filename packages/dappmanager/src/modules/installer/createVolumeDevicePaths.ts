import path from "path";
import { Compose } from "@dappnode/dappnodesdk";
import { logs } from "../../logs";
import { uniq } from "lodash-es";
import { shellHost } from "../../utils/shell";

/**
 * Create custom volume device path if any
 * If the full path declared in the compose in not already created
 * docker will throw an error
 */
export default async function createVolumeDevicePaths(
  composeArray: { compose: Compose }[]
): Promise<void> {
  const volumePaths = getVolumeDevicePaths(composeArray);

  if (!volumePaths.length) return;

  // ##### TODO - Optimization: Check if the volume already exists
  // Otherwise there's no need to create the path because it MUST exist

  const volumePathList = volumePaths.join(" ");
  try {
    // Create all directories at once
    // `mkdir -p f/f/f g/g/g` works fine
    // It also can be run again when the paths exist and it will NOT error
    // NOTE: "--" MUST be used to make the flag and the command work
    await shellHost(`mkdir -- -p ${volumePathList}`);
    logs.info(`Created device paths for ${volumePathList}`);
  } catch (e) {
    throw Error(`Error creating device paths ${volumePathList}: ${e.message}`);
  }
}

/**
 * Gets an array of devicePaths used in a Compose
 * [NOTE]: This pure function is abstracted for testability
 */
export function getVolumeDevicePaths(
  composeArray: { compose: Compose }[]
): string[] {
  const volumePaths: string[] = [];
  for (const { compose } of composeArray)
    for (const volObj of Object.values(compose.volumes || []))
      if (
        typeof volObj === "object" &&
        volObj != null &&
        volObj.driver_opts &&
        volObj.driver_opts.device &&
        path.isAbsolute(volObj.driver_opts.device)
      )
        volumePaths.push(volObj.driver_opts.device);
  return uniq(volumePaths.map(path.normalize));
}
