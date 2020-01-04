import fs from "fs";
import path from "path";
import { shellHost } from "../../utils/shell";
import params from "../../params";
import memoize from "memoizee";
import { MountpointData } from "../../types";

const hostScriptsDirFromHost = params.HOST_SCRIPTS_DIR_FROM_HOST;
const hostScriptsDir = params.HOST_SCRIPTS_DIR;

/**
 * Script runners
 * - detect_fs.sh
 */

/**
 * Detects mountpoints in the host
 * Runs `detect_fs.sh`
 * @return mountpoints = [{
 *   mountpoint: "/media/usb0",
 *   use: "87%",
 *   used: 6125361723
 *   total: 1265616126,
 *   free: 626315521,
 *   vendor: "ATA",
 *   model: "CT500MX500SSD4"
 * }, ... ]
 *
 * Prevent running this script more than once
 * #### Develop also a cache strategy
 * - If the UI just requests this, give it a TTL of few minutes
 * - If the user hits "Refresh", send a "force" argument which
 *   will clear the cache and force a re-run
 */
export const detectMountpoints = memoize(
  async function(): Promise<MountpointData[]> {
    const rawMountpointsJson = await runScript("detect_fs.sh");

    // Everything returned by the script is a string
    const mountpointsDaraRaw: {
      mountpoint: string;
      use: string;
      used: string;
      total: string;
      free: string;
      vendor: string;
      model: string;
    }[] = JSON.parse(rawMountpointsJson);

    if (!Array.isArray(mountpointsDaraRaw))
      throw Error(
        `detect_fs script must return an array but returned: ${rawMountpointsJson}`
      );

    const mountpoints: MountpointData[] = mountpointsDaraRaw.map(dataRaw => ({
      mountpoint: dataRaw.mountpoint,
      use: dataRaw.use,
      used: parseInt(dataRaw.used),
      total: parseInt(dataRaw.total),
      free: parseInt(dataRaw.free),
      vendor: dataRaw.vendor,
      model: dataRaw.model
    }));

    // Validate result
    return mountpoints;
  },
  { promise: true, maxAge: 5000 }
);

/**
 * Run a script for the hostScripts folder
 * @param scriptName "detect_fs.sh"
 */
async function runScript(scriptName: string, args = ""): Promise<string> {
  const scriptPath = path.resolve(hostScriptsDir, scriptName);
  if (!fs.existsSync(scriptPath))
    throw Error(`Host script ${scriptName} not found`);

  const scriptPathFromHost = path.resolve(hostScriptsDirFromHost, scriptName);
  return await shellHost(`/bin/bash ${scriptPathFromHost} ${args}`);
}
