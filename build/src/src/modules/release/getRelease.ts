import resolveReleaseName from "./resolveReleaseName";
import downloadRelease from "./ipfs/downloadRelease";
import { isEnsDomain } from "../../utils/validate";
import { PackageRelease } from "../../types";
import { parseMetadataFromManifest, sanitizeCompose } from "./parsers";

/**
 * Should resolve a name/version into the manifest and all relevant hashes
 * Should return enough information to then query other files if necessary
 * or inspect the package metadata
 * - The download of image and avatar should be handled externally with other "pure"
 *   functions, without this method becoming a factory
 * - The download methods should be communicated of enought information to
 *   know where to fetch the content, hence the @DistributedFileSource
 *
 * @param name
 * @param version
 */
export default async function getRelease(
  name: string,
  version?: string
): Promise<PackageRelease> {
  // 1. Get the release hash
  const { hash, origin } = await resolveReleaseName(name, version);

  // 2. Download the release data
  const {
    manifestFile,
    imageFile,
    avatarFile,
    manifest,
    composeUnsafe
  } = await downloadRelease(hash).catch(e => {
    e.message = `Can't download ${name} release: ${e.message}`;
    throw e; // Use this format to keep the stack trace
  });

  // Verify that the request was correct: hash mismatch
  // Except if the id is = "/ipfs/Qm...", there is no provided name
  if (isEnsDomain(name) && name !== manifest.name)
    throw Error("DNP's name doesn't match the manifest's name");

  const isCore = manifest.type === "dncore";

  return {
    name,
    version: manifest.version,
    origin,
    isCore,
    manifestFile,
    imageFile,
    avatarFile,
    metadata: parseMetadataFromManifest(manifest),
    compose: sanitizeCompose(composeUnsafe, isCore)
  };
}
