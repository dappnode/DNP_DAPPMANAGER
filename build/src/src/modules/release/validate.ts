import Joi from "joi";
import fs from "fs";
import verifyXz from "../../utils/verifyXz";
import { Manifest, Compose, ComposeUnsafe } from "../../types";

export interface ValidateReturn {
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
export function validateManifestBasic(manifest: Manifest): ValidateReturn {
  const result = Joi.validate(
    manifest,
    Joi.object({
      name: Joi.string().required(),
      version: Joi.string().required()
    }).pattern(/./, Joi.any())
  );

  return {
    success: !result.error,
    message: result.error ? result.error.message : ""
  };
}

export function validateManifestWithImageData(
  manifest: Manifest
): ValidateReturn {
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

  return {
    success: !result.error,
    message: result.error ? result.error.message : ""
  };
}

export function validateComposeOrUnsafe(
  compose: Compose | ComposeUnsafe
): ValidateReturn {
  const result = Joi.validate(
    compose,
    Joi.object({
      version: Joi.string().required(),
      networks: Joi.object({
        network: Joi.object({
          driver: Joi.string()
        }).pattern(/./, Joi.any())
      }),
      volumes: Joi.object().pattern(/./, Joi.any()),
      services: Joi.object()
        .pattern(
          /./,
          Joi.object({
            image: Joi.string().required(),
            /* eslint-disable-next-line @typescript-eslint/camelcase */
            container_name: Joi.string(),
            restart: Joi.string(),
            environment: Joi.array().items(Joi.string()),
            volumes: Joi.array().items(Joi.string()),
            ports: Joi.array().items(Joi.string()),
            labels: Joi.object().pattern(/./, Joi.string()),
            dns: Joi.string()
          }).pattern(/./, Joi.any())
        )
        .required()
    }).pattern(/./, Joi.any())
  );

  return {
    success: !result.error,
    message: result.error ? result.error.message : ""
  };
}
