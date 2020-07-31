import { mapValues } from "lodash";
import * as ipfs from "../../ipfs";
import { isIpfsHash } from "../../../utils/validate";
import {
  downloadManifest,
  downloadCompose,
  downloadSetupSchema,
  downloadSetupTarget,
  downloadSetupUiJson,
  downloadDisclaimer,
  downloadGetStarted,
  downloadSetupWizard
} from "./downloadAssets";
import { manifestToCompose, validateManifestWithImage } from "../../manifest";
import {
  Manifest,
  DistributedFile,
  ManifestWithImage,
  Compose
} from "../../../types";

const source: "ipfs" = "ipfs";

const releaseFilesRegex = {
  manifest: /dappnode_package.*\.json$/,
  image: /\.tar\.xz$/,
  compose: /compose.*\.yml$/,
  avatar: /avatar.*\.png$/,
  setupWizard: /setup-wizard\..*(json|yaml|yml)$/,
  setupSchema: /setup\..*\.json$/,
  setupTarget: /setup-target\..*json$/,
  setupUiJson: /setup-ui\..*json$/,
  disclaimer: /disclaimer\.md$/i,
  gettingStarted: /getting.*started\.md$/i
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
      const setupWizardEntry = files.find(releaseFileIs.setupWizard);
      const setupSchemaEntry = files.find(releaseFileIs.setupSchema);
      const setupTargetEntry = files.find(releaseFileIs.setupTarget);
      const setupUiJsonEntry = files.find(releaseFileIs.setupUiJson);
      const disclaimerEntry = files.find(releaseFileIs.disclaimer);
      const getStartedEntry = files.find(releaseFileIs.gettingStarted);

      if (!manifestEntry) throw Error("Release must contain a manifest");
      if (!imageEntry) throw Error("Release must contain an image");
      if (!composeEntry) throw Error("Release must contain a docker compose");

      const [
        manifest,
        composeUnsafe,
        setupWizard,
        setupSchema,
        setupTarget,
        setupUiJson,
        disclaimer,
        gettingStarted
      ] = await Promise.all([
        downloadManifest(manifestEntry.hash),
        downloadCompose(composeEntry.hash),
        setupWizardEntry && downloadSetupWizard(setupWizardEntry.hash),
        setupSchemaEntry && downloadSetupSchema(setupSchemaEntry.hash),
        setupTargetEntry && downloadSetupTarget(setupTargetEntry.hash),
        setupUiJsonEntry && downloadSetupUiJson(setupUiJsonEntry.hash),
        disclaimerEntry && downloadDisclaimer(disclaimerEntry.hash),
        getStartedEntry && downloadGetStarted(getStartedEntry.hash)
      ]);

      // Note: setupWizard1To2 conversion is done on parseMetadataFromManifest
      if (setupWizard) manifest.setupWizard = setupWizard;
      if (setupSchema) manifest.setupSchema = setupSchema;
      if (setupTarget) manifest.setupTarget = setupTarget;
      if (setupUiJson) manifest.setupUiJson = setupUiJson;
      if (disclaimer) manifest.disclaimer = { message: disclaimer };
      if (gettingStarted) manifest.gettingStarted = gettingStarted;

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
