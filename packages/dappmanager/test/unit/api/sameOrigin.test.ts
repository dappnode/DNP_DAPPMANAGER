import fs from "fs";
import os from "os";
import path from "path";
import http from "http";
import { AddressInfo } from "net";
import type express from "express";
import { expect } from "chai";
import type { EventBus } from "@dappnode/eventbus";
import type { Routes } from "@dappnode/types";
import {
  checkSameOrigin,
  CROSS_ORIGIN_REQUEST_REJECTED,
  socketIoAllowRequest,
  UNSUPPORTED_CONTENT_TYPE
} from "../../../src/api/sameOrigin.js";
import { startHttpApi } from "../../../src/api/startHttpApi.js";
import { AdminPasswordDb } from "../../../src/api/auth/adminPasswordDb.js";

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
  });

  describe("socketIoAllowRequest", () => {
    function allowRequest(headers: http.IncomingHttpHeaders): { err: string | null | undefined; success: boolean } {
      let result: { err: string | null | undefined; success: boolean } | undefined;
      socketIoAllowRequest(whitelist)({ headers } as http.IncomingMessage, (err, success) => {
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
  });

  describe("startHttpApi", function () {
    this.timeout(20000);

    let server: http.Server;
    let baseUrl: string;
    let host: string;
    let tmpDir: string;

    before(async () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dappmanager-same-origin-test-"));
      const params = {
        AUTH_IP_ALLOW_LOCAL_IP: false,
        HTTP_API_PORT: 0,
        UI_FILES_PATH: tmpDir,
        HTTP_CORS_WHITELIST: whitelist,
        ADMIN_RECOVERY_FILE: path.join(tmpDir, "recovery.txt"),
        SESSIONS_SECRET_FILE: path.join(tmpDir, "sessions-secret.txt"),
        ADMIN_PASSWORDS_JSON_FILE: path.join(tmpDir, "passwords.json"),
        ADMIN_STATUS_JSON_FILE: path.join(tmpDir, "status.json"),
        SESSIONS_MAX_TTL_MS: 60_000,
        SESSIONS_TTL_MS: 60_000
      };
      // Report how the body was parsed without reflecting request data
      const describeBody: express.RequestHandler = (req, res) => {
        const body: unknown = req.body;
        res.json({ bodyType: typeof body, bodyLength: typeof body === "string" ? body.length : null });
      };
      const notUsed = (): void => {
        throw Error("not used");
      };
      const noop = (_req: unknown, _res: unknown, next: () => void): void => next();

      server = startHttpApi({
        params,
        logs: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
        routes: {
          containerLogs: notUsed,
          dataSend: describeBody,
          download: notUsed,
          downloadUserActionLogs: notUsed,
          downloadWireguardConfig: notUsed,
          env: notUsed,
          fileDownload: notUsed,
          globalEnvs: notUsed,
          packageManifest: notUsed,
          metrics: notUsed,
          publicPackagesData: notUsed,
          sign: describeBody,
          upload: notUsed
        },
        limiterMiddleware: noop,
        counterViewsMiddleware: noop,
        ethForwardMiddleware: noop,
        routesLogger: {},
        methods: {} as Routes,
        subscriptionsLogger: {},
        adminPasswordDb: new AdminPasswordDb(params),
        eventBus: fakeEventBus,
        isNewDappmanagerVersion: () => false,
        getIpfsFileBytes: async () => new Uint8Array()
      });
      if (!server.listening) await new Promise((resolve) => server.once("listening", resolve));
      const { port } = server.address() as AddressInfo;
      host = `127.0.0.1:${port}`;
      baseUrl = `http://${host}`;
    });

    after(async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      fs.rmSync(tmpDir, { recursive: true, force: true });
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
  });
});

// mapSubscriptionsToEventBus only registers listeners and emits initial requests
const fakeEventBus = new Proxy(
  {},
  {
    get: () => ({ on: () => {}, emit: () => {} })
  }
) as unknown as EventBus;
