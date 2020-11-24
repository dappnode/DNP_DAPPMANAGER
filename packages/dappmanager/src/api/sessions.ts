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
  resave: false,
  saveUninitialized: false,
  secret: getSessionsSecretKey(),
  store: new SessionStoreLowDb({
    dbPath: params.DB_SESSIONS_PATH,
    ttl: 86400
  })
});
