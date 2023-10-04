import { getSchemaValidator } from "@dappnode/utils";
import manifestBasicSchema from "./manifest-basic.schema.json" assert { type: "json" };
import manifestWithImageSchema from "./manifest-with-image.schema.json" assert { type: "json" };
import { Manifest } from "@dappnode/types";
import { ManifestWithImage } from "../../types.js";

/**
 * Validates a manifest with only the basic data
 */
export const validateManifestBasic =
  getSchemaValidator<Manifest>(manifestBasicSchema);

/**
 * Validates a manifest with image data (only basic data)
 */
export const validateManifestWithImage = getSchemaValidator<ManifestWithImage>(
  manifestWithImageSchema
);
