import { expect } from "chai";
import * as db from "@dappnode/db";
import { mcpApiKeyGenerate, mcpApiKeyGet, mcpApiKeyRemove } from "../../../src/calls/mcpApiKey.js";
import { isHashedMcpApiKey, verifyMcpApiKey } from "../../../src/api/auth/mcpApiKeyHash.js";

describe("calls / mcpApiKey", () => {
  afterEach(() => {
    db.clearMainDb();
  });

  it("stores generated MCP API keys as a digest and returns the raw key only once", async () => {
    const { apiKey } = await mcpApiKeyGenerate();
    const storedValue = db.mcpApiKey.get();

    expect(storedValue).to.not.equal(apiKey);
    expect(isHashedMcpApiKey(storedValue)).to.equal(true);
    expect(verifyMcpApiKey(apiKey, storedValue)).to.equal(true);
    expect(verifyMcpApiKey("wrong-key", storedValue)).to.equal(false);
    expect(await mcpApiKeyGet()).to.deep.equal({ hasApiKey: true, mutatingToolsEnabled: false });
  });

  it("ignores un-hashed stored MCP API key values without rewriting them", async () => {
    db.mcpApiKey.set("plain-mcp-secret");

    expect(await mcpApiKeyGet()).to.deep.equal({ hasApiKey: false, mutatingToolsEnabled: false });

    expect(db.mcpApiKey.get()).to.equal("plain-mcp-secret");
  });

  it("removes the MCP API key", async () => {
    await mcpApiKeyGenerate();

    await mcpApiKeyRemove();

    expect(db.mcpApiKey.get()).to.equal("");
    expect(await mcpApiKeyGet()).to.deep.equal({ hasApiKey: false, mutatingToolsEnabled: false });
  });
});
