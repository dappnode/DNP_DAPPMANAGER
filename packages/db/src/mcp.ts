import { dbMain } from "./dbFactory.js";

const mcpApiKeyDbKey = "mcp-api-key";
const mcpMutatingToolsEnabledDbKey = "mcp-mutating-tools-enabled";

// Stores a one-way digest of the MCP bearer token.
export const mcpApiKey = dbMain.staticKey<string>(mcpApiKeyDbKey, "");
export const mcpMutatingToolsEnabled = dbMain.staticKey<boolean>(mcpMutatingToolsEnabledDbKey, false);
