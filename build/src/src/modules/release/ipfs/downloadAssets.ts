import * as ipfs from "../../ipfs";
import memoize from "memoizee";
import { Manifest, ComposeUnsafe } from "../../../types";
import { SetupSchema, SetupUiJson } from "../../../types-own";
import {
  validateManifestBasic,
  validateComposeOrUnsafe
} from "../parsers/validate";
import { parseComposeObj } from "../../../utils/dockerComposeFile";

export const downloadManifest = downloadAssetFactory<Manifest>({
  parse: jsonParse,
  validate: validateManifestBasic,
  maxLength: 100e3 // Limit size to ~100KB
});

export const downloadCompose = downloadAssetFactory<ComposeUnsafe>({
  parse: parseComposeObj,
  validate: validateComposeOrUnsafe,
  maxLength: 10e3 // Limit size to ~10KB
});

export const downloadSetupSchema = downloadAssetFactory<SetupSchema>({
  parse: jsonParse,
  validate: setupSchema => {
    return setupSchema;
  },
  maxLength: 100e3 // Limit size to ~100KB
});

export const downloadSetupUiJson = downloadAssetFactory<SetupUiJson>({
  parse: jsonParse,
  validate: setupUiJson => {
    return setupUiJson;
  },
  maxLength: 10e3 // Limit size to ~10KB
});

export const downloadDisclaimer = downloadAssetFactory<string>({
  parse: content => content,
  validate: disclaimer => disclaimer,
  maxLength: 100e3 // Limit size to ~10KB
});

/**
 * Download, parse and validate a DNP release file
 *
 * @param {string} hash "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
 */
/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
function downloadAssetFactory<T>({
  parse,
  validate,
  maxLength
}: {
  parse: (content: string) => T;
  validate: (data: T) => T;
  maxLength?: number;
}) {
  return memoize(async function downloadAsset(hash: string): Promise<T> {
    const content = await ipfs.catString({ hash, maxLength });
    const data: T = parse(content);
    return validate(data);
  });
}

/**
 * JSON.parse but with a better error message
 */
function jsonParse<T>(jsonString: string): T {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    throw Error(`Error parsing JSON: ${e.message}`);
  }
}
