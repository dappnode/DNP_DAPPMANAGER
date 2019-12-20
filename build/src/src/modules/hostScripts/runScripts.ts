import fs from "fs";
import path from "path";
import { shellHost } from "../../utils/shell";
import params from "../../params";
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
 *   total: "500G",
 *   free: "141G",
 *   vendor: "ATA",
 *   model: "CT500MX500SSD4"
 * }, ... ]
 */
export async function detectMountpoints(): Promise<MountpointData[]> {
  const rawMountpointsJson = await runScript("detect_fs.sh");
  const mountpoints: MountpointData[] = JSON.parse(rawMountpointsJson);
  // Validate result
  return mountpoints;
}

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
