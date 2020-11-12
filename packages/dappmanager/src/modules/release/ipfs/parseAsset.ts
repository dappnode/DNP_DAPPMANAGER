import { yamlParse } from "../../../utils/yaml";
import { Format } from "./types";

export function parseAsset<T>(data: string, format: Format): T {
  switch (format) {
    case "YAML":
      return yamlParse(data);
    case "JSON":
      return jsonParse(data);
    case "TEXT":
      return (data as unknown) as T;
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
