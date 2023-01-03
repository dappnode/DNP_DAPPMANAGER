import { omit } from "lodash-es";
import { setupWizard1To2 } from "../setupWizard/setupWizard1To2";
import { ManifestWithImage } from "../../types";
import { Manifest } from "@dappnode/dappnodesdk";

/**
 * Sanitize metadata from the manifest.
 * Since metadata is not used for critical purposes, it can just
 * be copied over
 *
 * @param manifest
 */
export function parseMetadataFromManifest(manifest: Manifest): Manifest {
  const setupWizard = manifest.setupWizard
    ? manifest.setupWizard
    : manifest.setupSchema && manifest.setupTarget
    ? setupWizard1To2(
        manifest.setupSchema,
        manifest.setupTarget,
        manifest.setupUiJson || {}
      )
    : undefined;

  return {
    ...omit(manifest as ManifestWithImage, [
      "avatar",
      "image",
      "setupSchema",
      "setupTarget",
      "setupUiJson"
    ]),
    ...(setupWizard ? { setupWizard } : {}),
    // ##### Is this necessary? Correct manifest: type missing
    type: manifest.type || "service"
  };
}
