import fs from "fs";
import verifyXz from "../../../utils/verifyXz";
import Ajv from "ajv";
import { Manifest, ComposeUnsafe, ManifestWithImage } from "../../../types";
import compose3xLightSchema from "./compose-3x-light.schema.json";
import manifestBasicSchema from "./manifest-basic.schema.json";
import manifestWithImageSchema from "./manifest-with-image.schema.json";

const ajv = new Ajv({ allErrors: true });

function getValidator<T>(schema: any, dataName?: string): (data: T) => T {
  const name = dataName || schema.title || "data";
  const validate = ajv.compile(schema);
  return (data: T): T => {
    if (!validate(data)) {
      const { errors } = validate;
      throw Error(
        `Invalid ${name}:\n` +
          ajv.errorsText(errors, { separator: "\n", dataVar: name })
      );
    }
    return data;
  };
}

export interface ValidateReturn {
  success: boolean;
  message: string;
}

/**
 * Validates a .xz DNP image by:
 *
 * 1. Checks the path exists
 * 2. Checks the file at path has a size > 0 bytes
 * 3. Runs the command `xz -t` which does a compression validation
 */
export async function validateImage(path: string): Promise<void> {
  // Verify that the file exists
  if (!fs.existsSync(path)) throw Error("File not found");

  if (fs.statSync(path).size == 0) throw Error("File size is 0 bytes");

  const { success, message } = await verifyXz(path);
  if (!success) throw Error(`Invalid .xz: ${message}`);
}

/**
 * Validates a compose 3.x not strictly
 */
export const validateComposeOrUnsafe = getValidator<ComposeUnsafe>(
  compose3xLightSchema
);

/**
 * Validates a manifest with only the basic data
 */
export const validateManifestBasic = getValidator<Manifest>(
  manifestBasicSchema
);

/**
 * Validates a manifest with image data (only basic data)
 */
export const validateManifestWithImage = getValidator<ManifestWithImage>(
  manifestWithImageSchema
);
