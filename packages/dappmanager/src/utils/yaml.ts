import yaml from "js-yaml";

/**
 * Wrapper around yaml dumping to keep the API consistent
 */
export function yamlDump<T>(obj: T): string {
  // skipInvalid (default: false) - do not throw on invalid types (like function in
  // the safe schema) and skip pairs and single values with such types.
  return yaml.safeDump(obj, { indent: 2, skipInvalid: true });
}
