import express from "express";
import cookieSession from "cookie-session";
import { SessionData, SessionsManager } from "./interface.js";
import { SessionsSecretDb } from "./secret.js";

export interface ClientSideCookiesParams {
  SESSIONS_SECRET_FILE: string;
  SESSIONS_MAX_TTL_MS: number;
  SESSIONS_TTL_MS: number;
}

declare global {
  interface CookieSessionObject extends SessionData {
    // Unix timestamp in miliseconds
    expires: number;
  }
}

export class ClientSideCookies implements SessionsManager {
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

  setSession(req: express.Request, data: SessionData): void {
    if (!req.session) throw new Error("No session");
    Object.assign(req.session, data);

    // Add expires property as part of the payload so the
    // signed cookie will eventually be useless
    req.session.expires = Date.now() + this.maxTtlMs;
  }

  getSession(req: express.Request): SessionData | null {
    if (!req.session) return null;

    // Reject session if the cookie is already expired
    const expires = parseInt(req.session.expires);
    if (!expires || Date.now() > expires) return null;

    return (req.session as SessionData) || null;
  }

  async destroy(req: express.Request): Promise<void> {
    if (!req.session) throw new Error("No session");
    delete req.session.isAdmin;
  }

  getId(req: express.Request): string {
    return req.session?.id;
  }
}
