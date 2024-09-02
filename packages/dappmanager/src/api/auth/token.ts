import crypto from "crypto";

export function getRandomAlphanumericToken(len: number): string {
  let token = "";

  while (token.length < len) {
    token += crypto.randomBytes(len).toString("base64").replace(/\+/g, "").replace(/\//g, "").replace(/=/g, "");
  }

  return token.slice(0, len);
}
