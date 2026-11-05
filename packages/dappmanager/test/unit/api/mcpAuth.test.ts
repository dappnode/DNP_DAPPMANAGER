import express from "express";
import http from "http";
import { expect } from "chai";
import * as db from "@dappnode/db";
import { AuthPasswordSession, parseMcpBearerToken } from "../../../src/api/auth/sessionAuth.js";
import { hashMcpApiKey } from "../../../src/api/auth/mcpApiKeyHash.js";
import type { AdminPasswordDb } from "../../../src/api/auth/adminPasswordDb.js";
import type { SessionsManager } from "../../../src/api/sessions/index.js";

describe("api / auth / MCP bearer scope", () => {
  beforeEach(() => {
    db.clearMainDb();
    db.mcpApiKey.set(hashMcpApiKey("mcp-secret"));
  });

  afterEach(() => {
    db.clearMainDb();
  });

  it("parses bearer tokens without accepting malformed headers", () => {
    expect(parseMcpBearerToken("Bearer abc123")).to.equal("abc123");
    expect(parseMcpBearerToken("bearer\tabc123")).to.equal("abc123");
    expect(parseMcpBearerToken("Basic abc123")).to.equal(null);
    expect(parseMcpBearerToken("Bearer")).to.equal(null);
    expect(parseMcpBearerToken("Bearer abc 123")).to.equal(null);
  });

  it("accepts the MCP key only on routes that opt into MCP bearer auth", async () => {
    const { server, baseUrl } = await startScopedAuthServer();
    try {
      const headers = { authorization: "Bearer mcp-secret" };

      expect(await status(`${baseUrl}/mcp`, "POST", headers)).to.equal(200);
      expect(await status(`${baseUrl}/upload`, "POST", headers)).to.equal(403);
      expect(await status(`${baseUrl}/rpc`, "POST", headers)).to.equal(403);
      expect(await status(`${baseUrl}/ping`, "GET", headers)).to.equal(403);
      expect(await status(`${baseUrl}/nexus/status`, "GET", headers)).to.equal(403);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it("rejects un-hashed stored MCP keys without rewriting them", async () => {
    db.mcpApiKey.set("mcp-secret");

    const { server, baseUrl } = await startScopedAuthServer();
    try {
      expect(await status(`${baseUrl}/mcp`, "POST", { authorization: "Bearer mcp-secret" })).to.equal(403);
      expect(db.mcpApiKey.get()).to.equal("mcp-secret");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});

async function startScopedAuthServer(): Promise<{ server: http.Server; baseUrl: string }> {
  const app = express();
  app.use(express.json());

  const auth = new AuthPasswordSession(fakeSessions, fakeAdminPasswordDb, {
    ADMIN_RECOVERY_FILE: "/tmp/dappmanager-mcp-auth-test-recovery"
  });

  app.post("/mcp", auth.onlyAdminOrMcpApiKey, (_req, res) => res.send({ ok: true }));
  app.post("/upload", auth.onlyAdmin, (_req, res) => res.send({ ok: true }));
  app.post("/rpc", auth.onlyAdmin, (_req, res) => res.send({ ok: true }));
  app.get("/ping", auth.onlyAdmin, (_req, res) => res.send({ ok: true }));
  app.get("/nexus/status", auth.onlyAdmin, (_req, res) => res.send({ ok: true }));

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to read server address");
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function status(url: string, method: "GET" | "POST", headers: Record<string, string>): Promise<number> {
  const res = await fetch(url, { method, headers });
  return res.status;
}

const fakeSessions: SessionsManager = {
  handler: (_req, _res, next) => next(),
  setSession: () => {},
  getSession: () => null,
  destroy: async () => {},
  getId: () => ""
};

const fakeAdminPasswordDb = {
  hasSomePassword: () => true,
  isAdmin: () => false,
  isValidPassword: () => false,
  setPassword: () => {},
  setIsAdmin: () => {},
  removeAllPasswords: () => {}
} as unknown as AdminPasswordDb;
