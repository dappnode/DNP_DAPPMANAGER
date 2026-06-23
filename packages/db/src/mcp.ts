import { dbMain } from "./dbFactory.js";

/**
 * MCP API key configured from the admin UI. Stored in dbMain (critical,
 * never wiped) since it's a credential the user can create in-app instead of
 * passing the `MCP_API_KEY` env var to the dappmanager container. When set,
 * it takes precedence over the env var.
 */
const MCP_API_KEY = "mcp-api-key";

export const mcpApiKey = dbMain.staticKey<string>(MCP_API_KEY, "");
