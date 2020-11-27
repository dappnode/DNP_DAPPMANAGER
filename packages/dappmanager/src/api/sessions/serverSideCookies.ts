import express from "express";
import Session from "express-session";
import { SessionStoreLowDb } from "./sessionsDb";
import { HttpError } from "../utils";
import { getSessionsSecretKey } from "./secret";
import { SessionsHandler } from "./interface";

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

export class ServerSideCookies implements SessionsHandler {
  handler: express.RequestHandler;

  constructor({ DB_SESSIONS_PATH }: { DB_SESSIONS_PATH: string }) {
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
      secret: getSessionsSecretKey(),
      store: new SessionStoreLowDb({
        dbPath: DB_SESSIONS_PATH,
        ttl: 86400
      })
    });
  }

  makeAdmin(req: express.Request): void {
    if (!req.session) throw new HttpError("No session");
    req.session.isAdmin = true;
  }

  isAdmin(req: express.Request): boolean {
    return Boolean(req.session?.isAdmin);
  }

  async destroy(req: express.Request): Promise<void> {
    if (!req.session) throw new HttpError("No session");
    await new Promise((resolve, reject) => {
      req.session.destroy(err => (err ? reject(err) : resolve()));
    });
  }

  getId(req: express.Request): string {
    return req.session?.id;
  }
}
