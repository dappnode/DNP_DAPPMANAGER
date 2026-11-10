import { describe, expect, it } from "vitest";
import { parseTailscaleStatus, validateTailscaleAuthUrl } from "../../../pages/vpn/tailscaleStatus";

const now = 1793260800;
const valid = {
  version: 1,
  state: "NeedsLogin",
  online: false,
  authUrl: "https://login.tailscale.com/a/EXAMPLE?x=1&next=%2Fa%3Fb%3D2",
  updatedAt: now
};
const parse = (patch: Record<string, unknown>) => parseTailscaleStatus(JSON.stringify({ ...valid, ...patch }), now);

describe("Tailscale status parser", () => {
  it("preserves the exact valid link and query", () => {
    expect(parse({})).toEqual(valid);
    expect(parse({ updatedAt: now - 90 })).not.toBeNull();
  });
  it.each([undefined, null, {}, 1, "", "{", "null", "[]", "{}"])("rejects malformed or missing reports: %j", (raw) => {
    expect(parseTailscaleStatus(raw, now)).toBeNull();
  });
  it.each([
    { version: "1" },
    { version: 2 },
    { state: "Unknown" },
    { state: null },
    { online: "false" },
    { online: true },
    { authUrl: {} },
    { authUrl: undefined },
    { updatedAt: "1793260800" },
    { updatedAt: 0 },
    { updatedAt: -1 },
    { updatedAt: now + 0.1 },
    { updatedAt: now * 1000 },
    { updatedAt: now + 6 },
    { updatedAt: now - 91 },
    { updatedAt: Number.MAX_SAFE_INTEGER + 1 },
    { state: "Running", authUrl: valid.authUrl }
  ])("rejects invalid fields: %j", (patch) => expect(parse(patch)).toBeNull());
  it.each(["NoState", "NeedsLogin", "NeedsMachineAuth", "Stopped", "Starting", "Running", "Unavailable"])(
    "accepts %s",
    (state) => {
      expect(parse({ state, authUrl: null })?.state).toBe(state);
    }
  );
  it("accepts online only in Running", () => {
    expect(parse({ state: "Running", online: true, authUrl: null })?.online).toBe(true);
  });
  it.each([
    "http://login.tailscale.com/a/key",
    "https://login.tailscale.com.evil/a/key",
    "https://user:pass@login.tailscale.com/a/key",
    "https://login.tailscale.com:443/a/key",
    "https://LOGIN.tailscale.com/a/key",
    "https://login.tailscale.com/a/",
    "https://login.tailscale.com/a/?key=abc",
    "https://login.tailscale.com/a/../key",
    "https://login.tailscale.com/a/key#",
    "https://login.tailscale.com/a/key#fragment",
    "https://login.tailscale.com/a/key\\x",
    "https://login.tailscale.com/a/key\n",
    "https://login.tailscale.com/a/key ",
    "https://login.tailscale.com/a/key\u007f",
    'https://login.tailscale.com/a/key"',
    "https://login.tailscale.com/a/key'",
    "https://login.tailscale.com/a/<key>",
    "https://login.tailscale.com/a/é",
    "https://login.tailscale.com/a/" + "x".repeat(512)
  ])("discards unsafe URLs without throwing", (authUrl) => {
    expect(validateTailscaleAuthUrl(authUrl)).toBeNull();
    expect(parse({ authUrl })?.authUrl).toBeNull();
  });
  it("does not truncate and enforces the wire limit", () => {
    const authUrl = "https://login.tailscale.com/a/" + "x".repeat(482);
    expect(authUrl.length).toBe(512);
    expect(validateTailscaleAuthUrl(authUrl)).toBe(authUrl);
    expect(parseTailscaleStatus(" ".repeat(701), now)).toBeNull();
  });
});
