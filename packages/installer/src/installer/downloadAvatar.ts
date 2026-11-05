import fs from "fs";
import path from "path";
import { DistributedFile, InstallPackageData } from "@dappnode/types";
import { logs, Log } from "@dappnode/logger";
import { getAvatarPath, validatePath } from "@dappnode/utils";
import { DappnodeInstaller } from "../dappnodeInstaller.js";

/**
 * Downloads the avatar PNG for each package that has an avatarFile and saves it
 * to the local avatars directory.
 * Core packages → DNCORE_DIR/avatars/, non-core → REPO_DIR/avatars/.
 *
 * This is a best-effort operation — failures are logged but never block installation.
 */
export async function downloadAvatars(
  dappnodeInstaller: DappnodeInstaller,
  packagesData: InstallPackageData[],
  log: Log
): Promise<void> {
  await Promise.all(
    packagesData.map(async (pkg) => {
      const { dnpName, isCore, avatarFile } = pkg;
      if (!avatarFile) return;

      try {
        await downloadAvatar(dappnodeInstaller, dnpName, isCore, avatarFile);
        log(dnpName, "Avatar saved locally");
      } catch (e) {
        // Avatar download must never block installation
        logs.debug(`Failed to download avatar for ${dnpName}: ${e.message}`);
      }
    })
  );
}

/**
 * Downloads a single avatar file to the local avatars directory.
 */
async function downloadAvatar(
  dappnodeInstaller: DappnodeInstaller,
  dnpName: string,
  isCore: boolean,
  avatarFile: DistributedFile
): Promise<void> {
  const avatarPath = getAvatarPath(dnpName, isCore);

  // Ensure the avatars directory exists
  const avatarDir = path.dirname(avatarPath);
  fs.mkdirSync(avatarDir, { recursive: true });

  // Validate target path
  validatePath(avatarPath);

  const { hash, size, filename, packageHash } = avatarFile;

  await dappnodeInstaller.writeFileToFs({
    hash,
    path: avatarPath,
    fileSize: size,
    filename,
    packageHash
  });
}
