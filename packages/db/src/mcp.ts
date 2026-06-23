import { dbMain } from "./dbFactory.js";

const mcpApiKeyDbKey = "mcp-api-key";
const mcpMutatingToolsEnabledDbKey = "mcp-mutating-tools-enabled";

export const mcpApiKey = dbMain.staticKey<string>(mcpApiKeyDbKey, "");
export const mcpMutatingToolsEnabled = dbMain.staticKey<boolean>(mcpMutatingToolsEnabledDbKey, false);
