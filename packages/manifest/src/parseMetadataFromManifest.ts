import { omit } from "lodash-es";
import { ManifestWithImage, Manifest } from "@dappnode/common";

/**
 * Sanitize metadata from the manifest.
 * Since metadata is not used for critical purposes, it can just
 * be copied over
 *
 * @param manifest
 */
export function parseMetadataFromManifest(manifest: Manifest): Manifest {
  const setupWizard = manifest.setupWizard ? manifest.setupWizard : undefined;

  return {
    // TODO: research if this omit can be removed since none packages should have been publish with this
    // format from long time ago
    ...omit(manifest as ManifestWithImage, [
      "avatar",
      "image",
      "setupSchema",
      "setupTarget",
      "setupUiJson",
    ]),
    ...(setupWizard ? { setupWizard } : {}),
    // ##### Is this necessary? Correct manifest: type missing
    type: manifest.type || "service",
  };
}
