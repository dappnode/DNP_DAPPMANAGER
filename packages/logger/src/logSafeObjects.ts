import { applyRecursivelyToStringValues } from "@dappnode/utils";
import { maxLength } from "./params.js";

const secretKeyRegex = /(password|passphrase|secret|private)/i;

/**
 * Transform the info object
 * 1. Any key in kwargs or the result that the name implies that contains
 *    sensitive data will be replace by ********
 * 2. When sending user settings the kwargs can potentially contain long
 *    base64 file contents. Trim them off
 * 3. Limit the length of objects.
 *    RPC calls like copyTo may content really big dataUrls as kwargs,
 *    prevent them from cluttering the userActionLogs file
 */
export const logSafeObjects = applyRecursivelyToStringValues((value, key) => {
  // Hide sensitive values
  if (secretKeyRegex.test(key)) return "**********";

  return (
    value
      // Trim base64 values
      .split(";base64,")[0]
      // Limit string size
      .slice(0, maxLength)
  );
});
