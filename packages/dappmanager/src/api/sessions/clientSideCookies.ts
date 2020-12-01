import express from "express";
import cookieSession from "cookie-session";
import { SessionsHandler } from "./interface";
import { SessionsSecretDb } from "./secret";

interface ClientSideCookiesParams {
  DB_SESSIONS_PATH: string;
  SESSIONS_SECRET_FILE: string;
}

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

export class ClientSideCookies implements SessionsHandler {
  handler: express.RequestHandler;

  constructor(params: ClientSideCookiesParams) {
    const secretDb = new SessionsSecretDb(params.SESSIONS_SECRET_FILE);

    this.handler = cookieSession({
      secret: secretDb.get(),
      signed: true,
      // Cookie settings
      path: "/",
      httpOnly: true, // for security
      secure: false, // DAppNode UI is server over HTTP
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "strict" // for security
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
