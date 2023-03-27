import { releaseFiles } from "@dappnode/dappnodesdk/params";
import { IPFSEntry } from "../../ipfs/types.js";

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
