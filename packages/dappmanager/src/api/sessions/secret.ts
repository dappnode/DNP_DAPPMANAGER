import crypto from "crypto";
import * as db from "../../db";

export function getSessionsSecretKey(): string {
  let secretKey = db.sessionsSecretKey.get();
  if (!secretKey) {
    secretKey = crypto.randomBytes(32).toString("hex");
    db.sessionsSecretKey.set(secretKey);
  }
  return secretKey;
}
