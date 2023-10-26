import * as db from "@dappnode/db";
import { downloadReleaseIpfs } from "./ipfs/downloadRelease.js";
import { isEnsDomain } from "./validate.js";
import { isIpfsHash } from "../utils.js";
import { PackageRelease, ReleaseSignatureStatusCode } from "@dappnode/common";
import { parseMetadataFromManifest } from "@dappnode/manifest";
import { setDappnodeComposeDefaults } from "@dappnode/dockercompose";
import { ComposeEditor, writeMetadataToLabels } from "@dappnode/dockercompose";
import { sanitizeDependencies } from "../dappGet/utils/sanitizeDependencies.js";
import { parseTimeoutSeconds } from "../utils.js";
import { ReleaseDownloadedContents } from "./types.js";
import { getReleaseSignatureStatus } from "./releaseSignature.js";
import { params } from "@dappnode/params";
import { getIsCore } from "@dappnode/utils";
import { computeGlobalEnvsFromDb } from "@dappnode/db";
import { DistributedFile } from "@dappnode/common";

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
  origin,
}: {
  hash: string;
  name?: string;
  origin?: string;
}): Promise<PackageRelease> {
  const {
    imageFile,
    avatarFile,
    manifest,
    composeUnsafe,
    signature,
  } = await downloadRelease(hash, reqName || hash);

  // TODO: improve this error handling
  if (
    reqName &&
    isEnsDomain(reqName) &&
    reqName !== manifest.name &&
    origin &&
    !origin.startsWith("/ipfs/") // pkgs may have depdendencies with /ipfs/ instead of versions for testing purposes)
  )
    throw Error("Origin must be an IPFS hash");

  const dnpName = manifest.name;
  const isCore = getIsCore(manifest);

  const metadata = parseMetadataFromManifest(manifest);
  const compose = new ComposeEditor(
    setDappnodeComposeDefaults(composeUnsafe, manifest)
  );

  const services = Object.values(compose.services());
  const globalEnvsFromDbPrefixed = computeGlobalEnvsFromDb(true);
  for (const service of services) {
    service.setGlobalEnvs(
      manifest.globalEnvs,
      globalEnvsFromDbPrefixed,
      isCore
    );

    service.mergeLabels(
      writeMetadataToLabels({
        dnpName,
        version: manifest.version,
        serviceName: service.serviceName,
        dependencies: sanitizeDependencies(metadata.dependencies || {}),
        avatar: fileToMultiaddress(avatarFile),
        chain: metadata.chain,
        origin,
        isCore,
        isMain:
          // If developer chooses this service as main
          metadata.mainService === service.serviceName ||
          // Or if there is a single service
          services.length === 1
            ? true
            : undefined,
        dockerTimeout: parseTimeoutSeconds(metadata.dockerTimeout),
      })
    );
  }

  // Verify release signature if available
  const trustedKeys = db.releaseKeysTrusted.get();
  // TODO: Add default well-known
  const signatureStatus = getReleaseSignatureStatus(
    manifest.name,
    signature,
    trustedKeys
  );

  return {
    dnpName,
    reqVersion: origin || manifest.version,
    semVersion: manifest.version,
    origin,
    isCore,
    imageFile,
    avatarFile,
    metadata,
    compose: compose.output(),
    // Generates an object of warnings so other components can
    // decide to throw an error or just show a warning in the UI
    warnings: {
      coreFromForeignRegistry:
        isCore && !dnpName.endsWith(params.DAPPNODE_REGISTRY),
      requestNameMismatch: isEnsDomain(reqName || "") && reqName !== dnpName,
    },
    signedSafe:
      !origin ||
      signatureStatus.status === ReleaseSignatureStatusCode.signedByKnownKey,
    signatureStatus,
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
): Promise<ReleaseDownloadedContents> {
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

/**
 * Stringifies a distributed file type into a single multiaddress string
 * @param distributedFile
 * @returns multiaddress "/ipfs/Qm"
 */
function fileToMultiaddress(distributedFile?: DistributedFile): string {
  if (!distributedFile || !distributedFile.hash) return "";

  if (distributedFile.source === "ipfs")
    return `/ipfs/${normalizeHash(distributedFile.hash)}`;
  else return "";
}

/**
 * Normalizes a hash removing it's prefixes
 * - Remove any number of trailing slashes
 * - Split by non alphanumeric character and return the last string
 * "/ipfs/Qm" => "Qm"
 * "ipfs"
 * @param hash "/ipfs/Qm" | "ipfs:Qm" | "Qm"
 * @returns "Qm"
 */
function normalizeHash(hash: string): string {
  return (
    hash
      // remove any number of trailing slashes
      .replace(/\/+$/, "")
      .trim()
      //
      .split(/[^a-zA-Z\d]/)
      .slice(-1)[0]
  );
}
