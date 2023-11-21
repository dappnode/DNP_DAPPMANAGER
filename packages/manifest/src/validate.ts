import { getSchemaValidator } from "@dappnode/utils";
import manifestBasicSchema from "./manifest-basic.schema.json" assert { type: "json" };
import { Manifest } from "@dappnode/common";

/**
 * Validates a manifest with only the basic data
 */
export const validateManifestBasic =
  getSchemaValidator<Manifest>(manifestBasicSchema);

