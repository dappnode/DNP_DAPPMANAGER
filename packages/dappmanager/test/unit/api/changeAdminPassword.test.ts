import fs from "fs";
import os from "os";
import path from "path";
import http from "http";
import { AddressInfo } from "net";
import express from "express";
import { expect } from "chai";
import { AuthPasswordSession } from "../../../src/api/auth/sessionAuth.js";
import { AdminPasswordDb } from "../../../src/api/auth/adminPasswordDb.js";
import type { SessionsManager } from "../../../src/api/sessions/index.js";

describe("api / auth / changeAdminPassword", function () {
  this.timeout(10000);

  const username = "admin";
  const currentPassword = "current-password";
  const newPassword = "new-password";

  let tmpDir: string;
  let adminPasswordDb: AdminPasswordDb;
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dappmanager-change-pass-test-"));
    adminPasswordDb = new AdminPasswordDb({
      ADMIN_PASSWORDS_JSON_FILE: path.join(tmpDir, "passwords.json"),
      ADMIN_STATUS_JSON_FILE: path.join(tmpDir, "status.json")
    });
    adminPasswordDb.setPassword(username, currentPassword);
    adminPasswordDb.setIsAdmin(username, true);

    const sessions: SessionsManager = {
      handler: (_req, _res, next) => next(),
      setSession: () => {},
      getSession: () => ({ isAdmin: true, username }),
      destroy: async () => {},
      getId: () => ""
    };
    const auth = new AuthPasswordSession(sessions, adminPasswordDb, {
      ADMIN_RECOVERY_FILE: path.join(tmpDir, "recovery.txt")
    });

    const app = express();
    app.use(express.json());
    app.post("/change-pass", auth.changeAdminPassword);
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  async function changePass(body: object): Promise<{ status: number; body: string }> {
    const res = await fetch(`${baseUrl}/change-pass`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    return { status: res.status, body: await res.text() };
  }

  it("rejects a wrong current password and keeps the existing one", async () => {
    const res = await changePass({ password: "wrong-password", newPassword });
    expect(res.status).to.equal(403);
    expect(res.body).to.include("WRONG_CREDENTIALS");
    expect(adminPasswordDb.isValidPassword(username, currentPassword)).to.equal(true);
    expect(adminPasswordDb.isValidPassword(username, newPassword)).to.equal(false);
  });

  it("rejects a missing current password", async () => {
    const res = await changePass({ newPassword });
    expect(res.status).to.equal(400);
    expect(res.body).to.include("MISSING_CREDENTIALS");
    expect(adminPasswordDb.isValidPassword(username, currentPassword)).to.equal(true);
  });

  it("changes the password when the current password is correct", async () => {
    const res = await changePass({ password: currentPassword, newPassword });
    expect(res.status).to.equal(200);
    expect(adminPasswordDb.isValidPassword(username, newPassword)).to.equal(true);
    expect(adminPasswordDb.isValidPassword(username, currentPassword)).to.equal(false);
  });
});
