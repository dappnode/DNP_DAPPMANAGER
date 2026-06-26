import { createHash, timingSafeEqual } from "crypto";

const mcpApiKeyHashPrefix = "sha256:";
const mcpApiKeyHashRegex = /^sha256:[a-f0-9]{64}$/;

export function hashMcpApiKey(apiKey: string): string {
  return `${mcpApiKeyHashPrefix}${createHash("sha256").update(apiKey, "utf8").digest("hex")}`;
}

export function isHashedMcpApiKey(value: string): boolean {
  return mcpApiKeyHashRegex.test(value);
}

export function verifyMcpApiKey(providedKey: string, configuredValue: string): boolean {
  if (!isHashedMcpApiKey(configuredValue)) return false;

  return timingSafeEqualString(hashMcpApiKey(providedKey), configuredValue);
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}
