import { params } from "@dappnode/params";
import { copyOnHost } from "../copyOnHost.js";

const hostScriptsDir = params.HOST_SCRIPTS_DIR;
const hostScriptsDirSource = params.HOST_SCRIPTS_SOURCE_DIR;

/**
 * Copies the scripts to the host shared folder
 * - Add new scripts
 * - Update scripts by comparing sha256 hashes
 * - Remove scripts that are not here
 * @returns For info and logging
 */
export async function copyHostScripts(): Promise<void> {
  await copyOnHost({
    hostDir: hostScriptsDir,
    hostDirSource: hostScriptsDirSource
  });
}
