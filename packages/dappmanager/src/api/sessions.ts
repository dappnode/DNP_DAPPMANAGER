import crypto from "crypto";
import Session from "express-session";
import * as db from "../db";
import params from "../params";
import { SessionStoreLowDb } from "./sessionsDb";

export function getSessionsSecretKey(): string {
  let secretKey = db.sessionsSecretKey.get();
  if (!secretKey) {
    secretKey = crypto.randomBytes(32).toString("hex");
    db.sessionsSecretKey.set(secretKey);
  }
  return secretKey;
}

export const sessionHandler = Session({
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
    dbPath: params.DB_SESSIONS_PATH,
    ttl: 86400
  })
});
