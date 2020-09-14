import os from "os";
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
  Compose,
  IpfsFileResult,
  NodeArch
} from "../../../types";
import { NoImageForArchError } from "../errors";
import { releaseFilesRegex, getImagePath, getLegacyImagePath } from "../paths";

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
    const manifest = await downloadManifest({ hash });

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
      const entries = mapValues(releaseFilesRegex, regex =>
        findOne(files, regex)
      );

      if (!entries.manifest) throw Error("Release must contain a manifest");
      if (!entries.compose)
        throw Error("Release must contain a docker compose");

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
        downloadManifest(entries.manifest),
        downloadCompose(entries.compose),
        entries.setupWizard && downloadSetupWizard(entries.setupWizard),
        entries.setupSchema && downloadSetupSchema(entries.setupSchema),
        entries.setupTarget && downloadSetupTarget(entries.setupTarget),
        entries.setupUiJson && downloadSetupUiJson(entries.setupUiJson),
        entries.disclaimer && downloadDisclaimer(entries.disclaimer),
        entries.gettingStarted && downloadGetStarted(entries.gettingStarted)
      ]);

      // Fetch image by arch, may require an extra call to IPFS
      const imageEntry = getImageByArch(manifest, files, arch);
      if (!imageEntry) throw new NoImageForArchError(arch);

      // Note: setupWizard1To2 conversion is done on parseMetadataFromManifest
      if (setupWizard) manifest.setupWizard = setupWizard;
      if (setupSchema) manifest.setupSchema = setupSchema;
      if (setupTarget) manifest.setupTarget = setupTarget;
      if (setupUiJson) manifest.setupUiJson = setupUiJson;
      if (disclaimer) manifest.disclaimer = { message: disclaimer };
      if (gettingStarted) manifest.gettingStarted = gettingStarted;

      return {
        manifestFile: getFileFromEntry(entries.manifest),
        imageFile: getFileFromEntry(imageEntry),
        avatarFile: entries.avatar && getFileFromEntry(entries.avatar),
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

function findOne(
  files: IpfsFileResult[],
  fileRegex: RegExp
): IpfsFileResult | undefined {
  const matches = files.filter(file => fileRegex.test(file.name));
  if (matches.length > 1)
    throw Error(`Multiple possible entries found for ${fileRegex}`);
  return matches[0];
}

function getImageByArch(
  { name, version }: { name: string; version: string },
  files: IpfsFileResult[],
  arch: NodeArch
): IpfsFileResult | undefined {
  switch (arch) {
    case "arm":
    case "arm64":
      return files.find(
        file => file.name === getImagePath(name, version, "arm64")
      );

    default:
      return (
        files.find(
          file => file.name === getImagePath(name, version, "amd64")
        ) ||
        // New DAppNodes should load old single arch packages,
        // and consider their single image as amd64
        files.find(file => file.name === getLegacyImagePath(name, version))
      );
  }
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
