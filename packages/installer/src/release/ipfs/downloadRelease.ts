import os from "os";
import memoize from "memoizee";
import { ipfs } from "@dappnode/ipfs";
import { IPFSEntry } from "ipfs-core-types/src/root";
import { downloadDirectoryFiles } from "./downloadDirectoryFiles.js";
import { getImageByArch } from "./getImageByArch.js";
import { findEntries } from "./findEntries.js";
import { serializeIpfsDirectory } from "../releaseSignature.js";
import { ReleaseDownloadedContents } from "../types.js";
import { releaseFiles } from "../releaseFiles.js";
import { DistributedFile, NodeArch } from "@dappnode/common";
import {
  validateManifestSchema,
  validateDappnodeCompose,
} from "@dappnode/schemas";
import { getIsCore } from "@dappnode/utils";

const source = "ipfs" as const;

// Memoize fetching releases so refreshing the DAppStore is fast
export const downloadReleaseIpfs = memoize(downloadReleaseIpfsFn, {
  // Wait for Promises to resolve. Do not cache rejections
  promise: true,
  normalizer: ([hash]) => hash,
  max: 100,
  maxAge: 60 * 60 * 1000,
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

  const files = await ipfs.list(hash);
  const { manifest, compose, signature } = await downloadDirectoryFiles(files);
  validateManifestSchema(manifest);
  // Bypass error until publish DNP_BIND v0.2.7 (current DNP_BIND docker-compose.yml file has docker network wrong defined)
  try {
    validateDappnodeCompose(compose, manifest);
  } catch (e) {
    if (getIsCore(manifest)) {
      console.warn(e);
    } else {
      throw e;
    }
  }

  ipfs.pinAddNoThrow(hash);

  // Fetch image by arch, will throw if not available
  const imageEntry = getImageByArch(manifest, files, arch);
  const avatarEntry = findEntries(files, releaseFiles.avatar, "avatar");

  return {
    imageFile: getFileFromEntry(imageEntry),
    avatarFile: getFileFromEntry(avatarEntry),
    manifest,
    composeUnsafe: compose,
    signature: signature && {
      signature,
      signedData: serializeIpfsDirectory(files, signature.cid),
    },
  };
}

// Helpers

function getFileFromEntry(entry: IPFSEntry): DistributedFile {
  return {
    hash: entry.cid.toString(),
    size: entry.size,
    source,
  };
}
