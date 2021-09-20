import os from "os";
import memoize from "memoizee";
import { ipfs, IPFSEntry } from "../../ipfs";
import { manifestToCompose, validateManifestWithImage } from "../../manifest";
import {
  Manifest,
  DistributedFile,
  ManifestWithImage,
  Compose,
  NodeArch
} from "../../../types";
import { NoImageForArchError } from "../errors";
import { downloadDirectoryFiles } from "./downloadDirectoryFiles";
import { getImageByArch } from "./getImageByArch";
import { findEntries } from "./findEntries";
import { releaseFiles } from "../../../params";
import { downloadAssetRequired } from "./downloadAssets";
import { isDirectoryRelease } from "./isDirectoryRelease";

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
async function downloadReleaseIpfsFn(hash: string): Promise<{
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  composeUnsafe: Compose;
  manifest: Manifest;
}> {
  const arch = os.arch() as NodeArch;

  try {
    // Check if it is an ipfs path of a root directory release
    const files = await ipfs.ls(hash);
    const isDirectory = await isDirectoryRelease(files);

    if (!isDirectory) {
      const manifest = await downloadManifest(hash);

      // Disable manifest type releases for ARM architectures
      if (isArmArch(arch)) throw new NoImageForArchError(arch);

      // Make sure manifest.image.hash exists. Otherwise, will throw
      const manifestWithImage = validateManifestWithImage(
        manifest as ManifestWithImage
      );
      const { image, avatar } = manifestWithImage;
      return {
        imageFile: getFileFromHash(image.hash, image.size),
        avatarFile: avatar ? getFileFromHash(avatar) : undefined,
        manifest,
        composeUnsafe: manifestToCompose(manifestWithImage)
      };
    } else {
      const { manifest, compose } = await downloadDirectoryFiles(files);

      // Pin release on visit
      ipfs.pinAddNoThrow(hash);

      // Fetch image by arch, will throw if not available
      const imageEntry = getImageByArch(manifest, files, arch);
      const avatarEntry = findEntries(files, releaseFiles.avatar, "avatar");

      return {
        imageFile: getFileFromEntry(imageEntry),
        avatarFile: getFileFromEntry(avatarEntry),
        manifest,
        composeUnsafe: compose
      };
    }
  } catch (e) {
    throw e;
  }
}

// Helpers

async function downloadManifest(hash: string): Promise<Manifest> {
  return downloadAssetRequired<Manifest>(
    hash,
    releaseFiles.manifest,
    "manifest"
  );
}

function getFileFromHash(hash: string, size?: number): DistributedFile {
  return { hash, size: size || 0, source };
}

function getFileFromEntry(entry: IPFSEntry): DistributedFile {
  return {
    hash: entry.cid.toString(),
    size: entry.size,
    source
  };
}

function isArmArch(arch: NodeArch): boolean {
  switch (arch) {
    case "arm":
    case "arm64":
      return true;

    default:
      return false;
  }
}
