import downloadRelease from "./ipfs/downloadRelease";
import { isEnsDomain } from "../../utils/validate";
import { PackageRelease } from "../../types";
import {
  parseMetadataFromManifest,
  sanitizeCompose,
  getIsCore,
  getReleaseWarnings
} from "./parsers";

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
export async function getReleaseFromIpfs({
  hash,
  name,
  origin
}: {
  hash: string;
  name?: string;
  origin?: string;
}): Promise<PackageRelease> {
  const id = name || hash;
  // 2. Download the release data
  const {
    manifestFile,
    imageFile,
    avatarFile,
    manifest,
    composeUnsafe
  } = await downloadRelease(hash).catch(e => {
    e.message = `Can't download ${id} release: ${e.message}`;
    throw e; // Use this format to keep the stack trace
  });

  // Verify that the request was correct: hash mismatch
  // Except if the id is = "/ipfs/Qm...", there is no provided name
  if (name && isEnsDomain(name) && name !== manifest.name)
    throw Error("DNP's name doesn't match the manifest's name");

  const release = {
    name: manifest.name,
    reqVersion: origin || manifest.version,
    semVersion: manifest.version,
    origin,
    isCore: getIsCore(manifest),
    manifestFile,
    imageFile,
    avatarFile,
    metadata: parseMetadataFromManifest(manifest),
    compose: sanitizeCompose(composeUnsafe, manifest)
  };

  return {
    ...release,
    warnings: getReleaseWarnings(release)
  };
}
