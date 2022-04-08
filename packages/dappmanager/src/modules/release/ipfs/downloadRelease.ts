import os from "os";
import memoize from "memoizee";
import { ipfs } from "../../ipfs";
import { IPFSEntry } from "ipfs-core-types/src/root";
import { DistributedFile, NodeArch } from "../../../types";
import { downloadDirectoryFiles } from "./downloadDirectoryFiles";
import { getImageByArch } from "./getImageByArch";
import { findEntries } from "./findEntries";
import { releaseFiles } from "../../../params";
import { serializeIpfsDirectory } from "../releaseSignature";
import { ReleaseDownloadedContents } from "../types";

const source = "ipfs" as const;

// Memoize fetching releases so refreshing the DAppStore is fast
export const downloadReleaseIpfs = memoize(downloadReleaseIpfsFn, {
  // Wait for Promises to resolve. Do not cache rejections
  promise: true,
  normalizer: ([hash]) => hash,
  max: 100,
  maxAge: 60 * 60 * 1000
});

/**
 * Should resolve a name/version into the manifest and all relevant hashes
 * Should return enough information to then query other files if necessary
 * or inspect the package metadata
 * - The download of image and avatar should be handled externally with other "pure"
 *   functions, without this method becoming a factory
 * - The download methods should be communicated with enough information to
 *   know where to fetch the content, hence the @DistributedFileSource
 */
async function downloadReleaseIpfsFn(
  hash: string
): Promise<ReleaseDownloadedContents> {
  const arch = os.arch() as NodeArch;

  try {
    // Check if it is an ipfs path of a root directory release
    const ipfsEntries = await ipfs.list(hash);
    const { manifest, compose, signature } = await downloadDirectoryFiles(
      ipfsEntries
    );

    // Pin release on visit
    ipfs.pinAddNoThrow(hash);

    // Fetch image by arch, will throw if not available
    const imageEntry = getImageByArch(manifest, ipfsEntries, arch);
    const avatarEntry = findEntries(ipfsEntries, releaseFiles.avatar, "avatar");

    return {
      imageFile: getFileFromEntry(imageEntry),
      avatarFile: getFileFromEntry(avatarEntry),
      manifest,
      composeUnsafe: compose,
      signature: signature && {
        signature,
        signedData: serializeIpfsDirectory(ipfsEntries, signature.cid)
      }
    };
  } catch (e) {
    throw e;
  }
}

// Helpers

function getFileFromEntry(entry: IPFSEntry): DistributedFile {
  return {
    hash: entry.cid.toString(),
    size: entry.size,
    source
  };
}
