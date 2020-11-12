import os from "os";
import * as ipfs from "../../ipfs";
import { isIpfsHash } from "../../../utils/validate";
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

const source: "ipfs" = "ipfs";

/**
 * Should resolve a name/version into the manifest and all relevant hashes
 * Should return enough information to then query other files if necessary
 * or inspect the package metadata
 * - The download of image and avatar should be handled externally with other "pure"
 *   functions, without this method becoming a factory
 * - The download methods should be communicated with enough information to
 *   know where to fetch the content, hence the @DistributedFileSource
 */
export async function downloadReleaseIpfs(
  hash: string
): Promise<{
  manifestFile: DistributedFile;
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  composeUnsafe: Compose;
  manifest: Manifest;
}> {
  if (!isIpfsHash(hash)) throw Error(`Release must be an IPFS hash ${hash}`);

  const arch = os.arch() as NodeArch;

  try {
    const manifest = await download.manifest({ hash });

    // Disable manifest type releases for ARM architectures
    if (isArmArch(arch)) throw new NoImageForArchError(arch);

    // Make sure manifest.image.hash exists. Otherwise, will throw
    const manifestWithImage = validateManifestWithImage(
      manifest as ManifestWithImage
    );
    const { image, avatar } = manifestWithImage;
    return {
      manifestFile: getFileFromHash(hash),
      imageFile: getFileFromHash(image.hash, image.size),
      avatarFile: avatar ? getFileFromHash(avatar) : undefined,
      manifest,
      composeUnsafe: manifestToCompose(manifestWithImage)
    };
  } catch (e) {
    if (e.message.includes("is a directory")) {
      const files = await ipfs.ls({ hash });
      const { manifest, compose } = await downloadDirectoryFiles(files);

      // Fetch image by arch, will throw if not available
      const imageEntry = getImageByArch(manifest, files, arch);
      const avatarEntry = findEntries(files, releaseFiles.avatar, "avatar");

      return {
        manifestFile: getFileFromEntry(entries.manifest),
        imageFile: getFileFromEntry(imageEntry),
        avatarFile: getFileFromEntry(avatarEntry),
        manifest,
        composeUnsafe: compose
      };
    } else {
      throw e;
    }
  }
}

// Helpers

function getFileFromHash(hash: string, size?: number): DistributedFile {
  return { hash, size: size || 0, source };
}

function getFileFromEntry({
  hash,
  size
}: {
  hash: string;
  size: number;
}): DistributedFile {
  return { hash, size, source };
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
