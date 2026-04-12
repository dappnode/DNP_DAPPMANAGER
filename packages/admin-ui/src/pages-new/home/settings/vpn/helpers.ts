const MAX_ID_LENGTH = 80;

/**
 * Coerce a VPN device name to contain only alphanumeric characters
 * and stay within the max length limit.
 */
export function coerceDeviceName(name = ""): string {
  name = name.replace(/\W/g, "");
  if (name.length > MAX_ID_LENGTH) name = name.slice(0, MAX_ID_LENGTH);
  return name;
}

export { MAX_ID_LENGTH };
