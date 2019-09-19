import Joi from "joi";
import fs from "fs";
import verifyXz from "../../utils/verifyXz";
import { Manifest } from "../../types";

interface ValidateReturn {
  success: boolean;
  message: string;
}

/**
 * Validates a PNG avatar
 *
 * 1. The file at path exists
 *
 * @param {string} avatar, base64 encoded dataUrl
 * @returns {object} A result object, so it doesn't have to be handled with try / catch
 * {
 *   success: true, {bool}
 *   message: "File size is 0 bytes" {string}
 * }
 */
export function validateAvatar(avatarString: string): ValidateReturn {
  if (!avatarString) return { success: false, message: "Empty string" };

  /**
   * avatar must be 'data:image/png;base64,VE9PTUFOWVNFQ1JFVFM='
   * on error: result = { error: <Error obj> }
   */
  const result = Joi.validate(avatarString, Joi.string().dataUri());
  if (result.error)
    return {
      success: false,
      message: (result.error.message || "").replace("value", "avatar")
    };

  // If all okay, return success
  return { success: true, message: "" };
}

/**
 * Validates a .xz DNP image. It will test
 *
 * 1. The file at path exists
 * 2. The file at path has a size > 0 bytes
 * 3. Test against `xz -t` validation, ensuring it's ok
 *
 * @param {string} path
 * @returns {object} A result object, so it doesn't have to be handled with try / catch
 * {
 *   success: true, {bool}
 *   message: "File size is 0 bytes" {string}
 * }
 */
export async function validateImage(path: string): Promise<ValidateReturn> {
  // Verify that the file exists
  if (!fs.existsSync(path))
    return { success: false, message: "File not found" };

  if (fs.statSync(path).size == 0)
    return { success: false, message: "File size is 0 bytes" };

  const { success, message } = await verifyXz(path);
  if (!success) return { success: false, message: `Invalid .xz: ${message}` };

  // If all okay, return success
  return { success: true, message: "" };
}

/**
 * Validates manifest
 *
 * @param {string} path
 * @returns {object} A result object, so it doesn't have to be handled with try / catch
 * {
 *   success: true, {bool}
 *   message: "File size is 0 bytes" {string}
 * }
 */
export function validateManifest(
  manifestString: string
): { success: boolean; message: string } {
  if (!manifestString)
    return {
      success: false,
      message: "Empty string"
    };

  try {
    const manifest: Manifest = JSON.parse(manifestString);
    const result = Joi.validate(
      manifest,
      Joi.object({
        name: Joi.string().required(),
        version: Joi.string().required(),
        image: Joi.object({
          hash: Joi.string().required()
        })
          .pattern(/./, Joi.any())
          .required()
      }).pattern(/./, Joi.any())
    );
    if (result.error)
      return {
        success: false,
        message: result.error.message
      };
    else
      return {
        success: true,
        message: ""
      };
  } catch (e) {
    return { success: false, message: "Invalid JSON" };
  }
}
