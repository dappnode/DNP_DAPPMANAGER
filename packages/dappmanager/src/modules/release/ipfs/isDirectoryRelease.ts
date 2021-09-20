import { IPFSEntry } from "../../ipfs";
import { releaseFiles } from "../../../params";

/**
 * Check if the IPFS path is a root directory
 * by detecting the manifest in the files
 * @param ipfsContent
 */
export async function isDirectoryRelease(
  ipfsContent: IPFSEntry[]
): Promise<boolean> {
  return ipfsContent.some(file => releaseFiles.manifest.regex.test(file.name));
}
