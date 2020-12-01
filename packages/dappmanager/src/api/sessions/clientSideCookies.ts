import express from "express";
import cookieSession from "cookie-session";
import { SessionsHandler } from "./interface";
import { SessionsSecretDb } from "./secret";

export interface ClientSideCookiesParams {
  SESSIONS_SECRET_FILE: string;
  SESSIONS_MAX_TTL_MS: number;
  SESSIONS_TTL_MS: number;
}

declare global {
  interface CookieSessionObject {
    isAdmin: boolean;
    // Unix timestamp in miliseconds
    expires: number;
  }
}

export class ClientSideCookies implements SessionsHandler {
  handler: express.RequestHandler;
  maxTtlMs: number;

  constructor(params: ClientSideCookiesParams) {
    const secretDb = new SessionsSecretDb(params.SESSIONS_SECRET_FILE);
    this.maxTtlMs = params.SESSIONS_MAX_TTL_MS;
    this.handler = cookieSession({
      secret: secretDb.get(),
      signed: true,
      // Cookie settings
      path: "/",
      httpOnly: true, // Cookie not accessible from client-side js
      secure: false, // DAppNode UI is served over HTTP
      maxAge: params.SESSIONS_TTL_MS,
      sameSite: "strict" // Prevent cross-site issues
    });
  }

  makeAdmin(req: express.Request): void {
    if (!req.session) throw new Error("No session");
    req.session.isAdmin = true;
    // Add expires property as part of the payload so the
    // signed cookie will eventually be useless
    req.session.expires = Date.now() + this.maxTtlMs;
  }

  isAdmin(req: express.Request): boolean {
    return Boolean(
      // Has a sessions
      req.session &&
        // Is admin
        req.session.isAdmin &&
        // Not expired
        req.session.expires &&
        Date.now() < parseInt((req.session.expires as unknown) as string)
    );
  }

  async destroy(req: express.Request): Promise<void> {
    if (!req.session) throw new Error("No session");
    delete req.session.isAdmin;
  }

  getId(req: express.Request): string {
    return req.session?.id;
  }
}
