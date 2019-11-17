import * as ipfs from "../../ipfs";
import {
  Manifest,
  DistributedFile,
  ManifestWithImage,
  ComposeUnsafe
} from "../../../types";
import { mapValues } from "lodash";
import { validateManifestWithImage } from "../parsers/validate";
import { isIpfsHash } from "../../../utils/validate";
import { manifestToCompose } from "../parsers";
import {
  downloadManifest,
  downloadCompose,
  downloadSetupSchema,
  downloadSetupUiJson,
  downloadDisclaimer
} from "./downloadAssets";

const source: "ipfs" = "ipfs";

const releaseFilesRegex = {
  manifest: /dappnode_package.*\.json$/,
  image: /\.tar\.xz$/,
  compose: /compose.*\.yml$/,
  avatar: /avatar.*\.png$/,
  setupWizard: /setup\..*\.json$/,
  setupWizardUi: /setup-ui\..*json$/,
  disclaimer: /disclaimer\.md$/i
};

const releaseFileIs = mapValues(
  releaseFilesRegex,
  fileRegex => ({ name }: { name: string }): boolean => fileRegex.test(name)
);

/**
 * Should resolve a name/version into the manifest and all relevant hashes
 * Should return enough information to then query other files if necessary
 * or inspect the package metadata
 * - The download of image and avatar should be handled externally with other "pure"
 *   functions, without this method becoming a factory
 * - The download methods should be communicated with enough information to
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
    const manifest = await downloadManifest(hash);
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
      const manifestEntry = files.find(releaseFileIs.manifest);
      const imageEntry = files.find(releaseFileIs.image);
      const composeEntry = files.find(releaseFileIs.compose);
      const avatarEntry = files.find(releaseFileIs.avatar);
      const setupSchemaEntry = files.find(releaseFileIs.setupWizard);
      const setupUiJsonEntry = files.find(releaseFileIs.setupWizardUi);
      const disclaimerEntry = files.find(releaseFileIs.disclaimer);

      if (!manifestEntry) throw Error("Release must contain a manifest");
      if (!imageEntry) throw Error("Release must contain an image");
      if (!composeEntry) throw Error("Release must contain a docker compose");

      const [
        manifest,
        composeUnsafe,
        setupSchema,
        setupUiJson,
        disclaimer
      ] = await Promise.all([
        downloadManifest(manifestEntry.hash),
        downloadCompose(composeEntry.hash),
        setupSchemaEntry && downloadSetupSchema(setupSchemaEntry.hash),
        setupUiJsonEntry && downloadSetupUiJson(setupUiJsonEntry.hash),
        disclaimerEntry && downloadDisclaimer(disclaimerEntry.hash)
      ]);

      if (setupSchema) manifest.setupSchema = setupSchema;
      if (setupUiJson) manifest.setupUiJson = setupUiJson;
      if (disclaimer) manifest.disclaimer = { message: disclaimer };

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

// File finder helpers
