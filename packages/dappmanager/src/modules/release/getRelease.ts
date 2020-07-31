import * as db from "../../db";
import { downloadReleaseIpfs } from "./ipfs/downloadRelease";
import { isEnsDomain, isIpfsHash } from "../../utils/validate";
import { PackageRelease } from "../../types";
import { getIsCore } from "../manifest/getIsCore";
import { parseMetadataFromManifest } from "../manifest";
import { DistributedFile, Compose, Manifest } from "../../common";
import { parseUnsafeCompose } from "../compose/unsafeCompose";
import { ComposeEditor } from "../compose/editor";
import { shortNameDomain } from "../../utils/format";
import { writeMetadataToLabels } from "../compose";
import { fileToMultiaddress } from "../../utils/distributedFile";
import { getGlobalEnvsFilePath } from "../../modules/globalEnvs";
import { sanitizeDependencies } from "../dappGet/utils/sanitizeDependencies";

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
export async function getRelease({
  hash,
  name: reqName,
  origin
}: {
  hash: string;
  name?: string;
  origin?: string;
}): Promise<PackageRelease> {
  const {
    manifestFile,
    imageFile,
    avatarFile,
    manifest,
    composeUnsafe
  } = await downloadRelease(hash, reqName || hash);

  if (reqName && isEnsDomain(reqName) && reqName !== manifest.name)
    throw Error("DNP's name doesn't match the manifest's name");

  const name = manifest.name;
  const isCore = getIsCore(manifest);

  const metadata = parseMetadataFromManifest(manifest);
  const compose = new ComposeEditor(
    parseUnsafeCompose(composeUnsafe, manifest)
  );

  // Add SSL environment variables
  if (manifest.ssl) {
    const dnpSubDomain = `${shortNameDomain(name)}.${db.domain.get()}`;
    compose.service().mergeEnvs({
      VIRTUAL_HOST: dnpSubDomain,
      LETSENCRYPT_HOST: dnpSubDomain
    });
  }

  // Add global env_file on request
  if ((manifest.globalEnvs || {}).all)
    compose.service().addEnvFile(getGlobalEnvsFilePath(isCore));

  compose.service().mergeLabels(
    writeMetadataToLabels({
      dependencies: sanitizeDependencies(metadata.dependencies || {}),
      avatar: fileToMultiaddress(avatarFile),
      chain: metadata.chain,
      origin,
      isCore
    })
  );

  return {
    name,
    reqVersion: origin || manifest.version,
    semVersion: manifest.version,
    origin,
    isCore,
    manifestFile,
    imageFile,
    avatarFile,
    metadata,
    compose: compose.output(),
    // Generates an object of warnings so other components can
    // decide to throw an error or just show a warning in the UI
    warnings: {
      unverifiedCore:
        isCore && Boolean(origin) && name.endsWith(".dnp.dappnode.eth"),
      requestNameMismatch:
        isEnsDomain(reqName || "") && reqName !== manifest.name
    }
  };
}

/**
 * Switch to download release from each sources
 * @param hash `"/ipfs/Qm..."`
 * @param id For debugging `"package.dnp.dappnode.eth"`
 */
async function downloadRelease(
  hash: string,
  id: string
): Promise<{
  manifestFile: DistributedFile;
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  composeUnsafe: Compose;
  manifest: Manifest;
}> {
  if (isIpfsHash(hash)) {
    try {
      return await downloadReleaseIpfs(hash);
    } catch (e) {
      e.message = `Error downloading ${id} release from IPFS: ${e.message}`;
      throw e; // Use this format to keep the stack trace
    }
  } else {
    throw Error(`Unknown hash type: ${hash}`);
  }
}
