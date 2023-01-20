import { getValidator } from "../../utils/schema.js";
import manifestBasicSchema from "./manifest-basic.schema.json" assert { type: "json" };
import manifestWithImageSchema from "./manifest-with-image.schema.json" assert { type: "json" };
import { Manifest } from "@dappnode/dappnodesdk";
import { ManifestWithImage } from "../../types.js";

/**
 * Validates a manifest with only the basic data
 */
export const validateManifestBasic =
  getValidator<Manifest>(manifestBasicSchema);

/**
 * Validates a manifest with image data (only basic data)
 */
export const validateManifestWithImage = getValidator<ManifestWithImage>(
  manifestWithImageSchema
);
