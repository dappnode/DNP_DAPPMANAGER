import { expect } from "chai";
import { startTestHttpApi, TestHttpApi } from "./startTestHttpApi.js";

describe("api / auth routes", function () {
  this.timeout(30000);

  const username = "admin";
  const password = "current-password";
  const json = { "content-type": "application/json" };

  // Each test gets its own server, so its own rate limit budgets
  let api: TestHttpApi;

  beforeEach(async () => {
    api = await startTestHttpApi([]);
    api.adminPasswordDb.setPassword(username, password);
    api.adminPasswordDb.setIsAdmin(username, true);
  });

  afterEach(async () => {
    await api.close();
  });

  async function post(
    route: string,
    headers: Record<string, string> = {},
    body?: object | string
  ): Promise<{ status: number; body: string; limit: number; remaining: number }> {
    const res = await fetch(`${api.baseUrl}${route}`, {
      method: "POST",
      headers,
      body: typeof body === "object" ? JSON.stringify(body) : body
    });
    return {
      status: res.status,
      body: await res.text(),
      limit: Number(res.headers.get("ratelimit-limit")),
      remaining: Number(res.headers.get("ratelimit-remaining"))
    };
  }

  async function login(): Promise<Record<string, string>> {
    const res = await fetch(`${api.baseUrl}/login`, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ username, password })
    });
    expect(res.status).to.equal(200);
    const cookie = res.headers
      .getSetCookie()
      .map((setCookie) => setCookie.split(";")[0])
      .join("; ");
    return { ...json, cookie };
  }

  describe("requests without usable credentials", () => {
    const missingCredentials = { error: { name: "MISSING_CREDENTIALS", message: "MISSING_CREDENTIALS" } };

    for (const route of ["/login", "/register", "/change-pass", "/recover-pass"]) {
      it(`answers 400 on ${route} without a body, not 500`, async () => {
        const session = await login();
        for (const headers of [{ cookie: session.cookie }, session]) {
          const res = await post(route, headers);
          expect(res.status, route).to.equal(400);
          expect(JSON.parse(res.body), route).to.deep.equal(missingCredentials);
        }
      });

      it(`answers 400 on ${route} with credentials that are not strings, not 500`, async () => {
        const session = await login();
        const notStrings = { username: 1, password: 2, newPassword: ["x"], token: { a: 1 } };
        for (const body of [notStrings, [], { ...notStrings, username }]) {
          const res = await post(route, session, body);
          expect(res.status, route).to.equal(400);
          expect(JSON.parse(res.body), route).to.deep.equal(missingCredentials);
        }
      });
    }

    it("keeps /login-status and /logout working", async () => {
      const session = await login();
      expect((await post("/login-status", { cookie: session.cookie })).body).to.include(username);
      expect((await post("/logout", { cookie: session.cookie })).status).to.equal(200);
    });
  });

  describe("failed attempts limiter", () => {
    const wrongChange = { password: "wrong-password", newPassword: "new-password" };

    it("blocks /change-pass after too many wrong current passwords", async () => {
      const session = await login();
      const { limit } = await post("/change-pass", session, wrongChange);
      expect(limit).to.be.greaterThan(0);

      for (let i = 1; i < limit; i++) {
        const res = await post("/change-pass", session, wrongChange);
        expect(res.status, `attempt ${i + 1}`).to.equal(403);
        expect(res.body).to.include("WRONG_CREDENTIALS");
      }

      const blocked = await post("/change-pass", session, { password, newPassword: "new-password" });
      expect(blocked.status).to.equal(429);
      expect(api.adminPasswordDb.isValidPassword(username, password)).to.equal(true);

      // /login is not limited by it
      expect((await post("/login", json, { username, password })).status).to.equal(200);
    });

    it("does not count /change-pass requests without a session", async () => {
      const session = await login();
      const { limit } = await post("/change-pass", session, wrongChange);
      for (let i = 0; i < limit + 1; i++) {
        const res = await post("/change-pass", json, wrongChange);
        expect(res.status).to.equal(403);
        expect(res.body).to.include("NOT_LOGGED_IN");
      }

      const res = await post("/change-pass", session, { password, newPassword: "new-password" });
      expect(res.status).to.equal(200);
      expect(api.adminPasswordDb.isValidPassword(username, "new-password")).to.equal(true);
    });

    it("does not count /nexus/auth/login requests without a session", async () => {
      const session = await login();
      // Invalid input: rejected by the handler before any external exchange
      const first = await post("/nexus/auth/login", session, {});
      expect(first.status).to.equal(400);
      expect(first.limit).to.be.greaterThan(0);

      expect(first.remaining).to.equal(first.limit - 1);

      for (let i = 0; i < first.limit + 1; i++) {
        const res = await post("/nexus/auth/login", json, {});
        expect(res.status).to.equal(403);
        expect(res.body).to.include("NOT_LOGGED_IN");
      }

      // Only the two requests with a session used the budget
      const second = await post("/nexus/auth/login", session, {});
      expect(second.status).to.equal(400);
      expect(second.remaining).to.equal(first.limit - 2);
    });
  });
});
