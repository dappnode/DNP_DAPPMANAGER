import bcrypt from "bcryptjs";

const difficultyFactor = 10;
const mcpApiKeyHashRegex = /^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/;

export function hashMcpApiKey(apiKey: string): string {
  return bcrypt.hashSync(apiKey, difficultyFactor);
}

export function isHashedMcpApiKey(value: string): boolean {
  return mcpApiKeyHashRegex.test(value);
}

export function verifyMcpApiKey(providedKey: string, configuredValue: string): boolean {
  if (!isHashedMcpApiKey(configuredValue)) return false;

  return bcrypt.compareSync(providedKey, configuredValue);
}
