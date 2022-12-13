import { FileFormat } from "../../../types";
import { yamlParse } from "../../../utils/yaml";

export function parseAsset<T>(data: string, format: FileFormat): T {
  switch (format) {
    case FileFormat.YAML:
      return yamlParse(data);
    case FileFormat.JSON:
      return jsonParse(data);
    case FileFormat.TEXT:
      return data as unknown as T;
    default:
      throw Error(`Attempting to parse unknown format ${format}`);
  }
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
