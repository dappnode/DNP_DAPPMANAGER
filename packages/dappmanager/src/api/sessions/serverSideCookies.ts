import express from "express";
import Session from "express-session";
import { SessionStoreLowDb } from "./sessionsDb";
import { SessionsSecretDb } from "./secret";
import { SessionsHandler } from "./interface";

interface ServerSideCookiesParams {
  DB_SESSIONS_PATH: string;
  SESSIONS_SECRET_FILE: string;
}

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

export class ServerSideCookies implements SessionsHandler {
  handler: express.RequestHandler;

  constructor(params: ServerSideCookiesParams) {
    const secretDb = new SessionsSecretDb(params.SESSIONS_SECRET_FILE);

    this.handler = Session({
      cookie: {
        path: "/",
        httpOnly: true, // for security
        secure: false, // DAppNode UI is server over HTTP
        maxAge: 86400, // 1 day
        sameSite: "strict" // for security
      },
      resave: true, // Recommended by express-session docs.
      rolling: false, // Cookie expires on original maxAge
      saveUninitialized: false, // Reduce server storage
      secret: secretDb.get(),
      store: new SessionStoreLowDb({
        dbPath: params.DB_SESSIONS_PATH,
        ttl: 86400
      })
    });
  }

  makeAdmin(req: express.Request): void {
    if (!req.session) throw new Error("No session");
    req.session.isAdmin = true;
  }

  isAdmin(req: express.Request): boolean {
    return Boolean(req.session?.isAdmin);
  }

  async destroy(req: express.Request): Promise<void> {
    if (!req.session) throw new Error("No session");
    await new Promise((resolve, reject) => {
      req.session.destroy(err => (err ? reject(err) : resolve()));
    });
  }

  getId(req: express.Request): string {
    return req.session?.id;
  }
}
