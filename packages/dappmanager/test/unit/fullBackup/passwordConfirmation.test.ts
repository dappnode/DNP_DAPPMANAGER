import fs from "fs";
import os from "os";
import path from "path";
import http from "http";
import express from "express";
import { expect } from "chai";
import { AuthPasswordSession } from "../../../src/api/auth/index.js";
import { AdminPasswordDb } from "../../../src/api/auth/adminPasswordDb.js";
import { SessionsManager } from "../../../src/api/sessions/index.js";

describe("fullBackup / onlyAdminWithPasswordConfirmation", () => {
  let dir: string;
  let server: http.Server;
  let url: string;
  let loggedIn: { isAdmin: boolean; username: string } | null;
  let reachedRoute = false;

  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "full-backup-auth-"));
    const adminPasswordDb = new AdminPasswordDb({
      ADMIN_PASSWORDS_JSON_FILE: path.join(dir, "passwords.json"),
      ADMIN_STATUS_JSON_FILE: path.join(dir, "status.json")
    });
    adminPasswordDb.setPassword("admin", "correct admin password");
    adminPasswordDb.setIsAdmin("admin", true);

    const sessions = { getSession: () => loggedIn } as unknown as SessionsManager;
    const auth = new AuthPasswordSession(sessions, adminPasswordDb, {
      ADMIN_RECOVERY_FILE: path.join(dir, "recovery.txt")
    });

    const app = express();
    app.use(express.json());
    app.post("/full-backup", auth.onlyAdminWithPasswordConfirmation, (_req, res) => {
      reachedRoute = true;
      res.send({ ok: true });
    });
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    url = `http://127.0.0.1:${(server.address() as { port: number }).port}/full-backup`;
  });

  after(() => {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  beforeEach(() => {
    loggedIn = { isAdmin: true, username: "admin" };
    reachedRoute = false;
  });

  async function post(body: unknown): Promise<number> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: "session=x" },
      body: JSON.stringify(body)
    });
    return res.status;
  }

  it("passes with a session and the correct admin password", async () => {
    expect(await post({ adminPassword: "correct admin password", password: "backup password" })).to.equal(200);
    expect(reachedRoute).to.equal(true);
  });

  it("rejects a wrong admin password", async () => {
    expect(await post({ adminPassword: "wrong", password: "backup password" })).to.equal(403);
    expect(reachedRoute).to.equal(false);
  });

  it("rejects a missing admin password", async () => {
    expect(await post({ password: "backup password" })).to.equal(400);
    expect(reachedRoute).to.equal(false);
  });

  it("rejects the correct password without an admin session", async () => {
    loggedIn = null;
    expect(await post({ adminPassword: "correct admin password" })).to.equal(403);
    expect(reachedRoute).to.equal(false);
  });
});
