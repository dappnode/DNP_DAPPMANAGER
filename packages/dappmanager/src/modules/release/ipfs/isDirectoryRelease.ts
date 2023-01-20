import { releaseFiles } from "../../../params.js";
import { IPFSEntry } from "ipfs-core-types/src/root";

/**
 * Check if the IPFS path is a root directory
 * by detecting the manifest in the files
 * @param ipfsPath
 */
export async function isDirectoryRelease(
  ipfsEntries: IPFSEntry[]
): Promise<boolean> {
  return ipfsEntries.some(file => releaseFiles.manifest.regex.test(file.name));
}
