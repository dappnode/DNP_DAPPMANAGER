import yaml from "js-yaml";

/**
 * Wrapper around yaml parsing to keep the API consistent
 * @param yamlString
 */
export function yamlParse<T>(yamlString: string): T {
  try {
    const parsedData = yaml.load(yamlString);
    if (!parsedData || typeof parsedData === "string") throw Error(`returned invalid object`);
    return parsedData as unknown as T;
  } catch (e) {
    throw Error(`Error parsing YAML: ${e.message}`);
  }
}

/**
 * Wrapper around yaml dumping to keep the API consistent
 */
export function yamlDump<T>(obj: T): string {
  // skipInvalid (default: false) - do not throw on invalid types (like function in
  // the safe schema) and skip pairs and single values with such types.
  return "---\n" + yaml.dump(obj, { indent: 2, skipInvalid: true });
}
