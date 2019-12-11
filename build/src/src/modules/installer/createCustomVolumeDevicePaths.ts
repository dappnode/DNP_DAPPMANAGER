import fs from "fs";
import path from "path";
import { Compose } from "../../types";

/**
 * Create custom volume device path if any
 * If the full path declared in the compose in not already created
 * docker will throw an error
 */
export default function createCustomVolumeDevicePaths(compose: Compose): void {
  if (!compose.volumes) return;

  for (const [name, volObj] of Object.entries(compose.volumes)) {
    if (
      typeof volObj === "object" &&
      volObj.driver_opts &&
      volObj.driver_opts.device &&
      path.isAbsolute(volObj.driver_opts.device)
    ) {
      const devicePath = volObj.driver_opts.device;
      try {
        fs.mkdirSync(devicePath, { recursive: true });
      } catch (e) {
        throw Error(
          `Error creating device path ${devicePath} for ${name}: ${e.message}`
        );
      }
    }
  }
}
