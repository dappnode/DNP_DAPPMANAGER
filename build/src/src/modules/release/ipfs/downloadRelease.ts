import downloadManifest from "./downloadManifest";
import downloadCompose from "./downloadCompose";
import * as ipfs from "../../ipfs";
import {
  Manifest,
  DistributedFile,
  ManifestWithImage,
  ComposeUnsafe,
  DistributedFileSource
} from "../../../types";
import { validateManifestWithImageData } from "../validate";
import { isIpfsHash } from "../../../utils/validate";
import { manifestToCompose } from "../parsers";

const source = "ipfs" as DistributedFileSource;

/**
 * Should resolve a name/version into the manifest and all relevant hashes
 * Should return enough information to then query other files if necessary
 * or inspect the package metadata
 * - The download of image and avatar should be handled externally with other "pure"
 *   functions, without this method becoming a factory
 * - The download methods should be communicated of enought information to
 *   know where to fetch the content, hence the @DistributedFileSource
 */
export default async function downloadRelease(
  hash: string
): Promise<{
  manifestFile: DistributedFile;
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  composeUnsafe: ComposeUnsafe;
  manifest: Manifest;
}> {
  if (!isIpfsHash(hash)) throw Error(`Release must be an IPFS hash ${hash}`);

  try {
    const manifest: Manifest = await downloadManifest(hash);
    const manifestWithImage: ManifestWithImage = manifest as ManifestWithImage;

    /**
     * Release type-manifest
     * - Expect the manifest to contain image data and hashes
     */
    const validation = validateManifestWithImageData(manifestWithImage);
    if (!validation.success)
      throw Error(`Invalid ${hash} image ${hash}: ${validation.message}`);

    const { image, avatar } = manifestWithImage;
    return {
      manifestFile: { hash: hash, source, size: 0 },
      imageFile: { hash: image.hash, source, size: image.size },
      avatarFile: avatar ? { hash: avatar, source, size: 0 } : undefined,
      manifest,
      composeUnsafe: manifestToCompose(manifestWithImage)
    };
  } catch (e) {
    if (e.message.includes("is a directory")) {
      const files = await ipfs.ls({ hash });
      const avatarEntry = files.find(file => file.name.endsWith(".png"));
      const manifestEntry = files.find(file => file.name.endsWith(".json"));
      const imageEntry = files.find(file => file.name.endsWith(".tar.xz"));
      const composeEntry = files.find(file => file.name.endsWith(".yml"));

      if (!manifestEntry) throw Error("Release must contain a manifest");
      if (!imageEntry) throw Error("Release must contain an image");

      const manifest: Manifest = await downloadManifest(manifestEntry.hash);
      const manifestWithImage: ManifestWithImage = manifest as ManifestWithImage;

      /**
       * Release type-directory
       * - Expect the manifest to contain only metadata
       * - The validation is done in the `downloadManifest` function
       */

      let composeUnsafe: ComposeUnsafe;
      if (composeEntry) {
        composeUnsafe = await downloadCompose(composeEntry.hash);
      } else if (manifestWithImage.image) {
        // This type casting is OK since the image field is certain to exist
        composeUnsafe = manifestToCompose(manifestWithImage);
      } else {
        throw Error(
          `Release should provide either a docker-compose or a manifest.image field`
        );
      }

      return {
        manifestFile: getFileFromEntry(manifestEntry),
        imageFile: getFileFromEntry(imageEntry),
        avatarFile: avatarEntry ? getFileFromEntry(avatarEntry) : undefined,
        manifest,
        composeUnsafe
      };
    } else {
      throw e;
    }
  }
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
