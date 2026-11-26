import http from "http";
import { expect } from "chai";
import * as db from "@dappnode/db";
import {
  checkSameOrigin,
  CROSS_ORIGIN_REQUEST_REJECTED,
  socketIoAllowRequest,
  UNSUPPORTED_CONTENT_TYPE
} from "../../../src/api/sameOrigin.js";
import { hashMcpApiKey } from "../../../src/api/auth/mcpApiKeyHash.js";
import { startTestHttpApi, TestHttpApi } from "./startTestHttpApi.js";

const whitelist = ["http://localhost:3000", "http://my.dappnode"];
const pwaHost = "pwa.abcdef1234.dyndns.dappnode.io";
const evilOrigin = "https://evil.abcdef1234.dyndns.dappnode.io";

describe("api / sameOrigin", () => {
  describe("checkSameOrigin", () => {
    const cases: { id: string; headers: http.IncomingHttpHeaders; allowed: boolean }[] = [
      // Sec-Fetch-Site (primary signal)
      { id: "Sec-Fetch-Site same-origin", headers: { "sec-fetch-site": "same-origin" }, allowed: true },
      { id: "Sec-Fetch-Site none", headers: { "sec-fetch-site": "none" }, allowed: true },
      { id: "Sec-Fetch-Site same-site", headers: { "sec-fetch-site": "same-site" }, allowed: false },
      { id: "Sec-Fetch-Site cross-site", headers: { "sec-fetch-site": "cross-site" }, allowed: false },
      {
        id: "Sec-Fetch-Site same-site from a PWA sibling, even with a matching Host",
        headers: { "sec-fetch-site": "same-site", origin: evilOrigin, host: "evil.abcdef1234.dyndns.dappnode.io" },
        allowed: false
      },
      {
        id: "Sec-Fetch-Site same-origin behind the HTTPS portal",
        headers: {
          "sec-fetch-site": "same-origin",
          origin: `https://${pwaHost}`,
          host: pwaHost,
          "x-forwarded-proto": "https"
        },
        allowed: true
      },
      // Whitelisted dev origins
      {
        id: "whitelisted Origin with Sec-Fetch-Site same-site (UI dev server)",
        headers: { "sec-fetch-site": "same-site", origin: "http://localhost:3000", host: "localhost:5000" },
        allowed: true
      },
      {
        id: "whitelisted Origin without Sec-Fetch-Site",
        headers: { origin: "http://localhost:3000", host: "localhost:5000" },
        allowed: true
      },
      // Origin fallback (no Sec-Fetch-Site)
      {
        id: "Origin matches Host",
        headers: { origin: "http://dappnode.local", host: "dappnode.local" },
        allowed: true
      },
      {
        id: "Origin matches Host with port",
        headers: { origin: "http://192.168.1.10:8080", host: "192.168.1.10:8080" },
        allowed: true
      },
      {
        id: "Origin matches Host case-insensitively",
        headers: { origin: "http://Dappnode.Local", host: "dappnode.local" },
        allowed: true
      },
      {
        id: "HTTPS Origin behind the HTTPS portal (X-Forwarded-Proto https)",
        headers: { origin: `https://${pwaHost}`, host: pwaHost, "x-forwarded-proto": "https" },
        allowed: true
      },
      {
        id: "HTTP Origin behind the HTTPS portal (X-Forwarded-Proto https)",
        headers: { origin: `http://${pwaHost}`, host: pwaHost, "x-forwarded-proto": "https" },
        allowed: false
      },
      {
        id: "HTTPS Origin behind two proxies (X-Forwarded-Proto https, http)",
        headers: { origin: `https://${pwaHost}`, host: pwaHost, "x-forwarded-proto": "https, http" },
        allowed: true
      },
      {
        id: "HTTP Origin with X-Forwarded-Proto http",
        headers: { origin: "http://dappnode.local", host: "dappnode.local", "x-forwarded-proto": "http" },
        allowed: true
      },
      {
        id: "HTTPS Origin without X-Forwarded-Proto",
        headers: { origin: `https://${pwaHost}`, host: pwaHost },
        allowed: false
      },
      {
        id: "Origin from a PWA sibling subdomain",
        headers: { origin: evilOrigin, host: pwaHost, "x-forwarded-proto": "https" },
        allowed: false
      },
      {
        id: "Origin with different port",
        headers: { origin: "http://my.dappnode:81", host: "my.dappnode:80" },
        allowed: false
      },
      { id: "Origin null", headers: { origin: "null", host: "my.dappnode" }, allowed: false },
      { id: "Origin without Host", headers: { origin: "http://dappnode.local" }, allowed: false },
      {
        id: "Origin with non-http scheme",
        headers: { origin: "file://dappnode.local", host: "dappnode.local" },
        allowed: false
      },
      // Non-browser clients
      { id: "no Origin nor Sec-Fetch-Site", headers: { host: "dappmanager.dappnode" }, allowed: true },
      { id: "no headers at all", headers: {}, allowed: true }
    ];

    for (const { id, headers, allowed } of cases) {
      it(`${allowed ? "allows" : "rejects"} ${id}`, () => {
        expect(checkSameOrigin(headers, whitelist).allowed).to.equal(allowed);
      });
    }

    it("tells an admin behind a Host-rewriting proxy what the proxy must forward", () => {
      const check = checkSameOrigin({ origin: "http://node.lan", host: "my.dappnode" }, whitelist);
      if (check.allowed) throw Error("expected a rejection");
      expect(check.reason).to.include("Origin http://node.lan is not http://my.dappnode");
      expect(check.reason).to.include("proxy_set_header Host $host;");
    });

    it("does not add the proxy hint when the browser reports the request as same-site", () => {
      const check = checkSameOrigin({ "sec-fetch-site": "same-site", origin: evilOrigin, host: pwaHost }, whitelist);
      expect(check).to.deep.equal({ allowed: false, reason: "Sec-Fetch-Site same-site" });
    });
  });

  describe("socketIoAllowRequest", () => {
    function allowRequest(
      headers: http.IncomingHttpHeaders,
      req: { url?: string; _query?: Record<string, string> } = {}
    ): { err: string | null | undefined; success: boolean } {
      let result: { err: string | null | undefined; success: boolean } | undefined;
      socketIoAllowRequest(whitelist)({ headers, ...req } as http.IncomingMessage, (err, success) => {
        result = { err, success };
      });
      if (!result) throw Error("allowRequest callback not called");
      return result;
    }

    it("accepts same-origin handshakes", () => {
      expect(allowRequest({ "sec-fetch-site": "same-origin", origin: "http://my.dappnode" })).to.deep.equal({
        err: null,
        success: true
      });
    });

    it("accepts non-browser handshakes", () => {
      expect(allowRequest({}).success).to.equal(true);
    });

    it("rejects same-site handshakes", () => {
      expect(allowRequest({ "sec-fetch-site": "same-site", origin: evilOrigin })).to.deep.equal({
        err: CROSS_ORIGIN_REQUEST_REJECTED,
        success: false
      });
    });

    it("rejects foreign Origin handshakes from browsers without Sec-Fetch-Site", () => {
      expect(allowRequest({ origin: evilOrigin, host: pwaHost }).success).to.equal(false);
    });

    it("accepts polling handshakes without a JSONP callback", () => {
      const url = "/socket.io/?EIO=4&transport=polling&t=abcj";
      expect(allowRequest({}, { url }).success).to.equal(true);
      expect(allowRequest({}, { url, _query: { EIO: "4", transport: "polling", t: "abcj" } }).success).to.equal(true);
    });

    it("rejects JSONP polling handshakes, which a <script src> can read from another origin", () => {
      const sameOriginHeaders = { "sec-fetch-site": "same-origin", origin: "http://my.dappnode" };
      for (const headers of [{}, sameOriginHeaders]) {
        for (const jsonpQuery of ["j=0", "j=", "j", "%6A=0", "j=0&j=1"]) {
          const url = `/socket.io/?EIO=4&transport=polling&${jsonpQuery}`;
          expect(allowRequest(headers, { url }), url).to.deep.equal({
            err: CROSS_ORIGIN_REQUEST_REJECTED,
            success: false
          });
        }
        // As parsed by engine.io before it calls allowRequest
        expect(allowRequest(headers, { _query: { EIO: "4", transport: "polling", j: "0" } }).success).to.equal(false);
      }
    });
  });

  describe("startHttpApi", function () {
    this.timeout(20000);

    let api: TestHttpApi;
    let baseUrl: string;
    let host: string;

    before(async () => {
      api = await startTestHttpApi(whitelist);
      ({ baseUrl, host } = api);
    });

    after(async () => {
      await api.close();
    });

    async function post(
      route: string,
      headers: Record<string, string>,
      body: string
    ): Promise<{ status: number; body: string }> {
      const res = await fetch(`${baseUrl}${route}`, { method: "POST", headers, body });
      return { status: res.status, body: await res.text() };
    }

    const urlencodedRpc = "method=packageInstall&params[0][name]=evil.dnp.dappnode.eth";

    for (const route of ["/rpc", "/login", "/logout", "/register", "/change-pass", "/recover-pass", "/login-status"]) {
      it(`rejects urlencoded and text/plain bodies on ${route} with 415`, async () => {
        for (const contentType of [
          "application/x-www-form-urlencoded",
          "text/plain",
          "multipart/form-data; boundary=x"
        ]) {
          const res = await post(route, { "content-type": contentType }, urlencodedRpc);
          expect(res.status, `${route} ${contentType}`).to.equal(415);
          expect(res.body).to.include(UNSUPPORTED_CONTENT_TYPE);
        }
      });
    }

    it("accepts JSON bodies on the auth routes", async () => {
      const res = await post("/register", { "content-type": "application/json" }, JSON.stringify({}));
      // Reaches the handler: missing credentials, not a content-type or CSRF rejection
      expect(res.status).to.equal(400);
      expect(res.body).to.include("MISSING_CREDENTIALS");
    });

    it("reaches the session check for a JSON /rpc request without a session", async () => {
      const res = await post(
        "/rpc",
        { "content-type": "application/json; charset=utf-8", "sec-fetch-site": "same-origin" },
        JSON.stringify({ method: "ping", params: [] })
      );
      expect(res.status).to.equal(401);
      expect(res.body).to.include("NOT_REGISTERED");
    });

    it("rejects a same-site form POST to /rpc with 403 before parsing the body", async () => {
      const res = await post(
        "/rpc",
        {
          "content-type": "application/x-www-form-urlencoded",
          "sec-fetch-site": "same-site",
          origin: evilOrigin
        },
        urlencodedRpc
      );
      expect(res.status).to.equal(403);
      expect(res.body).to.include(CROSS_ORIGIN_REQUEST_REJECTED);
    });

    it("rejects a cross-origin JSON request to /login from a browser without Sec-Fetch-Site", async () => {
      const res = await post(
        "/login",
        { "content-type": "application/json", origin: evilOrigin },
        JSON.stringify({ username: "admin", password: "x" })
      );
      expect(res.status).to.equal(403);
      expect(res.body).to.include(CROSS_ORIGIN_REQUEST_REJECTED);
      // Same response an admin gets behind a reverse proxy that rewrites Host
      expect(JSON.parse(res.body).error.message).to.include(`is not http://${host}, where this request was received`);
      expect(res.body).to.include("proxy_set_header Host $host;");
    });

    it("keeps text/plain package routes working for non-browser clients", async () => {
      for (const route of ["/sign", "/data-send?key=k"]) {
        const res = await post(route, { "content-type": "text/plain" }, "some data");
        expect(res.status, route).to.equal(200);
        expect(JSON.parse(res.body), route).to.deep.equal({ bodyType: "string", bodyLength: "some data".length });
      }
    });

    it("rejects cross-origin Socket.io handshakes and accepts same-origin ones", async () => {
      const handshake = async (headers: Record<string, string>): Promise<number> => {
        const res = await fetch(`${baseUrl}/socket.io/?EIO=4&transport=polling`, { headers });
        await res.text();
        return res.status;
      };

      expect(await handshake({ "sec-fetch-site": "same-site", origin: evilOrigin })).to.equal(403);
      expect(await handshake({ origin: evilOrigin })).to.equal(403);
      expect(await handshake({ "sec-fetch-site": "same-origin", origin: baseUrl })).to.equal(200);
      expect(await handshake({ origin: `http://${host}` })).to.equal(200);
    });

    it("rejects JSONP Socket.io handshakes, with or without browser headers", async () => {
      const handshake = async (query: string, headers: Record<string, string> = {}): Promise<[number, string]> => {
        const res = await fetch(`${baseUrl}/socket.io/?EIO=4&transport=polling${query}`, { headers });
        return [res.status, await res.text()];
      };

      // The admin UI's own polling handshake over plain HTTP carries neither Origin nor Sec-Fetch-Site
      const [status, body] = await handshake("");
      expect(status).to.equal(200);
      expect(body.startsWith('0{"sid":')).to.equal(true);

      const headerSets: Record<string, string>[] = [{}, { "sec-fetch-site": "same-origin", origin: baseUrl }];
      for (const query of ["&j=0", "&j=", "&j", "&%6A=0", "&j=0&j=1"]) {
        for (const headers of headerSets) {
          const [status, body] = await handshake(query, headers);
          expect(status, query).to.equal(403);
          expect(body, query).to.not.include("___eio");
        }
      }
    });

    describe("MCP bearer key requests", () => {
      const mcpKey = "mcp-secret";
      const initialize = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } }
      });
      const mcpHeaders = {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        origin: "app://mcp-client"
      };

      before(() => {
        db.clearMainDb();
        db.mcpApiKey.set(hashMcpApiKey(mcpKey));
      });

      after(() => {
        db.clearMainDb();
      });

      it("lets an MCP client that sends its own Origin authenticate with the key", async () => {
        const res = await post("/mcp", { ...mcpHeaders, authorization: `Bearer ${mcpKey}` }, initialize);
        expect(res.status).to.equal(200);
        expect(res.body).to.include('"serverInfo"');
      });

      it("still checks the key", async () => {
        const res = await post("/mcp", { ...mcpHeaders, authorization: "Bearer wrong-key" }, initialize);
        expect(res.status).to.equal(401);
        expect(res.body).to.include("NOT_REGISTERED");
      });

      it("rejects a cross-origin /mcp request without a bearer key", async () => {
        const res = await post("/mcp", mcpHeaders, initialize);
        expect(res.status).to.equal(403);
        expect(res.body).to.include(CROSS_ORIGIN_REQUEST_REJECTED);
      });

      it("rejects a cross-origin /mcp request that carries a cookie, even with a bearer key", async () => {
        const res = await post(
          "/mcp",
          { ...mcpHeaders, authorization: `Bearer ${mcpKey}`, cookie: "session=x; session.sig=y" },
          initialize
        );
        expect(res.status).to.equal(403);
        expect(res.body).to.include(CROSS_ORIGIN_REQUEST_REJECTED);
      });

      it("does not exempt other routes that receive a bearer key", async () => {
        for (const route of ["/rpc", "/login", "/register", "/mcp/other"]) {
          const res = await post(route, { ...mcpHeaders, authorization: `Bearer ${mcpKey}` }, initialize);
          expect(res.status, route).to.equal(403);
          expect(res.body, route).to.include(CROSS_ORIGIN_REQUEST_REJECTED);
        }
      });
    });
  });
});
